const deployDAO = require('./scripts/deploy-dao')
const deployTemplate = require('./scripts/deploy-template')
const { task, usePlugin } = require('@nomiclabs/buidler/config')

usePlugin('@nomiclabs/buidler-truffle5')
usePlugin("@nomiclabs/buidler-web3")

task('deploy-template', 'Deploy AN DAO template')
  .setAction(async (params, bre) => await deployTemplate(bre.network.name))

task('deploy-dao', 'Deploy AN DAO from template')
  .setAction(async (params, bre) => await deployDAO(bre.network.name))

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
        '0xa8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563',
      ],
    },
    rinkeby: {
      url: 'https://rinkeby.eth.aragon.network',
      accounts: ETH_KEYS ? ETH_KEYS.split(',') : [
        '0xa8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563',
      ],
    },
  },
  solc: {
    version: '0.4.24',
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
}
