const fs = require('fs')
const path = require('path')
const { utf8ToHex, fromWei } = require('web3-utils')
const { EMPTY_CALLS_SCRIPT } = require('@aragon/contract-helpers-test/src/aragon-os/evmScript')
const { bn, getEventArgument, MAX_UINT192, ZERO_ADDRESS, EMPTY_BYTES } = require('@aragon/contract-helpers-test')

const config = require('../andao.config')
const { ipfsUpload } = require('./ipfs-pinner')
const {
  encodeTokenTransfer,
  encodeAppUpgrade,
  encodeConfigGovernorChange,
  encodeFundsGovernorChange,
  encodeModulesGovernorChange,
  encodeAgreementChange,
  encodeVotingSupportChange,
  encodeCourtConfigChange
} = require('./encoder')

module.exports = class ANDAO {
  constructor (network) {
    this.network = network
    this.config = config[network]
    this._agents = []
    this._votings = []
    this.stakingPools = {}
  }

  async dao() {
    if (!this._dao) this._dao = await this._getInstance('Kernel', this.config.dao)
    return this._dao
  }

  async agent(index) {
    if (!this._agents[index]) this._agents[index] = await this._getInstance('Agent', this.config.agents[index])
    return this._agents[index]
  }

  async voting(index) {
    if (!this._votings[index]) this._votings[index] = await this._getInstance('DisputableVoting', this.config.votings[index])
    return this._votings[index]
  }

  async agreement() {
    if (!this._agreement) this._agreement = await this._getInstance('Agreement', this.config.agreement)
    return this._agreement
  }

  async getDisputeFees() {
    const { arbitrator: arbitratorAddress } = await this.setting()
    const arbitrator = await this._getInstance('IArbitrator', arbitratorAddress)
    const { feeToken: feeTokenAddress, feeAmount } = await arbitrator.getDisputeFees()
    const feeToken = await this._getInstance('ERC20', feeTokenAddress)
    return { feeToken, feeAmount }
  }

  async setting() {
    const agreement = await this.agreement()
    const settingId = await agreement.getCurrentSettingId()
    return agreement.getSetting(settingId)
  }

  async collateralRequirement(index) {
    const agreement = await this.agreement()
    const { currentCollateralRequirementId } = await agreement.getDisputableInfo(this.config.votings[index])
    const { collateralToken: tokenAddress, actionAmount, challengeAmount, challengeDuration } = await agreement.getCollateralRequirement(this.config.votings[index], currentCollateralRequirementId)
    const collateralToken = await this._getInstance('ERC20', tokenAddress)
    return { collateralToken, actionCollateral: actionAmount, challengeCollateral: challengeAmount, challengeDuration }
  }

  async stakingFactory() {
    if (!this._stakingFactory) {
      const agreement = await this.agreement()
      this._stakingFactory = await this._getInstance('StakingFactory', await agreement.stakingFactory())
    }
    return this._stakingFactory
  }

  async stakingPool(token) {
    if (!this.stakingPools[token.address]) {
      const stakingFactory = await this.stakingFactory()
      let stakingAddress = await stakingFactory.getInstance(token.address)

      if (stakingAddress === ZERO_ADDRESS) {
        const receipt = await stakingFactory.getOrCreateInstance(token.address)
        stakingAddress = getEventArgument(receipt, 'NewStaking', 'instance')
      }

      this.stakingPools[token.address] = await this._getInstance('Staking', stakingAddress)
    }

    return this.stakingPools[token.address]
  }

  async sign(signer) {
    const agreement = await this.agreement()
    const { mustSign } = await agreement.getSigner(signer)
    if (mustSign) {
      console.log(`Signing the agreement for ${signer}...`)
      const currentSettingId = await agreement.getCurrentSettingId()
      await agreement.sign(currentSettingId, { from: signer })
      console.log('Agreement signed!')
    } else {
      console.log('Signer is up to date!')
    }

    console.log('Allowing Agreement as a lock manager...')
    const { collateralToken } = await this.collateralRequirement(0)
    const staking = await this.stakingPool(collateralToken)
    const { allowance } = await staking.getLock(signer, agreement.address)
    if (allowance.eq(bn(0))) {
      await staking.allowManager(agreement.address, MAX_UINT192, EMPTY_BYTES, { from: signer })
      console.log('Agreement allowed!')
    } else {
      console.log('Agreement already allowed as a lock manager!')
    }
  }

  async vote(index, voteId, supports, voter) {
    console.log(`Voting on voting #${index + 1}...`)
    const voting = await this.voting(index)
    return voting.vote(voteId, this._castSupport(supports), { from: voter })
  }

  async setRepresentative(index, representative, voter) {
    console.log(`Setting representative on voting #${index + 1}...`)
    const voting = await this.voting(index)
    return voting.setRepresentative(representative, { from: voter })
  }

  async delegateVote(index, voteId, supports, voters, representative) {
    console.log(`Delegating vote on voting #${index + 1}...`)
    const voting = await this.voting(index)
    return voting.voteOnBehalfOf(voteId, this._castSupport(supports), voters, { from: representative })
  }

  async executeVote(index, voteId, script, from) {
    console.log(`Executing vote on voting #${index + 1}...`)
    const voting = await this.voting(index)
    return voting.executeVote(voteId, script, { from })
  }

  async newPoll(index, question, submitter) {
    console.log(`Creating poll on voting #${index + 1}...`)
    return this.newVote(index, EMPTY_CALLS_SCRIPT, question, submitter)
  }

  async newTokenTransfer(index, token, recipient, amount, justification, submitter) {
    console.log(`Creating finance transfer proposal on voting #${index + 1}...`)
    const script = encodeTokenTransfer(this.config.agents[index], token, recipient, amount)
    return this.newVote(index, script, justification, submitter)
  }

  async upgradeApp(appId, base, justification, submitter) {
    const index  = 1
    console.log(`Creating a proposal on voting #${index + 1} to upgrade app ${appId} to base address ${base}...`)
    const script = encodeAppUpgrade(this.config.dao, appId, base)
    return this.newVote(index, script, justification, submitter)
  }

  async changeAgreement(rawContent, justification, submitter) {
    const index  = 1
    console.log(`Creating a proposal on voting #${index + 1} to change the agreement version...`)
    const { arbitrator, aragonAppFeesCashier, title } = await this.setting()
    const content = await this._loadAgreement(rawContent, submitter)
    const script = encodeAgreementChange(this.config.agreement, arbitrator, aragonAppFeesCashier !== ZERO_ADDRESS, title, content)
    return this.newVote(index, script, justification, submitter)
  }

  async changeVotingSupport(index, support, justification, submitter) {
    console.log(`Creating a proposal on voting #${index + 1} to change the voting required support...`)
    const script = encodeVotingSupportChange(this.config.votings[1], support)
    return this.newVote(index, script, justification, submitter)
  }

  async changeConfigGovernor(governor, justification, submitter) {
    const index = 0
    console.log(`Creating a proposal on voting #${index + 1} to change Aragon Court config governor...`)
    const { arbitrator } = await this.setting()
    const script = encodeConfigGovernorChange(this.config.agents[index], arbitrator, governor)
    return this.newVote(index, script, justification, submitter)
  }

  async changeFundsGovernor(governor, justification, submitter) {
    const index = 1
    console.log(`Creating a proposal on voting #${index + 1} to change Aragon Court funds governor...`)
    const { arbitrator } = await this.setting()
    const script = encodeFundsGovernorChange(this.config.agents[index], arbitrator, governor)
    return this.newVote(index, script, justification, submitter)
  }

  async changeModulesGovernor(governor, justification, submitter) {
    const index = 1
    console.log(`Creating a proposal on voting #${index + 1} to change Aragon Court modules governor...`)
    const { arbitrator } = await this.setting()
    const script = encodeModulesGovernorChange(this.config.agents[index], arbitrator, governor)
    return this.newVote(index, script, justification, submitter)
  }

  async changeCourtSettings(termId, justification, submitter) {
    const index = 1
    console.log('Submitting proposal to change Aragon Court config...')
    const { arbitrator } = await this.setting()
    const courtConfig = require('../court.config')[this.network]
    const script = encodeCourtConfigChange(this.config.agents[index], arbitrator, courtConfig, termId)
    return this.newVote(index, script, justification, submitter)
  }

  async newVote(index, script, rawJustification, submitter) {
    const { collateralToken, actionCollateral } = await this.collateralRequirement(index)

    if (actionCollateral.gt(bn(0))) {
      console.log('Staking action collateral...')
      const staking = await this.stakingPool(collateralToken)
      await this._approveToken(collateralToken, submitter, staking.address, actionCollateral)
      await staking.stake(actionCollateral, EMPTY_BYTES, { from: submitter })
    }

    console.log('Creating proposal...')
    const voting = await this.voting(index)
    const justification = await this._loadJustification(rawJustification, submitter)
    const receipt = await voting.newVote(script, justification, { from: submitter })
    const voteId = getEventArgument(receipt, 'StartVote', 'voteId')
    console.log(`Created vote with proposal ID #${voteId}!`)
    if (script !== EMPTY_CALLS_SCRIPT) console.log(`\nRemember script submitted for future execution: ${script}`)
  }

  async challenge(index, voteId, settlementOffer, rawJustification, challenger) {
    console.log('Approving dispute fees and challenge collateral...')
    const agreement = await this.agreement()
    const { feeAmount } = await this.getDisputeFees()
    const { collateralToken, challengeCollateral } = await this.collateralRequirement(index)
    await this._approveToken(collateralToken, challenger, agreement.address, challengeCollateral.add(feeAmount))

    console.log('Challenging proposal...')
    const voting = await this.voting(index)
    const { actionId } = await voting.getVote(voteId)
    const justification = await this._loadJustification(rawJustification, challenger)
    await agreement.challengeAction(actionId, settlementOffer, true, justification, { from: challenger })
    console.log(`Challenged proposal #${voteId}`)
  }

  async dispute(index, voteId, submitter) {
    console.log('Approving dispute fees...')
    const agreement = await this.agreement()
    const { feeToken: disputeFeeToken, feeAmount: disputeFeeAmount } = await this.getDisputeFees()
    await this._approveToken(disputeFeeToken, submitter, agreement.address, disputeFeeAmount)

    console.log(`Paying subscription fees...`)
    const { arbitrator: arbitratorAddress } = await this.setting()
    const arbitrator = await this._getInstance('IArbitrator', arbitratorAddress)
    const { recipient: subscriptionsAddress, feeToken: subscriptionFeeTokenAddress, feeAmount: subscriptionFeeAmount } = await arbitrator.getSubscriptionFees(agreement.address)
    if (subscriptionFeeAmount.gt(bn(0))) {
      const subscriptionFeeToken = await this._getInstance('ERC20', subscriptionFeeTokenAddress)
      await this._approveToken(subscriptionFeeToken, submitter, subscriptionsAddress, subscriptionFeeAmount)
      const subscriptions = await this._getInstance('CourtSubscriptions', subscriptionsAddress)
      const { lastPaymentPeriodId } = await subscriptions.getSubscriber(agreement.address)
      const { newLastPeriodId } = await subscriptions.getOwedFeesDetails(agreement.address)
      const periods = lastPaymentPeriodId.eq(bn(0)) ? 1 : newLastPeriodId.sub(lastPaymentPeriodId)
      await subscriptions.payFees(agreement.address, periods, { from: submitter })
    }

    console.log(`Disputing action...`)
    const voting = await this.voting(index)
    const { actionId } = await voting.getVote(voteId)
    const receipt = await agreement.disputeAction(actionId, true, { from: submitter })
    const challengeId = getEventArgument(receipt, 'ActionDisputed', 'challengeId', { decodeForAbi: agreement.abi })
    const { disputeId } = await agreement.getChallenge(challengeId)
    console.log(`Disputed proposal #${voteId} (dispute #${disputeId})!`)
  }

  async settle(index, voteId, from) {
    console.log('Settling action...')
    const voting = await this.voting(index)
    const { actionId } = await voting.getVote(voteId)
    const agreement = await this.agreement()
    await agreement.settleAction(actionId, { from })
    console.log(`Settled proposal #${voteId}`)
  }

  async close(index, voteId, from) {
    console.log('Closing action...')
    const voting = await this.voting(index)
    const { actionId } = await voting.getVote(voteId)
    const agreement = await this.agreement()
    await agreement.closeAction(actionId, { from })
    console.log(`Closed proposal #${voteId}`)
  }

  async stake(tokenAddress, amount, from) {
    const token = await this._getInstance('ERC20', tokenAddress)
    const symbol = await token.symbol()
    const staking = await this.stakingPool(token)
    await this._logStakingState(staking, symbol, from)
    console.log(`\nStaking ${symbol} ${fromWei(amount)}...`)
    await this._approveToken(token, from, staking.address, bn(amount))
    await staking.stake(bn(amount), EMPTY_BYTES, { from })
    console.log(`Staked successfully`)
    await this._logStakingState(staking, symbol, from)
  }

  async unstake(tokenAddress, amount, from) {
    const token = await this._getInstance('ERC20', tokenAddress)
    const symbol = await token.symbol()
    const staking = await this.stakingPool(token)
    await this._logStakingState(staking, symbol, from)
    console.log(`\nUnstaking ${symbol} ${fromWei(amount)}...`)
    await staking.unstake(bn(amount), EMPTY_BYTES, { from })
    console.log(`Unstaked successfully`)
    await this._logStakingState(staking, symbol, from)
  }

  async _approveToken(token, from, to, amount) {
    const allowance = await token.allowance(from, to)
    if (allowance.gte(amount)) return
    if (allowance.gt(bn(0))) await token.approve(to, 0, { from })
    const newAllowance = amount.add(allowance)
    await token.approve(to, newAllowance, { from })
  }

  async _loadAgreement(content, submitter) {
    if (!content.endsWith('.md')) throw Error('Cannot upload a non-markdown agreement file')

    console.log(`Uploading agreement file to IPFS: ${content}`)
    const contentPath = path.resolve(process.cwd(), content)
    const contentFile = fs.existsSync(contentPath) ? contentPath : (fs.existsSync(content) ? content : undefined)
    if (!contentFile) throw Error(`Could not load agreement file path ${content}`)

    const cid = await ipfsUpload(contentFile, submitter)
    console.log(`Uploaded agreement file to IPFS ${cid}`)
    return utf8ToHex(`ipfs:${cid}`)
  }

  async _loadJustification(justification, submitter) {
    if (justification.endsWith('.md')) {
      console.log(`Uploading justification file to IPFS: ${justification}`)
      const justificationPath = path.resolve(process.cwd(), justification)
      const justificationFile = fs.existsSync(justificationPath) ? justificationPath : (fs.existsSync(justification) ? justification : undefined)
      if (!justificationFile) throw Error(`Could not load justification file path ${justification}`)

      const cid = await ipfsUpload(justificationFile, submitter)
      console.log(`Uploaded justification to IPFS ${cid}`)
      return utf8ToHex(`ipfs:${cid}`)
    }

    console.log(`Sending justification as plain text: ${justification}`)
    return utf8ToHex(justification)
  }

  async _logStakingState(staking, symbol, user) {
    const { staked, locked: totalLocked } = await staking.getBalancesOf(user)
    const { amount: agreementLocked } = await staking.getLock(user, this.config.agreement)
    const available = staked.sub(totalLocked)
    console.log(`\nStaking status for user ${user}`)
    console.log(`- Staked:                   ${symbol} ${fromWei(staked.toString())}`)
    console.log(`- Available:                ${symbol} ${fromWei(available.toString())}`)
    console.log(`- Total locked:             ${symbol} ${fromWei(totalLocked.toString())}`)
    console.log(`- Locked on this Agreement: ${symbol} ${fromWei(agreementLocked.toString())}`)
  }

  _castSupport(rawSupport) {
    if (rawSupport === true || rawSupport === false) return rawSupport
    const support = rawSupport.toString().toLowerCase()
    if (support !== 'true' && support !== 'false') throw Error('Support value not valid, please use "true" or "false"')
    return support === 'true'
  }

  async _getInstance(contract, address) {
    return artifacts.require(contract).at(address)
  }
}
