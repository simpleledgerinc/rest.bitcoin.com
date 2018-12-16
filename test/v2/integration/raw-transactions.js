/*
 */

"use strict"

const chai = require("chai")
const assert = chai.assert
const rawtransactions = require("../../../dist/routes/v2/rawtransactions")
const rp = require("request-promise")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const mockData = require("../mocks/raw-transactions-mocks")

describe("#Raw-Transactions", () => {
  describe("#whCreateTx", () => {
    it(`should return root`, async () => {
      const options = {
        method: "GET",
        uri: `http://localhost:3000/v2/rawtransactions/`,
        resolveWithFullResponse: true,
        json: true
      }

      const result = await rp(options)
      //console.log(`result: ${JSON.stringify(result, null, 0)}`)

      assert.equal(result.body.status, "rawtransactions")
    })

    it(`should return tx hex`, async () => {
      const minIn = {
        txid:
          "f7ed9cf23dee85910f6269c9a101a75fcfd2f3c6fc81f17fad824ff7aaf99ab2",
        vout: 1
      }

      const options = {
        method: "PUT",
        uri: `http://localhost:3000/v2/rawtransactions/create`,
        resolveWithFullResponse: true,
        json: true,
        body: {
          //inputs: [mockData.mockWHCreateInput],
          inputs: [minIn],
          outputs: {}
        }
      }

      const result = await rp(options)
      //console.log(`result.body: ${JSON.stringify(result.body, null, 0)}`)

      assert.equal(
        result.body,
        "0200000001b29af9aaf74f82ad7ff181fcc6f3d2cf5fa701a1c969620f9185ee3df29cedf70100000000ffffffff0000000000"
      )
    })
  })
})
