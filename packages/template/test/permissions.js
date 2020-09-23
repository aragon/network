const { ANY_ENTITY } = require('@aragon/contract-helpers-test/src/aragon-os')
const { injectArtifacts } = require('@aragon/contract-helpers-test/src/config')
const { ZERO_ADDRESS, getEventArgument } = require('@aragon/contract-helpers-test')
const { assertRole, assertMissingRole } = require('@aragon/contract-helpers-test/src/aragon-os/asserts')
const { APP_IDS, getInstalledAppsById, deployApps } = require('./helpers/apps')

const ANDAOTemplate  = artifacts.require('ANDAOTemplate')
const ACL = artifacts.require('ACL')
const Kernel = artifacts.require('Kernel')
const Agent = artifacts.require('Agent')
const Vault = artifacts.require('Vault')
const Voting = artifacts.require('DisputableVoting')
const Agreement = artifacts.require('Agreement')
const VotingAggregator = artifacts.require('VotingAggregator')
const StakingFactory = artifacts.require('StakingFactory')
const MiniMeToken = artifacts.require('MiniMeToken')
const EVMScriptRegistry = artifacts.require('EVMScriptRegistry')

injectArtifacts(artifacts)
const config = require('../config')['mainnet']
const ENS = '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1'
const DAO_FACTORY = '0x5d94e3e7aec542ab0f9129b9a7badeb5b3ca0f77'


contract('AN DAO', ([owner]) => {
  let token, template, dao, acl, evmScriptRegistry
  let voting1, voting2, agent1, agent2, agreement, votingAggregator

  before('deploy apps, token and template', async () => {
    // Agreement, DisputableVoting and VotingAggregator are not in aragen yet, so we need to deploy it and publish it
    await deployApps(owner, ENS)
    token = await MiniMeToken.new(ZERO_ADDRESS, ZERO_ADDRESS, 0, 'Aragon Network Token', 18, 'ANT', true)
    template = await ANDAOTemplate.new(DAO_FACTORY, ENS, [APP_IDS['agreement'], APP_IDS['disputable-voting'], APP_IDS['voting-aggregator']])
  })

  before('create instance', async () => {
    const stakingFactory = await StakingFactory.new()
    const daoAgreementReceipt = await template.createDaoAndInstallAgreement(token.address, config.agreement.title, config.agreement.content, token.address, stakingFactory.address)
    console.log('Tx #1 gas usage:', daoAgreementReceipt.receipt.gasUsed)

    const { disputableVoting1, disputableVoting2 } = config
    disputableVoting1.collateralSettings[0] = token.address
    disputableVoting2.collateralSettings[0] = token.address
    const appsReceipt = await template.installApps(disputableVoting1.votingSettings, disputableVoting1.collateralSettings, disputableVoting2.votingSettings, disputableVoting2.collateralSettings)
    console.log('Tx #2 gas usage:', appsReceipt.receipt.gasUsed)

    await loadDAO(daoAgreementReceipt, appsReceipt)
  })

  const loadDAO = async (daoAgreementReceipt, appsReceipt) => {
    dao = await Kernel.at(getEventArgument(daoAgreementReceipt, 'DeployDao', 'dao'))
    acl = await ACL.at(await dao.acl())
    evmScriptRegistry = await EVMScriptRegistry.at(await acl.getEVMScriptRegistry())

    const installedAgreementApps = getInstalledAppsById(daoAgreementReceipt)
    const installedApps = getInstalledAppsById(appsReceipt)

    assert.equal(installedAgreementApps.agreement.length, 1, 'should have installed 1 agreement app')
    agreement = await Agreement.at(installedAgreementApps.agreement[0])

    assert.equal(installedAgreementApps['voting-aggregator'].length, 1, 'should have installed 1 voting aggregator app')
    votingAggregator = await VotingAggregator.at(installedAgreementApps['voting-aggregator'][0])

    assert.equal(installedApps['disputable-voting'].length, 2, 'should have installed 2 voting apps')
    voting2 = await Voting.at(installedApps['disputable-voting'][0])
    voting1 = await Voting.at(installedApps['disputable-voting'][1])

    assert.equal(installedApps.agent.length, 2, 'should have installed 2 agent apps')
    agent2 = await Agent.at(installedApps.agent[0])
    agent1 = await Agent.at(installedApps.agent[1])
  }

  describe('permissions', () => {
    it('should have correct permissions for Kernel', async () => {
      await assertRole(acl, dao, voting2, 'APP_MANAGER_ROLE', voting2)
    })

    it('should have correct permissions for ACL', async () => {
      await assertRole(acl, acl, voting2, 'CREATE_PERMISSIONS_ROLE', voting2)
    })

    it('should have correct permissions for EVM script registry', async () => {
      await assertRole(acl, evmScriptRegistry, voting2, 'REGISTRY_MANAGER_ROLE', voting2)
      await assertRole(acl, evmScriptRegistry, voting2, 'REGISTRY_ADD_EXECUTOR_ROLE', voting2)
    })

    it('should have correct permissions for Agent1', async () => {
      await assertRole(acl, agent1, voting2, 'EXECUTE_ROLE', voting1)
      await assertRole(acl, agent1, voting2, 'RUN_SCRIPT_ROLE', voting1)
    })

    it('should have correct Vault permissions for Agent1', async () => {
      const vault = await Vault.at(agent1.address)
      await assertRole(acl, vault, voting2, 'TRANSFER_ROLE', voting1)
    })

    it('should have correct permissions for Agent2', async () => {
      await assertRole(acl, agent2, voting2, 'EXECUTE_ROLE', voting2)
      await assertRole(acl, agent2, voting2, 'RUN_SCRIPT_ROLE', voting2)
    })

    it('should have correct Vault permissions for Agent2', async () => {
      const vault = await Vault.at(agent2.address)
      await assertRole(acl, vault, voting2, 'TRANSFER_ROLE', voting2)
    })

    it('should have correct permissions for Voting 1', async () => {
      await assertRole(acl, voting1, voting2, 'CREATE_VOTES_ROLE', { address: ANY_ENTITY })
      await assertRole(acl, voting1, voting2, 'CHALLENGE_ROLE', { address: ANY_ENTITY })
      await assertRole(acl, voting1, voting2, 'CHANGE_SUPPORT_ROLE', voting2)
      await assertRole(acl, voting1, voting2, 'CHANGE_QUORUM_ROLE', voting2)
      await assertRole(acl, voting1, voting2, 'CHANGE_QUIET_ENDING_ROLE', voting2)
      await assertRole(acl, voting1, voting2, 'CHANGE_EXECUTION_DELAY_ROLE', voting2)
      await assertRole(acl, voting1, voting2, 'CHANGE_DELEGATED_VOTING_PERIOD_ROLE', voting2)
      await assertRole(acl, voting1, voting2, 'CHANGE_VOTE_TIME_ROLE')
      await assertRole(acl, voting1, voting2, 'SET_AGREEMENT_ROLE', agreement)
    })

    it('should have correct permissions for Voting 2', async () => {
      await assertRole(acl, voting2, voting2, 'CREATE_VOTES_ROLE', { address: ANY_ENTITY })
      await assertRole(acl, voting2, voting2, 'CHALLENGE_ROLE', { address: ANY_ENTITY })
      await assertRole(acl, voting2, voting2, 'CHANGE_SUPPORT_ROLE', voting2)
      await assertRole(acl, voting2, voting2, 'CHANGE_QUORUM_ROLE', voting2)
      await assertRole(acl, voting2, voting2, 'CHANGE_QUIET_ENDING_ROLE', voting2)
      await assertRole(acl, voting2, voting2, 'CHANGE_EXECUTION_DELAY_ROLE', voting2)
      await assertRole(acl, voting2, voting2, 'CHANGE_DELEGATED_VOTING_PERIOD_ROLE', voting2)
      await assertRole(acl, voting2, voting2, 'CHANGE_VOTE_TIME_ROLE')
      await assertRole(acl, voting2, voting2, 'SET_AGREEMENT_ROLE', agreement)
    })

    it('should have correct permissions for Voting Aggregator', async () => {
      await assertRole(acl, votingAggregator, voting2, 'ADD_POWER_SOURCE_ROLE', voting2)
      await assertRole(acl, votingAggregator, voting2, 'MANAGE_POWER_SOURCE_ROLE', voting2)
      await assertRole(acl, votingAggregator, voting2, 'MANAGE_WEIGHTS_ROLE', voting2)
    })

    it('should have correct permissions for Agreement', async () => {
      await assertRole(acl, agreement, voting2, 'CHANGE_AGREEMENT_ROLE', voting2)
      await assertRole(acl, agreement, voting2, 'MANAGE_DISPUTABLE_ROLE', voting2)
      await assertMissingRole(acl, agreement, 'CHALLENGE_ROLE')
    })
  })
})
