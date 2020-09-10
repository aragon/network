const encodeCall = require('@aragon/templates-shared/helpers/encodeCall')
const { assertRole, assertMissingRole, assertRoleNotGranted } = require('@aragon/templates-shared/helpers/assertRole')(web3.utils)
const { randomId } = require('@aragon/templates-shared/helpers/aragonId')
const { getEventArgument } = require('@aragon/contract-helpers-test')
const { ZERO_ADDRESS, EMPTY_BYTES } = require('@aragon/contract-helpers-test')
const { ANY_ENTITY } = require('@aragon/contract-helpers-test/src/aragon-os')

const { getInstalledAppsById } = require('./helpers/apps')(artifacts)

const { deployAgreement, deployDisputableVoting } = require('./helpers/deploy_agreement')(artifacts)

const ANDAOTemplate  = artifacts.require('ANDAOTemplate')

const ACL = artifacts.require('ACL')
const Kernel = artifacts.require('Kernel')
const Agent = artifacts.require('Agent')
const Vault = artifacts.require('Vault')
const Voting = artifacts.require('DisputableVoting')
const Agreement = artifacts.require('Agreement')
const StakingFactory = artifacts.require('StakingFactory')
const MiniMeToken = artifacts.require('MiniMeToken')
const MiniMeTokenFactory = artifacts.require('MiniMeTokenFactory')
const PublicResolver = artifacts.require('PublicResolver')
const EVMScriptRegistry = artifacts.require('EVMScriptRegistry')

const { votingParamsToArrays, CONFIG } = require('../config')

contract('AN DAO, permissions', ([owner]) => {
  const config = CONFIG['development']

  let daoID, token, template, dao, acl, evmScriptRegistry
  let voting1, voting2, agent, agreement

  before('deploy apps, token and template', async () => {
    // they are not in aragen yet, so we need to deploy it and publish it
    await deployAgreement(owner, config.ens)
    await deployDisputableVoting(owner, config.ens)

    token = await MiniMeToken.new(ZERO_ADDRESS, ZERO_ADDRESS, 0, 'Aragon Network Token', 18, 'ANT', true)
    template = await ANDAOTemplate.new(config.daoFactory, config.ens, config.minimeFactory)
  })

  const loadDAO = async (daoReceipt, agreementReceipt, appsReceipt) => {
    dao = await Kernel.at(getEventArgument(daoReceipt, 'DeployDao', 'dao'))
    acl = await ACL.at(await dao.acl())

    evmScriptRegistry = await EVMScriptRegistry.at(await acl.getEVMScriptRegistry())

    const installedApps = getInstalledAppsById(appsReceipt)

    //console.log('installedApps', installedApps)
    assert.equal(installedApps['disputable-voting'].length, 2, 'should have installed 2 voting apps')
    voting1 = await Voting.at(installedApps['disputable-voting'][0])
    voting2 = await Voting.at(installedApps['disputable-voting'][1])

    assert.equal(installedApps.agent.length, 1, 'should have installed 1 agent app')
    agent = await Agent.at(installedApps.agent[0])

    // agreement
    const installedAgreementApps = getInstalledAppsById(agreementReceipt)
    assert.equal(installedAgreementApps.agreement.length, 1, 'should have installed 1 agreement app')
    agreement = await Agreement.at(installedAgreementApps.agreement[0])
  }

  before('create instance', async () => {
    daoID = randomId()
    const daoReceipt = await template.createDAO()
    console.log('Gas tx 1', daoReceipt.receipt.gasUsed)

    const stakingFactory = await StakingFactory.new()
    const agreementReceipt = await template.installAgreement(config.agreement.title, config.agreement.content, token.address, stakingFactory.address) // token, so it’s a contract, no court in localhost network
    console.log('Gas tx 2', agreementReceipt.receipt.gasUsed)

    const { disputableVoting1, disputableVoting2 } = config
    const {
      votingSettingsArray: votingSettings1,
      collatrealSettingsArray: collateralRequirements1
    } = votingParamsToArrays(token.address, disputableVoting1)
    const {
      votingSettingsArray: votingSettings2,
      collatrealSettingsArray: collateralRequirements2
    } = votingParamsToArrays(token.address, disputableVoting2)
    const appsReceipt = await template.installApps(token.address, votingSettings1, collateralRequirements1, votingSettings2, collateralRequirements2)
    console.log('Gas tx 3', appsReceipt.receipt.gasUsed)

    await loadDAO(daoReceipt, agreementReceipt, appsReceipt)

    console.log('owner      :', owner)
    console.log('template   :', template.address)
    console.log('Voting 1   :', voting1.address)
    console.log('Voting 2   :', voting2.address)
    console.log('kernel     :', dao.address)
    console.log('acl        :', acl.address)
  })

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

  it('should have correct permissions for Agent', async () => {
    await assertRole(acl, agent, voting2, 'EXECUTE_ROLE', voting1)
    await assertRole(acl, agent, voting2, 'RUN_SCRIPT_ROLE', voting1)
  })

  it('should have correct permissions for Voting 1', async () => {
    await assertRole(acl, voting1, voting2, 'CREATE_VOTES_ROLE', { address: ANY_ENTITY })
    await assertRole(acl, voting1, voting2, 'CHALLENGE_ROLE', { address: ANY_ENTITY })
    await assertRole(acl, voting1, voting2, 'CHANGE_SUPPORT_ROLE', voting2)
    await assertRole(acl, voting1, voting2, 'CHANGE_QUORUM_ROLE', voting2)
    await assertRole(acl, voting1, voting2, 'CHANGE_QUIET_ENDING_ROLE', voting2)
    await assertRole(acl, voting1, voting2, 'CHANGE_EXECUTION_DELAY_ROLE', voting2)
    await assertRole(acl, voting1, voting2, 'CHANGE_DELEGATED_VOTING_PERIOD_ROLE', voting2)
    await assertMissingRole(acl, voting1, 'CHANGE_VOTE_TIME_ROLE')
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
    await assertMissingRole(acl, voting2, 'CHANGE_VOTE_TIME_ROLE')
    await assertRole(acl, voting2, voting2, 'SET_AGREEMENT_ROLE', agreement)
  })

  it('should have correct permissions for Agreement', async () => {
    await assertRole(acl, agreement, voting2, 'CHANGE_AGREEMENT_ROLE', voting2)
    await assertRole(acl, agreement, voting2, 'MANAGE_DISPUTABLE_ROLE', voting2)
    await assertMissingRole(acl, agreement, 'CHALLENGE_ROLE')
  })
})
