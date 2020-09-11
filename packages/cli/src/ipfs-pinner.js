const fs = require('fs')
const path = require('path')
const { client, PinnerError } = require('@aragonone/ipfs-pinner-client')

const ALREADY_UPLOADED_ERROR = 'File is already uploaded with cid '
const IPFS_PINNER_ENDPOINT = 'https://ipfs-pinner.backend.aragon.org'

async function ipfsUpload(disputePath, justification, sender) {
  let content

  if (justification.endsWith('.md')) {
    const justificationPath = path.join(process.cwd(), disputePath, justification)
    if (!fs.existsSync(justificationPath)) throw Error(`Justification path "${justificationPath}" does not exist`)
    console.log(`Uploading justification "${justification}" to IPFS...`)
    content = justificationPath
  } else {
    console.log(`Uploading justification "${justification}" as plain text (only markdown is supported for IPFS evidence)...`)
    content = justification
  }

  await client.setEndpoint(IPFS_PINNER_ENDPOINT)

  let cid
  try {
    const response = await client.upload(sender, content)
    cid = response.cid
    console.log(`Uploaded file ${cid}`)
  } catch (error) {
    if (!(error instanceof PinnerError)) throw error
    const message = error.errors[0].file
    if (!message || !message.includes(ALREADY_UPLOADED_ERROR)) throw error
    cid = message.replace(ALREADY_UPLOADED_ERROR, '')
    console.log(`File was already uploaded ${cid}`)
  }

  return cid
}

module.exports = {
  ipfsUpload,
}
