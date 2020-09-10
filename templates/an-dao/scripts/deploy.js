const { getEventArgument } = require('@aragon/contract-helpers-test')

const { votingParamsToArrays, CONFIG } = require('../config')

module.exports = async function deploy(network) {
  const config = CONFIG[network]
  const { ant, ens, daoFactory, miniMeFactory, token } = config

  const Template = artifacts.require('ANDAOTemplate')
  const template = config.template
    ? (await Template.at(config.template))
    : (await Template.new(daoFactory, ens, miniMeFactory))

  console.log(`Creating DAO with template ${template.address}...`)

  const DAOFactory = artifacts.require('DAOFactory')
  const receipt = await template.createDAO(ant)
  const dao = getEventArgument(receipt, 'DeployDAO', 'dao', { decodeForAbi: DAOFactory.abi })
  console.log(`DAO created at ${dao}`)

  console.log('Installing agreement...')
  const { agreement: { title, content }, arbitrator, stakingFactory } = config
  await template.installAgreement(title, content, arbitrator, stakingFactory)

  console.log('Installing apps...')
  const { feeToken, disputableVoting1, disputableVoting2 } = config
  const {
    votingSettingsArray: votingSettings1,
    collatrealSettingsArray: collateralRequirements1
  } = votingParamsToArrays(feeToken, disputableVoting1)
  const {
    votingSettingsArray: votingSettings2,
    collatrealSettingsArray: collateralRequirements2
  } = votingParamsToArrays(feeToken, disputableVoting2)

  await template.installApps(
    token,
    votingSettings1,
    collateralRequirements1,
    votingSettings2,
    collateralRequirements2,
  )

  console.log(`\nDAO ${dao} set up successfully!`)
}
