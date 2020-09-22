const ANDAO = require('./src/andao')
const { task, usePlugin } = require('@nomiclabs/buidler/config')

usePlugin('@nomiclabs/buidler-truffle5')
usePlugin("@nomiclabs/buidler-web3")

const callANDAO = async (bre, fn, args) => new ANDAO(bre.network.name)[fn](...args)

task('sign', 'Sign the latest AN DAO agreement version')
  .addParam('from', 'Address signing the agreement')
  .setAction(({ from }, bre) => callANDAO(bre, 'sign', [from]))

task('create-poll', 'Submit a poll to the AN DAO')
  .addParam('voting', 'Voting app number: 1 or 2')
  .addParam('question', 'The question of the poll')
  .addParam('from', 'Address submitting the poll')
  .setAction(({ voting, question, from }, bre) => callANDAO(bre, 'newPoll', [parseInt(voting) - 1, question, from]))

task('create-transfer', 'Submit a token transfer to the AN DAO')
  .addParam('voting', 'Voting app number: 1 or 2')
  .addParam('to', 'Address recipient for the token transfer')
  .addParam('token', 'Token address for the transfer')
  .addParam('amount', 'Amount of tokens to be transferred (including decimals)')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('from', 'Address submitting the proposal')
  .setAction(({ voting, from, to, token, amount, justification }, bre) => callANDAO(bre, 'newTokenTransfer', [parseInt(voting) - 1, token, to, amount, justification, from]))

task('upgrade-app', 'Upgrade an Aragon Network app')
  .addParam('id', 'App ID you are willing to update')
  .addParam('base', 'Address of the base app for the upgrade')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('from', 'Address submitting the proposal')
  .setAction(({ id, base, justification, from }, bre) => callANDAO(bre, 'upgradeApp', [id, base, justification, from]))

task('change-agreement', 'Change an Aragon Network agreement content')
  .addParam('content', 'New agreement content to be proposed (IPFS link as "ipfs:[CID]")')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('from', 'Address submitting the proposal')
  .setAction(({ content, justification, from }, bre) => callANDAO(bre, 'changeAgreement', [content, justification, from]))

task('change-voting-support', 'Change an Aragon Network voting required support')
  .addParam('voting', 'Voting app number: 1 or 2')
  .addParam('support', 'New voting required support (expressed with 16 decimals: 1% = 10000000000000000')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('from', 'Address submitting the proposal')
  .setAction(({ voting, support, justification, from }, bre) => callANDAO(bre, 'changeVotingSupport', [parseInt(voting) - 1, support, justification, from]))

task('change-court-settings', 'Change an Aragon Court module')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('term', 'Term ID when you want to apply this change')
  .addParam('from', 'Address submitting the proposal')
  .setAction(({ justification, term, from }, bre) => callANDAO(bre, 'changeCourtSettings', [term, justification, from]))

task('change-court-app-fee', 'Change an Aragon Court app fee')
  .addParam('id', 'App ID to be changed')
  .addParam('fee', 'New app fee for the given app ID')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('from', 'Address submitting the proposal')
  .setAction(({ id, fee, justification, from }, bre) => callANDAO(bre, 'changeAppFee', [id, fee, justification, from]))

task('upgrade-court-module', 'Upgrade Aragon Court module')
  .addParam('id', 'ID of the module willing to upgrade')
  .addParam('address', 'Address of new module to be upgraded')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('from', 'Address submitting the proposal')
  .setAction(({ id, address, justification, from }, bre) => callANDAO(bre, 'upgradeCourtModule', [id, address, justification, from]))

task('change-config-governor', 'Change the config governor of Aragon Court')
  .addParam('governor', 'New config governor address')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('from', 'Address submitting the proposal')
  .setAction(({ governor, justification, from }, bre) => callANDAO(bre, 'changeConfigGovernor', [governor, justification, from]))

task('change-funds-governor', 'Change the funds governor of Aragon Court')
  .addParam('governor', 'New funds governor address')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('from', 'Address submitting the proposal')
  .setAction(({ governor, justification, from }, bre) => callANDAO(bre, 'changeFundsGovernor', [governor, justification, from]))

task('change-modules-governor', 'Change the modules governor of Aragon Court')
  .addParam('governor', 'New modules governor address')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('from', 'Address submitting the proposal')
  .setAction(({ governor, justification, from }, bre) => callANDAO(bre, 'changeModulesGovernor', [governor, justification, from]))

task('challenge', 'Challenge an AN DAO proposal')
  .addParam('voting', 'Voting app number: 1 or 2')
  .addParam('proposal', 'Proposal number to be challenged')
  .addParam('justification', 'Justification: local path to markdown file, IPFS CID, or plain text')
  .addParam('settlementOffer', 'Settlement offer to be specified (including decimals)')
  .addParam('from', 'Address challenging the proposal')
  .setAction(({ voting, proposal, settlementOffer, justification, from }, bre) => callANDAO(bre, 'challenge', [parseInt(voting) - 1, proposal, settlementOffer, justification, from]))

task('dispute', 'Dispute an AN DAO proposal to Aragon Court')
  .addParam('voting', 'Voting app number: 1 or 2')
  .addParam('proposal', 'Proposal number to be disputed')
  .addParam('from', 'Submitter address of the proposal')
  .setAction(({ voting, proposal, from }, bre) => callANDAO(bre, 'dispute', [parseInt(voting) - 1, proposal, from]))

task('settle', 'Settle a challenged AN DAO proposal')
  .addParam('voting', 'Voting app number: 1 or 2')
  .addParam('proposal', 'Proposal number to be settled')
  .addParam('from', 'Address calling for settlement')
  .setAction(({ voting, proposal, from }, bre) => callANDAO(bre, 'settle', [parseInt(voting) - 1, proposal, from]))

task('vote', 'Vote on an AN DAO proposal')
  .addParam('voting', 'Voting app number: 1 or 2')
  .addParam('proposal', 'Proposal number to vote on')
  .addParam('supports', 'Whether you support the proposal')
  .addParam('from', 'Address submitting the vote')
  .setAction(({ voting, proposal, supports, from }, bre) => callANDAO(bre, 'vote', [parseInt(voting) - 1, proposal, supports, from]))

task('set-representative', 'Allow a second address as a representative')
  .addParam('voting', 'Voting app number: 1 or 2')
  .addParam('representative', 'Address you are willing to allow as a representative')
  .addParam('from', 'Address submitting the vote')
  .setAction(({ voting, representative, from }, bre) => callANDAO(bre, 'setRepresentative', [parseInt(voting) - 1, representative, from]))

task('delegate-vote', 'Delegate vote on an AN DAO proposal')
  .addParam('voting', 'Voting app number: 1 or 2')
  .addParam('proposal', 'Proposal number to delegate a vote')
  .addParam('supports', 'Whether you support the proposal')
  .addParam('voter', 'Address voting on behalf of')
  .addParam('from', 'Address representing the voter')
  .setAction(({ voting, proposal, supports, voter, from }, bre) => callANDAO(bre, 'delegateVote', [parseInt(voting) - 1, proposal, [supports], [voter], from]))

task('execute-proposal', 'Execute an AN DAO proposal')
  .addParam('voting', 'Voting app number: 1 or 2')
  .addParam('proposal', 'Proposal number to be executed')
  .addParam('script', 'Script of the proposal to be executed')
  .addParam('from', 'Address executing the proposal')
  .setAction(({ voting, proposal, script, from }, bre) => callANDAO(bre, 'executeVote', [parseInt(voting) - 1, proposal, script, from]))

task('close-proposal', 'Close an AN DAO proposal')
  .addParam('voting', 'Voting app number: 1 or 2')
  .addParam('proposal', 'Proposal number to be closed')
  .addParam('from', 'Address closing the proposal')
  .setAction(({ voting, proposal, from }, bre) => callANDAO(bre, 'close', [parseInt(voting) - 1, proposal, from]))

task('stake', 'Stake amount of tokens in the staking pool')
  .addParam('token', 'Address of the token to be staked in the staking pool')
  .addParam('amount', 'Amount of tokens to be staked (with 18 decimals)')
  .addParam('from', 'Address staking the tokens')
  .setAction(({ token, amount, from }, bre) => callANDAO(bre, 'stake', [token, amount, from]))

task('unstake', 'Unstake amount of tokens from staking pool')
  .addParam('token', 'Address of the token to be unstaked from the staking pool')
  .addParam('amount', 'Amount of tokens to be unstaked (with 18 decimals)')
  .addParam('from', 'Address unstaking the tokens')
  .setAction(({ token, amount, from }, bre) => callANDAO(bre, 'unstake', [token, amount, from]))

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
