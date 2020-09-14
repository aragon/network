const deployTemplate = require('./scripts/deploy')
const { task, usePlugin } = require('@nomiclabs/buidler/config')

usePlugin('@nomiclabs/buidler-truffle5')
usePlugin("@nomiclabs/buidler-web3")

task('deploy', 'Deploy AN DAO')
  .setAction(async (params, bre) => await deployTemplate(bre.network.name))

const ETH_KEYS = process.env.ETH_KEYS

module.exports = {
  networks: {
    ganache: {
      url: 'http://localhost:8545',
      gasLimit: 6000000000,
      defaultBalanceEther: 100
    },
    mainnet: {
      url: 'https://mainnet.eth.aragon.network',
      accounts: ETH_KEYS ? ETH_KEYS.split(',') : [
        '0xa8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563', // aragon devchain first account
      ],
    },
    rinkeby: {
      url: 'https://rinkeby.eth.aragon.network',
      accounts: ETH_KEYS ? ETH_KEYS.split(',') : [
        '0xa8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563', // aragon devchain first account
      ],
    },
  },
  solc: {
    version: '0.5.17',
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
}
