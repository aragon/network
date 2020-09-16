const { getEventArgument } = require('@aragon/contract-helpers-test')

const { votingParamsToArrays, CONFIG } = require('../config')

module.exports = async function deploy(network) {
  const config = CONFIG[network]
  const { ant, ens, daoFactory, miniMeFactory } = config

  const Template = artifacts.require('ANDAOTemplate')
  const template = config.template
    ? (await Template.at(config.template))
    : (await Template.new(daoFactory, ens, miniMeFactory))


  const DAOFactory = artifacts.require('DAOFactory')

  console.log(`Creating DAO with template ${template.address} and installing agreement...`)
  const { agreement: { title, content }, arbitrator, stakingFactory } = config
  const receipt = await template.createDaoAndInstallAgreement(ant, title, content, arbitrator, stakingFactory)

  const dao = getEventArgument(receipt, 'DeployDAO', 'dao', { decodeForAbi: DAOFactory.abi })
  console.log(`DAO created at ${dao}`)

  console.log('Installing apps...')
  const { feeToken, disputableVoting1, disputableVoting2 } = config
  const {
    votingSettingsArray: votingSettings1,
    collateralSettingsArray: collateralRequirements1
  } = votingParamsToArrays(feeToken, disputableVoting1)
  const {
    votingSettingsArray: votingSettings2,
    collateralSettingsArray: collateralRequirements2
  } = votingParamsToArrays(feeToken, disputableVoting2)

  await template.installApps(
    votingSettings1,
    collateralRequirements1,
    votingSettings2,
    collateralRequirements2,
  )

  console.log(`\nDAO ${dao} set up successfully!`)
}
