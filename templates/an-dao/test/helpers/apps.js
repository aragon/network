const { hash: namehash } = require('eth-ens-namehash')
const { getInstalledApps } = require('@aragon/contract-helpers-test/src/aragon-os')

const APPS = [
  { name: 'agent', contractName: 'Agent' },
  { name: 'vault', contractName: 'Vault' },
  { name: 'agreement', contractName: 'Agreement' },
  { name: 'disputable-voting', contractName: 'DisputableVoting' },
]

const APP_IDS = APPS.reduce((ids, { name }) => {
  ids[name] = namehash(`${name}.aragonpm.eth`)
  return ids
}, {})

module.exports = function (artifacts) {
  function getInstalledAppsById(receipt) {
    return Object.keys(APP_IDS).reduce((apps, appName) => {
      apps[appName] = getInstalledApps(receipt, APP_IDS[appName], { artifacts })
      return apps
    }, {})
  }


  return { getInstalledAppsById }
}
