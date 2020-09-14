const { utf8ToHex } = require('web3-utils')
const { pct16, bigExp, getEventArgument } = require('@aragon/contract-helpers-test')

const MINUTE = 60
const HALF_HOUR = 60 * 30

const CONFIG = {
  rinkeby: {
    template:                 '0x815AD613c61561d850DA0311bfeAB77A5925e3e1',                       // AN DAO template
    agreement: {
      title:                  'Aragon Network DAO Agreement',
      content:                utf8ToHex('ipfs:QmdaYTJk6aV2pmVRx9EdV8kdDxD9yGFktd6hFskXSr4KDE'),   // AN DAO agreement proposal
      arbitrator:             '0x52180af656a1923024d1accf1d827ab85ce48878',                       // Aragon Court staging instance
      stakingFactory:         '0x6a30c2de7359dB110b6322B41038674AE1D276Fb',                       // Staking factory instance on Rinkeby v0.3.1
    },
    voting: {
      duration:               HALF_HOUR,
      support:                pct16(20),
      minQuorum:              pct16(2),
      executionDelay:         MINUTE * 5,
      delegatedVotingPeriod:  MINUTE * 10,
      quietEndingPeriod:      MINUTE * 10,
      quietEndingExtension:   MINUTE * 5,
      actionCollateral:       bigExp(5, 18),
      challengeCollateral:    bigExp(10, 18),
      challengeDuration:      MINUTE * 5,
      collateralToken:        '0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42',                       // DAI mock token used in Aragon Court staging
      token:                  '0x245B220211b7D3C6dCB001Aa2C3bf48ac4CaA03E',                       // ANT mock token used in Aragon Court staging
    },
  },
  mainnet: {
    template:                 undefined,
    agreement: {
      title:                  'Aragon Network DAO Agreement',
      content:                utf8ToHex('ipfs:QmdaYTJk6aV2pmVRx9EdV8kdDxD9yGFktd6hFskXSr4KDE'),   // AN DAO agreement proposal
      arbitrator:             '0xee4650cBe7a2B23701D416f58b41D8B76b617797',                       // Aragon Court mainnet instance
      stakingFactory:         undefined,                                                          // Staking factory instance on Rinkeby
    },
    voting: {
      duration:               undefined,
      support:                undefined,
      minQuorum:              undefined,
      executionDelay:         undefined,
      delegatedVotingPeriod:  undefined,
      quietEndingPeriod:      undefined,
      quietEndingExtension:   undefined,
      actionCollateral:       undefined,
      challengeCollateral:    undefined,
      challengeDuration:      undefined,
      collateralToken:        '0x6b175474e89094c44da98b954eedeac495271d0f',                       // MC DAI
      token:                  '0x960b236A07cf122663c4303350609A66A7B288C0',                       // ANT
    },
  }
}

module.exports = async function deploy(network) {
  const config = CONFIG[network]

  console.log(`Loading template at ${config.template}...`)
  const Template = artifacts.require('ANDAOTemplate')
  const template = await Template.at(config.template)

  console.log(`Creating a new AN DAO...`)
  const { agreement: { title, content, arbitrator, stakingFactory } } = config

  const { voting: { actionCollateral, challengeCollateral, challengeDuration, collateralToken } } = config
  const collateralRequirements = [collateralToken, challengeDuration, actionCollateral, challengeCollateral]

  const { voting: { token, duration, support, minQuorum, delegatedVotingPeriod, quietEndingPeriod, quietEndingExtension, executionDelay } } = config
  const votingSettings = [duration, support, minQuorum, delegatedVotingPeriod, quietEndingPeriod, quietEndingExtension, executionDelay]

  const DAOFactory = artifacts.require('DAOFactory')
  const receipt = await template.createDAO(title, content, arbitrator, stakingFactory, token, votingSettings, collateralRequirements)
  const dao = getEventArgument(receipt, 'DeployDAO', 'dao', { decodeForAbi: DAOFactory.abi })
  console.log(`\nAN DAO created at ${dao}`)
}
