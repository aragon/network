const CONFIG = {
  rinkeby: {
    ens:            '0x98Df287B6C145399Aaa709692c8D308357bC085D',
    daoFactory:     '0x89d87269527495ac29648376d4154ba55c4872fc',
  },
  mainnet: {
    ens:            '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    daoFactory:     '0x7378ad1ba8f3c8e64bbb2a04473edd35846360f1',
  }
}

module.exports = async function deploy(network) {
  const config = CONFIG[network]
  const { ens, daoFactory } = config

  console.log(`Deploying new AN DAO template...`)
  const Template = artifacts.require('ANDAOTemplate')
  const template = await Template.new(daoFactory, ens)
  console.log(`Deployed AN DAO template successfully at ${template.address}`)
}
