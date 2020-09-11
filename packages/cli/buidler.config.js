const ANDAO = require('./src/andao')
const { task, usePlugin } = require('@nomiclabs/buidler/config')

usePlugin('@nomiclabs/buidler-truffle5')
usePlugin("@nomiclabs/buidler-web3")

const callANDAO = async (bre, fn, args) => new ANDAO(bre.network.name)[fn](...args)

task('sign', 'Sign the latest AN DAO agreement version')
  .addParam('from', 'Address signing the agreement')
  .setAction(({ from }, bre) => callANDAO(bre, 'sign', [from]))

task('create-poll', 'Submit a poll to the AN DAO')
  .addParam('from', 'Address submitting the poll')
  .addParam('question', 'The question of the poll')
  .setAction(({ question, from }, bre) => callANDAO(bre, 'newPoll', [question, from]))

task('create-transfer', 'Submit a token transfer to the AN DAO')
  .addParam('from', 'Address submitting the proposal')
  .addParam('to', 'Address recipient for the token transfer')
  .addParam('token', 'Token address for the transfer')
  .addParam('amount', 'Amount of tokens to be transferred (including decimals)')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .setAction(({ from, to, token, amount, justification }, bre) => callANDAO(bre, 'newTokenTransfer', [token, to, amount, justification, from]))

task('challenge', 'Challenge an AN DAO proposal')
  .addParam('proposal', 'Proposal number to be challenged')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('settlementOffer', 'Settlement offer to be specified (including decimals)')
  .addParam('from', 'Address challenging the proposal')
  .setAction(({ proposal, settlementOffer, justification, from }, bre) => callANDAO(bre, 'challenge', [proposal, settlementOffer, justification, from]))

task('dispute', 'Dispute an AN DAO proposal to Aragon Court')
  .addParam('proposal', 'Proposal number to be disputed')
  .addParam('from', 'Submitter address of the proposal')
  .setAction(({ proposal, from }, bre) => callANDAO(bre, 'dispute', [proposal, from]))

task('settle', 'Settle a challenged AN DAO proposal')
  .addParam('proposal', 'Proposal number to be settled')
  .addParam('from', 'Address calling for settlement')
  .setAction(({ proposal, from }, bre) => callANDAO(bre, 'settle', [proposal, from]))

task('vote', 'Vote on an AN DAO proposal')
  .addParam('proposal', 'Proposal number to vote on')
  .addParam('supports', 'Whether you support the proposal')
  .addParam('from', 'Address submitting the vote')
  .setAction(({ proposal, supports, from }, bre) => callANDAO(bre, 'vote', [proposal, supports, from]))

task('delegate-vote', 'Delegate vote on an AN DAO proposal')
  .addParam('proposal', 'Proposal number to delegate a vote')
  .addParam('supports', 'Whether you support the proposal')
  .addParam('voter', 'Address voting on behalf of')
  .addParam('from', 'Address representing the voter')
  .setAction(({ proposal, supports, voter, from }, bre) => callANDAO(bre, 'delegateVote', [proposal, [supports], [voter], from]))

task('execute-proposal', 'Execute an AN DAO proposal')
  .addParam('proposal', 'Proposal number to be executed')
  .addParam('script', 'Script of the proposal to be executed')
  .addParam('from', 'Address executing the proposal')
  .setAction(({ proposal, script, from }, bre) => callANDAO(bre, 'executeVote', [proposal, script, from]))

task('close-proposal', 'Close an AN DAO proposal')
  .addParam('proposal', 'Proposal number to be closed')
  .addParam('from', 'Address closing the proposal')
  .setAction(({ proposal, from }, bre) => callANDAO(bre, 'close', [proposal, from]))

const ETH_KEYS = process.env.ETH_KEYS || process.env.ETH_KEY

module.exports = {
  networks: {
    mainnet: {
      url: 'https://mainnet.eth.aragon.network',
      accounts: ETH_KEYS ? ETH_KEYS.split(',') : []
    },
    rinkeby: {
      url: 'https://rinkeby.eth.aragon.network',
      accounts: ETH_KEYS ? ETH_KEYS.split(',') : []
    },
  },
}
