const { utf8ToHex } = require('web3-utils')
const { pct16, bn, bigExp, ONE_DAY } = require('@aragon/contract-helpers-test')

const ONE_HOUR = 60 * 60

module.exports = {
  template:                 undefined,                                      // TODO
  token:                    '0x960b236A07cf122663c4303350609A66A7B288C0',   // ANT
  agreement: {
    title:                  'Aragon Network Agreement',
    content:                utf8ToHex('ipfs:TODO'),                         // TODO
    arbitrator:             '0xee4650cBe7a2B23701D416f58b41D8B76b617797',   // Aragon Court mainnet instance
    stakingFactory:         undefined,                                      // TODO
  },
  disputableVoting1: {
    duration:               ONE_HOUR * 60,                                  // 60 hours
    support:                bn('6'.repeat(18)),                             // 66.666...%
    minQuorum:              bigExp(25, 14),                                 // 0.25%
    executionDelay:         ONE_HOUR * 12,                                  // 12 hours
    delegatedVotingPeriod:  ONE_HOUR * 36,                                  // 36 hours
    quietEndingPeriod:      ONE_HOUR * 12,                                  // 12 hours
    quietEndingExtension:   ONE_HOUR * 12,                                  // 12 hours
    actionCollateral:       bigExp(100, 18),                                // 100 ANT
    challengeCollateral:    bigExp(100, 18),                                // 100 ANT
    challengeDuration:      ONE_DAY,                                        // 1 day
    collateralToken:        '0x960b236A07cf122663c4303350609A66A7B288C0',   // ANT
  },
  disputableVoting2: {
    duration:               ONE_DAY * 7,                                    // 7 days
    support:                bn('6'.repeat(18)),                             // 66.666...%
    minQuorum:              pct16(10),                                      // 10 %
    executionDelay:         ONE_DAY,                                        // 1 day
    delegatedVotingPeriod:  ONE_DAY * 5,                                    // 5 days
    quietEndingPeriod:      ONE_HOUR * 12,                                  // 12 hours
    quietEndingExtension:   ONE_HOUR * 12,                                  // 12 hours
    actionCollateral:       bigExp(10000, 18),                              // 10,000 ANT
    challengeCollateral:    bigExp(1000, 18),                               // 1,000 ANT
    challengeDuration:      ONE_DAY,                                        // 1 day
    collateralToken:        '0x960b236A07cf122663c4303350609A66A7B288C0',   // ANT
  },
}
