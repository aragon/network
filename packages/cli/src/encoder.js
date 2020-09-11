const abi = require('web3-eth-abi')
const AGENT_ABI = require('../artifacts/Agent.json').abi
const { EMPTY_CALLS_SCRIPT } = require('@aragon/contract-helpers-test')

function encodeCallsScript(actions) {
  return actions.reduce((script, { to, data }) => {
    const address = abi.encodeParameter('address', to)
    const dataLength = abi.encodeParameter('uint256', (data.length - 2) / 2).toString('hex')
    return script + address.slice(26) + dataLength.slice(58) + data.slice(2)
  }, EMPTY_CALLS_SCRIPT)
}

function encodeTokenTransfer(agent, token, recipient, amount) {
  const transferABI = getFunctionABI(AGENT_ABI, 'transfer')
  const data = abi.encodeFunctionCall(transferABI, [token, recipient, amount])
  return encodeCallsScript([{ to: agent, data: data }])
}

function getFunctionABI(ABI, functionName) {
  const functionABI = ABI.find(item => item.type === 'function' && item.name === functionName)
  if (!functionABI) throw Error(`Could not find function ABI called ${functionName}`)
  return functionABI
}

module.exports = {
  encodeCallsScript,
  encodeTokenTransfer,
}
