const rinkeby = require('./rinkeby')
const mainnet = require('./mainnet')

const parseVotingConfig = voting => {
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
    challengeDuration,
    collateralToken,
  } = voting

  voting.votingSettings = [duration, support, minQuorum, delegatedVotingPeriod, quietEndingPeriod, quietEndingExtension, executionDelay]
  voting.collateralSettings = [collateralToken, challengeDuration, actionCollateral, challengeCollateral]
  return voting
}

const parseConfig = config => {
  parseVotingConfig(config.disputableVoting1)
  parseVotingConfig(config.disputableVoting2)
  return config
}

module.exports = {
  rinkeby: parseConfig(rinkeby),
  mainnet: parseConfig(mainnet),
}
