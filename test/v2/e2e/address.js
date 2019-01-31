/*
  End-to-end tests for the Address endpoint.
  These tests assume that the repo is running locally.
*/

"use strict"

const rp = require("request-promise")

const rawtransactions = require("../../../dist/routes/v2/address")

/*
  This unconfirmed utxo test needs to be expanded in the future to automatically
  create a transaction. For now, that is done manually and the address provided
  as a constant.
*/
const addr1 = "bitcoincash:qqcp8fw06dmjd2gnfanpwytj7q93w408nv7usdqgsk"
const addr2 = "bitcoincash:qz7teqlcltdhqjn2an8nspu7g2x6g3d3rcq8nk4nzs"

async function testSingleUnconfirmed() {
  try {
    const options = {
      method: "GET",
      uri: `http://localhost:3000/v2/address/unconfirmed/${addr1}`,
      resolveWithFullResponse: true,
      json: true
    }

    const result = await rp(options)
    console.log(`result.body: ${JSON.stringify(result.body, null, 2)}`)
  } catch (err) {
    console.log(`Error: `, err)
  }
}
testSingleUnconfirmed()

async function testDoubleUnconfirmed() {
  try {
    const options = {
      method: "POST",
      uri: `http://localhost:3000/v2/address/unconfirmed`,
      resolveWithFullResponse: true,
      json: true,
      body: {
        addresses: [addr1, addr2]
      }
    }

    const result = await rp(options)
    console.log(`result.body: ${JSON.stringify(result.body, null, 2)}`)
  } catch (err) {
    console.log(`Error: `, err)
  }
}
testDoubleUnconfirmed()
