const { utf8ToHex } = require('web3-utils')
const { pct16, bn, bigExp, ONE_DAY } = require('@aragon/contract-helpers-test')

const ONE_HOUR = 60 * 60

const DEFAULTS = {
  agreement: {
    title:        'Aragon Network Agreement',
    content:      utf8ToHex('ipfs:TODO'),
  },
  disputableVoting1: {
    duration:               ONE_HOUR * 60,                                 // 60 hours
    support:                bn('6'.repeat(18)),                            // 66.666...%
    minQuorum:              bigExp(25, 14),                                // 0.25%
    executionDelay:         ONE_HOUR * 12,
    delegatedVotingPeriod:  ONE_DAY * 2, // TODO
    quietEndingPeriod:      ONE_HOUR * 12,
    quietEndingExtension:   ONE_HOUR * 12,
    actionCollateral:       bn(100),
    challengeCollateral:    bn(100),
    challengeDuration:      ONE_DAY,
  },
  disputableVoting2: {
    duration:               ONE_DAY * 7,
    support:                bn('6'.repeat(18)),                            // 66.666...%
    minQuorum:              pct16(10),
    executionDelay:         ONE_DAY,
    delegatedVotingPeriod:  ONE_DAY * 2, // TODO
    quietEndingPeriod:      ONE_HOUR * 12,
    quietEndingExtension:   ONE_HOUR * 12,
    actionCollateral:       bn(10000),
    challengeCollateral:    bn(1000),
    challengeDuration:      ONE_DAY,
  },
}

const CONFIG = {
  development: {
    ...DEFAULTS,
    ens:            '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1',   // from aragen
    daoFactory:     '0x5d94e3e7aec542ab0f9129b9a7badeb5b3ca0f77',   // from aragen
    minimeFactory:  '0xd526b7aba39cccf76422835e7fd5327b98ad73c9',   // from aragen
  },
  rinkeby: {
    ...DEFAULTS,
    ant:            '0x245B220211b7D3C6dCB001Aa2C3bf48ac4CaA03E',   // ANT mock token used in Aragon Court staging
    ens:            '0x98Df287B6C145399Aaa709692c8D308357bC085D',
    daoFactory:     '0x89d87269527495ac29648376d4154ba55c4872fc',
    miniMeFactory:  '0x6ffeb4038f7f077c4d20eaf1706980caec31e2bf',
    arbitrator:     '0x52180af656a1923024d1accf1d827ab85ce48878',   // Aragon Court staging instance
    stakingFactory: '0x07429001eeA415E967C57B8d43484233d57F8b0B',   // Real StakingFactory instance on Rinkeby
    feeToken:       '0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42',   // DAI mock token used in Aragon Court staging
    template:       '0xd701e49Bf69229d01B78BF34b9F9c5b9759FE442',
  },
  mainnet: {
    ...DEFAULTS,
    ant:            '0x960b236A07cf122663c4303350609A66A7B288C0',   // ANT address
    ens:            '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    daoFactory:     '0x7378ad1ba8f3c8e64bbb2a04473edd35846360f1',
    miniMeFactory:  '0x909d05f384d0663ed4be59863815ab43b4f347ec',
    arbitrator:     '0xee4650cBe7a2B23701D416f58b41D8B76b617797',   // Aragon Court mainnet instance
    stakingFactory: '0xD2f7D8A940324F12DFe623D5529b077E353314d3',
    feeToken:       '0x6b175474e89094c44da98b954eedeac495271d0f',   // DAI v2
    template:       undefined,
  }
}

const votingParamsToArrays = (feeToken, disputableVoting) => {
  const {
    duration,
    support,
    minQuorum,
    delegatedVotingPeriod,
    quietEndingPeriod,
    quietEndingExtension,
    executionDelay,
    actionCollateral,
    challengeCollateral,
    challengeDuration
  } = disputableVoting

  const votingSettingsArray = [
    duration,
    support,
    minQuorum,
    delegatedVotingPeriod,
    quietEndingPeriod,
    quietEndingExtension,
    executionDelay,
  ]

  const collatrealSettingsArray = [
    feeToken,
    actionCollateral,
    challengeCollateral,
    challengeDuration
  ]

  return { votingSettingsArray, collatrealSettingsArray }
}

module.exports = {
  votingParamsToArrays,
  DEFAULTS,
  CONFIG,
}
