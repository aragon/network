const fs = require('fs')
const { client, PinnerError } = require('@aragonone/ipfs-pinner-client')

const ALREADY_UPLOADED_ERROR = 'File is already uploaded with cid '
const IPFS_PINNER_ENDPOINT = 'https://ipfs-pinner.backend.aragon.org'

async function ipfsUpload(path, sender) {
  let content

  if (path.endsWith('.md')) {
    if (!fs.existsSync(path)) throw Error(`Path "${path}" does not exist`)
    console.log(`Uploading file "${path}" to IPFS...`)
    content = path
  } else {
    console.log(`Uploading file "${path}" as plain text (only markdown is supported for IPFS evidence)...`)
    content = path
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
