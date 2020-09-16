const CONFIG = {
  rinkeby: {
    ens:              '0x98Df287B6C145399Aaa709692c8D308357bC085D',
    daoFactory:       '0x89d87269527495ac29648376d4154ba55c4872fc',
    agreement:        '0x34c62f3aec3073826f39c2c35e9a1297d9dbf3cc77472283106f09eee9cf47bf',  // agreement.open.aragonpm.eth
    disputableVoting: '0x705b5084c67966bb8e4640b28bab7a1e51e03d209d84e3a04d2a4f7415f93b34',  // disputable-voting.open.aragonpm.eth
    votingAggregator: '0x818d8ea9df3dca764232c22548318a98f82f388b760b4b5abe80a4b40f9b2076',  // voting-aggregator.hatch.aragonpm.eth
  },
  mainnet: {
    ens:              '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    daoFactory:       '0x7378ad1ba8f3c8e64bbb2a04473edd35846360f1',
    agreement:        '0x0cabb91fff413ac707663d5d8000b9c6b8ba3cafe4c50c30005debf64e13e665',  // agreement.aragonpm.eth
    disputableVoting: '0x09cdc3e6887a0002b11992e954a40326a511a1750a2f5c69d17b8b660b0d337a',  // disputable-voting.aragonpm.eth
    votingAggregator: '0x1ccd8033893dd34d6681897cca56b623b6498e79e57c2b1e489a3d6fc136cf1d',  // voting-aggregator.aragonpm.eth
  }
}

module.exports = async function deploy(network) {
  const config = CONFIG[network]
  const { ens, daoFactory, agreement, disputableVoting, votingAggregator } = config

  console.log(`Deploying new AN DAO template...`)
  const Template = artifacts.require('ANDAOTemplate')
  const template = await Template.new(daoFactory, ens, [agreement, disputableVoting, votingAggregator])
  console.log(`Deployed AN DAO template successfully at ${template.address}`)
}
