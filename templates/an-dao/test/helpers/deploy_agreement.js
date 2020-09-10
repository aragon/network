const ethers = require('ethers')
const { hash: namehash } = require('eth-ens-namehash')
const Agreement = require('./Agreement.json')
const DisputableVoting = require('./DisputableVoting.json')

const AGREEMENT_NAME = 'agreement'
const DISPUTABLE_VOTING_NAME = 'disputable-voting'

module.exports = (artifacts) => {
  const ENS = artifacts.require('ENS')
  const APM = artifacts.require('APMRegistry')
  const PublicResolver = artifacts.require('PublicResolver')
  //const Agreement = artifacts.require('Agreement')

  const _fetchRegisteredAPM = async (ens) => {
    const aragonPMHash = namehash('aragonpm.eth')
    const resolver = await PublicResolver.at(await ens.resolver(aragonPMHash))
    const apmAddress = await resolver.addr(aragonPMHash)
    //console.log(`Using APM registered at aragonpm.eth: ${apmAddress}`)
    return await APM.at(apmAddress)
  }

  const _isPackageRegistered = async (ens, name) => {
    const hash = namehash(`${name}.aragonpm.eth`)
    const owner = await ens.owner(hash)
    return owner !== '0x0000000000000000000000000000000000000000' && owner !== '0x'
  }

  const deployApp = async (owner, ensAddress, name, Contract) => {
    const ens = await ENS.at(ensAddress)
    const apm = await _fetchRegisteredAPM(ens)
    if (await _isPackageRegistered(ens, name)) {
      return
    }
    //const agreement = await Agreement.new()
    const provider = ethers.getDefaultProvider('http://localhost:8545')
    const signer = new ethers.Wallet('0xa8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563', provider)
    //console.log('signer', signer.address)
    //console.log(owner)
    const ContractFactory = new ethers.ContractFactory(Contract.abi, Contract.bytecode, signer)
    const contract = await ContractFactory.deploy()
    contract.deployTransaction.wait()
    //console.log('result', contract.address)
    return await apm.newRepoWithVersion(name, owner, [1, 0, 0], contract.address, '0x')

  }

  const deployAgreement = async (owner, ensAddress) => {
    await deployApp(owner, ensAddress, AGREEMENT_NAME, Agreement)
  }

  const deployDisputableVoting = async (owner, ensAddress) => {
    await deployApp(owner, ensAddress, DISPUTABLE_VOTING_NAME, DisputableVoting)
  }

  return { deployAgreement, deployDisputableVoting }
}
