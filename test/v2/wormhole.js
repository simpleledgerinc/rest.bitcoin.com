/*
  TESTS FOR THE WORMHOLE.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.
*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const route = require("../../dist/routes/v2/wormhole")
const wormholedbService = require("../../dist/routes/v2/services/wormholedb")

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockWormholedb = require("./mocks/wormholedb-mocks")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#Wormhole/transaction", () => {
  let req, res

  before(async () => {
    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "unit"
  })

  // Setup the mocks before each test.
  beforeEach(async () => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes

    // Explicitly reset the parmas and body.
    req.params = {}
    req.body = {}
    req.query = {}

    // Initialize whdb service with mock data
    if (process.env.TEST === "unit")
      await wormholedbService.init(mockWormholedb.mockWithTransactions)
  })

  describe("#root", async () => {
    // root route handler.
    const endpoint = route.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = endpoint(req, res)

      assert.equal(
        result.status,
        "wormhole/transaction",
        "Returns static string"
      )
    })
  })

  describe("#confirmed", async () => {
    const endpoint = route.testableComponents.confirmed

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result = await endpoint(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses must be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single address", async () => {
      req.body = {
        addresses: "bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4"
      }

      const result = await endpoint(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses must be an array",
        "Proper error message"
      )
    })

    it("should detect a network mismatch", async () => {
      req.body = {
        addresses: [`bitcoincash:qp2ajcfvh2tssqrf2rx0h5fukmu86weg3ueznk4e5q`]
      }

      const result = await endpoint(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid network. Trying to use a testnet address on mainnet, or vice versa.",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid address", async () => {
      req.body = {
        addresses: ["invalid-bitcoincash-address"]
      }

      const result = await endpoint(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address. Double check your address is valid: invalid-bitcoincash-address",
        "Proper error message"
      )
    })

    if (process.env.TEST !== "integration") {
      it("should default to page 0", async () => {
        req.body = {
          addresses: ["bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4"]
        }

        const result = await endpoint(req, res)

        assert.equal(result[0].currentPage, 0)
      })

      it("should process the requested page", async () => {
        req.body = {
          addresses: ["bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4"],
          page: 5
        }

        const result = await endpoint(req, res)

        assert.equal(result[0].currentPage, 5)
      })

      it("should calculate the total number of pages", async () => {
        req.body = {
          addresses: ["bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4"]
        }

        const result = await endpoint(req, res)

        assert.equal(result[0].pagesTotal, 1)
      })

      it("should return a valid response if address has no transactions", async () => {
        // Initialize whdb service with mock data
        if (process.env.TEST === "unit")
          await wormholedbService.init(mockWormholedb.mockNoTransactions)

        req.body = {
          addresses: ["bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4"]
        }

        const result = await endpoint(req, res)

        assert.equal(result[0].currentPage, 0)
        assert.equal(result[0].pagesTotal, 0)
        assert(Array.isArray(result[0].txs), "result txs not an array")
        assert.equal(result[0].txs.length, 0)
      })

      it("should process a single address in an array", async () => {
        req.body = {
          addresses: ["bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4"]
        }

        const result = await endpoint(req, res)

        assert(Array.isArray(result), "result not an array")
        assert.equal(result.length, 1)
        assert.hasAllKeys(
          result[0],
          ["currentPage", "pagesTotal", "txs"],
          "invalid result data"
        )
        assert(Array.isArray(result[0].txs), "result txs not an array")
        assert.hasAllKeys(
          result[0].txs[0],
          [
            "txid",
            "fee",
            "sendingaddress",
            "referenceaddress",
            "version",
            "type_int",
            "type",
            "propertyid",
            "precision",
            "amount",
            "valid",
            "blockhash",
            "blocktime",
            "positioninblock",
            "block"
          ],
          "invalid result data"
        )
      })

      it("should process multiple addresses in an array", async () => {
        req.body = {
          addresses: [
            "bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4",
            "bchtest:qzknfggae0av6yvxk77gmyq7syc67yux6sk80haqyr"
          ]
        }

        const result = await endpoint(req, res)

        assert(Array.isArray(result), "result not an array")
        assert.equal(result.length, 2)

        // validate first result object in array
        assert.hasAllKeys(
          result[0],
          ["currentPage", "pagesTotal", "txs"],
          "invalid result data"
        )
        assert(Array.isArray(result[0].txs), "result txs not an array")
        assert.hasAllKeys(
          result[0].txs[0],
          [
            "txid",
            "fee",
            "sendingaddress",
            "referenceaddress",
            "version",
            "type_int",
            "type",
            "propertyid",
            "precision",
            "amount",
            "valid",
            "blockhash",
            "blocktime",
            "positioninblock",
            "block"
          ],
          "invalid result data"
        )

        // validate second result object in array
        assert.hasAllKeys(
          result[1],
          ["currentPage", "pagesTotal", "txs"],
          "invalid result data"
        )
        assert(Array.isArray(result[1].txs), "result txs not an array")
        assert.hasAllKeys(
          result[1].txs[0],
          [
            "txid",
            "fee",
            "sendingaddress",
            "referenceaddress",
            "version",
            "type_int",
            "type",
            "propertyid",
            "precision",
            "amount",
            "valid",
            "blockhash",
            "blocktime",
            "positioninblock",
            "block"
          ],
          "invalid result data"
        )
      })
    }
  })
})
