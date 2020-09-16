const { ANY_ENTITY } = require('@aragon/contract-helpers-test/src/aragon-os')
const { injectArtifacts } = require('@aragon/contract-helpers-test/src/config')
const { ZERO_ADDRESS, getEventArgument } = require('@aragon/contract-helpers-test')
const { assertRole, assertMissingRole } = require('@aragon/contract-helpers-test/src/aragon-os/asserts')

const { votingParamsToArrays, CONFIG } = require('../config')
const { getInstalledAppsById, deployApps } = require('./helpers/apps')

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
const config = CONFIG['development']


contract('AN DAO, permissions', ([owner]) => {
  let token, template, dao, acl, evmScriptRegistry
  let voting1, voting2, agent, agreement, votingAggregator

  before('deploy apps, token and template', async () => {
    // Agreement, DisputableVoting and VotingAggregator are not in aragen yet, so we need to deploy it and publish it
    await deployApps(owner, config.ens)

    token = await MiniMeToken.new(ZERO_ADDRESS, ZERO_ADDRESS, 0, 'Aragon Network Token', 18, 'ANT', true)
    template = await ANDAOTemplate.new(config.daoFactory, config.ens)
  })

  const loadDAO = async (daoAgreementReceipt, appsReceipt) => {
    dao = await Kernel.at(getEventArgument(daoAgreementReceipt, 'DeployDao', 'dao'))
    acl = await ACL.at(await dao.acl())

    evmScriptRegistry = await EVMScriptRegistry.at(await acl.getEVMScriptRegistry())

    const installedAgreementApps = getInstalledAppsById(daoAgreementReceipt)

    // agreement
    assert.equal(installedAgreementApps.agreement.length, 1, 'should have installed 1 agreement app')
    agreement = await Agreement.at(installedAgreementApps.agreement[0])

    // voting aggregator
    assert.equal(installedAgreementApps['voting-aggregator'].length, 1, 'should have installed 1 voting aggregator app')
    votingAggregator = await VotingAggregator.at(installedAgreementApps['voting-aggregator'][0])

    const installedApps = getInstalledAppsById(appsReceipt)

    assert.equal(installedApps['disputable-voting'].length, 2, 'should have installed 2 voting apps')
    voting1 = await Voting.at(installedApps['disputable-voting'][0])
    voting2 = await Voting.at(installedApps['disputable-voting'][1])

    assert.equal(installedApps.agent.length, 1, 'should have installed 1 agent app')
    agent = await Agent.at(installedApps.agent[0])
  }

  before('create instance', async () => {
    const stakingFactory = await StakingFactory.new()
    const daoAgreementReceipt = await template.createDaoAndInstallAgreement(token.address, config.agreement.title, config.agreement.content, token.address, stakingFactory.address) // token, so it’s a contract, no court in localhost network
    console.log('Gas tx 1', daoAgreementReceipt.receipt.gasUsed)

    const { disputableVoting1, disputableVoting2 } = config
    const { votingSettingsArray: votingSettings1, collateralSettingsArray: collateralRequirements1 } = votingParamsToArrays(token.address, disputableVoting1)
    const { votingSettingsArray: votingSettings2, collateralSettingsArray: collateralRequirements2 } = votingParamsToArrays(token.address, disputableVoting2)
    const appsReceipt = await template.installApps(votingSettings1, collateralRequirements1, votingSettings2, collateralRequirements2)
    console.log('Gas tx 2', appsReceipt.receipt.gasUsed)

    await loadDAO(daoAgreementReceipt, appsReceipt)

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

  it('should have correct Vault permissions for Agent', async () => {
    const vault = await Vault.at(agent.address)
    await assertRole(acl, vault, voting2, 'TRANSFER_ROLE', voting1)
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
