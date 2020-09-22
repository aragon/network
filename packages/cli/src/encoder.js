const abi = require('web3-eth-abi')
const AGENT_ABI = require('../artifacts/Agent.json').abi
const KERNEL_ABI = require('../artifacts/Kernel.json').abi
const VOTING_ABI = require('../artifacts/DisputableVoting.json').abi
const AGREEMENT_ABI = require('../artifacts/Agreement.json').abi
const ARAGON_COURT_ABI = require('../artifacts/AragonCourt.json').abi
const ARAGON_COURT_SUBSCRIPTIONS_ABI = require('../artifacts/CourtSubscriptions.json').abi
const { EMPTY_CALLS_SCRIPT } = require('@aragon/contract-helpers-test/src/aragon-os/evmScript')

function encodeCallsScript(actions) {
  return actions.reduce((script, { to, data }) => {
    const address = abi.encodeParameter('address', to)
    const dataLength = abi.encodeParameter('uint256', (data.length - 2) / 2).toString('hex')
    return script + address.slice(26) + dataLength.slice(58) + data.slice(2)
  }, EMPTY_CALLS_SCRIPT)
}

function encodeExecute(target, ethValue, script) {
  const executeABI = getFunctionABI(AGENT_ABI, 'execute')
  return abi.encodeFunctionCall(executeABI, [target, ethValue, script])
}

function encodeTokenTransfer(agent, token, recipient, amount) {
  const transferABI = getFunctionABI(AGENT_ABI, 'transfer')
  const data = abi.encodeFunctionCall(transferABI, [token, recipient, amount])
  return encodeCallsScript([{ to: agent, data }])
}

function encodeAppUpgrade(kernel, appId, appBase) {
  const baseAddressesNamespace = '0xf1f3eb40f5bc1ad1344716ced8b8a0431d840b5783aea1fd01786bc26f35ac0f'
  const setAppABI = getFunctionABI(KERNEL_ABI, 'setApp')
  const data = abi.encodeFunctionCall(setAppABI, [baseAddressesNamespace, appId, appBase])
  return encodeCallsScript([{ to: kernel, data }])
}

function encodeVotingSupportChange(voting, support) {
  const changeSupportABI = getFunctionABI(VOTING_ABI, 'changeSupportRequiredPct')
  const data = abi.encodeFunctionCall(changeSupportABI, [support])
  return encodeCallsScript([{ to: voting, data }])
}

function encodeAgreementChange(agreement, arbitrator, setCashier, title, content) {
  const changeSettingABI = getFunctionABI(AGREEMENT_ABI, 'changeSetting')
  const data = abi.encodeFunctionCall(changeSettingABI, [arbitrator, setCashier, title, content])
  return encodeCallsScript([{ to: agreement, data }])
}

function encodeConfigGovernorChange(agent, court, governor) {
  const changeGovernorABI = getFunctionABI(ARAGON_COURT_ABI, 'changeConfigGovernor')
  const changeGovernorData = abi.encodeFunctionCall(changeGovernorABI, [governor])
  const agentData = encodeExecute(court, 0, changeGovernorData)
  return encodeCallsScript([{ to: agent, data: agentData }])
}

function encodeFundsGovernorChange(agent, court, governor) {
  const changeGovernorABI = getFunctionABI(ARAGON_COURT_ABI, 'changeFundsGovernor')
  const changeGovernorData = abi.encodeFunctionCall(changeGovernorABI, [governor])
  const agentData = encodeExecute(court, 0, changeGovernorData)
  return encodeCallsScript([{ to: agent, data: agentData }])
}

function encodeModulesGovernorChange(agent, court, governor) {
  const changeGovernorABI = getFunctionABI(ARAGON_COURT_ABI, 'changeModulesGovernor')
  const changeGovernorData = abi.encodeFunctionCall(changeGovernorABI, [governor])
  const agentData = encodeExecute(court, 0, changeGovernorData)
  return encodeCallsScript([{ to: agent, data: agentData }])
}

function encodeCourtModuleUpgrade(agent, court, id, address) {
  const setModulesABI = getFunctionABI(ARAGON_COURT_ABI, 'setModules')
  const setModulesData = abi.encodeFunctionCall(setModulesABI, [[id], [address]])
  const agentData = encodeExecute(court, 0, setModulesData)
  return encodeCallsScript([{ to: agent, data: agentData }])
}

function encodeAppFeeChange(agent, subscriptions, appId, feeToken, feeAmount) {
  const setAppFeeABI = getFunctionABI(ARAGON_COURT_SUBSCRIPTIONS_ABI, 'setAppFee')
  const setAppFeeData = abi.encodeFunctionCall(setAppFeeABI, [appId, feeToken, feeAmount])
  const agentData = encodeExecute(subscriptions, 0, setAppFeeData)
  return encodeCallsScript([{ to: agent, data: agentData }])
}

function encodeCourtConfigChange(agent, court, config, fromTermId) {
  const setConfigABI = getFunctionABI(ARAGON_COURT_ABI, 'setConfig')
  const courtChangeData = abi.encodeFunctionCall(setConfigABI, [
    fromTermId.toString(),                              // Identification number of the term in which the config will be effective at
    config.feeToken,                                    // Address of the token contract that is used to pay for fees
    [
      config.jurorFee.toString(),                       // Amount of fee tokens that is paid per juror per dispute
      config.draftFee.toString(),                       // Amount of fee tokens per juror to cover the drafting cost
      config.settleFee.toString()                       // Amount of fee tokens per juror to cover round settlement cost
    ],
    [
      config.evidenceTerms.toString(),                  // Max submitting evidence period duration in terms
      config.commitTerms.toString(),                    // Commit period duration in terms
      config.revealTerms.toString(),                    // Reveal period duration in terms
      config.appealTerms.toString(),                    // Appeal period duration in terms
      config.appealConfirmTerms.toString()              // Appeal confirmation period duration in terms
    ],
    [
      config.penaltyPct.toString(),                     // Permyriad of min active tokens balance to be locked for each drafted juror (‱ - 1/10,000)
      config.finalRoundReduction.toString()             // Permyriad of fee reduction for the last appeal round (‱ - 1/10,000)
    ],
    [
      config.firstRoundJurorsNumber.toString(),         // Number of jurors to be drafted for the first round of disputes
      config.appealStepFactor.toString(),               // Increasing factor for the number of jurors of each round of a dispute
      config.maxRegularAppealRounds.toString(),         // Number of regular appeal rounds before the final round is triggered
      config.finalRoundLockTerms.toString()             // Number of terms that a coherent juror in a final round is disallowed to withdraw (to prevent 51% attacks)
    ],
    [
      config.appealCollateralFactor.toString(),         // Multiple of dispute fees required to appeal a preliminary ruling
      config.appealConfirmCollateralFactor.toString()   // Multiple of dispute fees required to confirm appeal
    ],
    config.minActiveBalance.toString()                  // Jurors ANJ min active balance
  ])
  const agentData = encodeExecute(court, 0, courtChangeData)
  return encodeCallsScript([{ to: agent, data: agentData }])
}

function getFunctionABI(ABI, functionName) {
  const functionABI = ABI.find(item => item.type === 'function' && item.name === functionName)
  if (!functionABI) throw Error(`Could not find function ABI called ${functionName}`)
  return functionABI
}

module.exports = {
  encodeExecute,
  encodeAppUpgrade,
  encodeTokenTransfer,
  encodeAgreementChange,
  encodeVotingSupportChange,
  encodeConfigGovernorChange,
  encodeFundsGovernorChange,
  encodeModulesGovernorChange,
  encodeCourtModuleUpgrade,
  encodeCourtConfigChange,
  encodeAppFeeChange,
}
