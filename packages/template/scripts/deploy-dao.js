const CONFIG = require('../config')
const { getEventArgument } = require('@aragon/contract-helpers-test')

module.exports = async function deploy(network) {
  const config = CONFIG[network]

  console.log(`Loading template at ${config.template}...`)
  const Template = artifacts.require('ANDAOTemplate')
  const template = await Template.at(config.template)

  console.log(`Creating a new AN DAO with template ${template.address}...`)
  const { token, agreement: { title, content, arbitrator, stakingFactory } } = config
  const receipt = await template.createDaoAndInstallAgreement(token, title, content, arbitrator, stakingFactory)
  const DAOFactory = artifacts.require('DAOFactory')
  const dao = getEventArgument(receipt, 'DeployDAO', 'dao', { decodeForAbi: DAOFactory.abi })

  console.log(`Installing apps on DAO at ${dao}...`)
  const { disputableVoting1, disputableVoting2 } = config
  await template.installApps(
    disputableVoting1.votingSettings,
    disputableVoting1.collateralSettings,
    disputableVoting2.votingSettings,
    disputableVoting2.collateralSettings,
  )

  console.log(`\nAN DAO created successfully at ${dao}`)
}
