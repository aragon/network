const ethers = require('ethers')
const { hash: namehash } = require('eth-ens-namehash')
const { getInstalledApps } = require('@aragon/contract-helpers-test/src/aragon-os')

const ENS = artifacts.require('ENS')
const APM = artifacts.require('APMRegistry')
const PublicResolver = artifacts.require('PublicResolver')
const Agreement = require('./build/Agreement')
const DisputableVoting = require('./build/DisputableVoting')
const VotingAggregator = require('./build/VotingAggregator')

// Aragon devchain 1st account
const DEPLOYER = '0xa8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563'

const TO_BE_DEPLOYED_APPS = [
  { name: 'agreement', contract: Agreement },
  { name: 'disputable-voting', contract: DisputableVoting },
  { name: 'voting-aggregator', contract: VotingAggregator },
]

const APPS = [
  { name: 'agent', contractName: 'Agent' },
  { name: 'vault', contractName: 'Vault' },
  { name: 'agreement', contractName: 'Agreement' },
  { name: 'disputable-voting', contractName: 'DisputableVoting' },
  { name: 'voting-aggregator', contractName: 'VotingAggregator' },
]

const APP_IDS = APPS.reduce((ids, { name }) => {
  ids[name] = namehash(`${name}.aragonpm.eth`)
  return ids
}, {})

function getInstalledAppsById(receipt) {
  return Object.keys(APP_IDS).reduce((apps, appName) => {
    apps[appName] = getInstalledApps(receipt, APP_IDS[appName])
    return apps
  }, {})
}

async function deployApps(owner, ensAddress) {
  for (const app of TO_BE_DEPLOYED_APPS) {
    await _deployApp(owner, ensAddress, app.name, app.contract)
  }
}

const _deployApp = async (owner, ensAddress, name, Contract) => {
  const ens = await ENS.at(ensAddress)
  const apm = await _fetchRegisteredAPM(ens)
  if (await _isPackageRegistered(ens, name)) return

  const provider = ethers.getDefaultProvider('http://localhost:8545')
  const signer = new ethers.Wallet(DEPLOYER, provider)
  const ContractFactory = new ethers.ContractFactory(Contract.abi, Contract.bytecode, signer)
  const contract = await ContractFactory.deploy()
  contract.deployTransaction.wait()
  return await apm.newRepoWithVersion(name, owner, [1, 0, 0], contract.address, '0x')
}

const _fetchRegisteredAPM = async (ens) => {
  const aragonPMHash = namehash('aragonpm.eth')
  const resolver = await PublicResolver.at(await ens.resolver(aragonPMHash))
  const apmAddress = await resolver.addr(aragonPMHash)
  return await APM.at(apmAddress)
}

const _isPackageRegistered = async (ens, name) => {
  const hash = namehash(`${name}.aragonpm.eth`)
  const owner = await ens.owner(hash)
  return owner !== '0x0000000000000000000000000000000000000000' && owner !== '0x'
}

module.exports = {
  APP_IDS,
  deployApps,
  getInstalledAppsById,
}
