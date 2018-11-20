/*
  TESTS FOR THE RAWTRANSACTIONS.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const rawtransactions = require("../../dist/routes/v2/rawtransactions")
const nock = require("nock") // HTTP mocking

let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
//delete require.cache[require.resolve("./mocks/express-mocks")] // Fixes bug
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockData = require("./mocks/raw-transactions-mocks")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 5 }

describe("#Raw-Transactions", () => {
  let req, res

  before(() => {
    // Save existing environment variables.
    originalEnvVars = {
      BITCOINCOM_BASEURL: process.env.BITCOINCOM_BASEURL,
      RPC_BASEURL: process.env.RPC_BASEURL,
      RPC_USERNAME: process.env.RPC_USERNAME,
      RPC_PASSWORD: process.env.RPC_PASSWORD
    }

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "unit"
    if (process.env.TEST === "unit") {
      process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"
      process.env.RPC_BASEURL = "http://fakeurl/api"
      process.env.RPC_USERNAME = "fakeusername"
      process.env.RPC_PASSWORD = "fakepassword"
    }
  })

  // Setup the mocks before each test.
  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes

    // Explicitly reset the parmas and body.
    req.params = {}
    req.body = {}

    // Activate nock if it's inactive.
    if (!nock.isActive()) nock.activate()
  })

  afterEach(() => {
    // Clean up HTTP mocks.
    nock.cleanAll() // clear interceptor list.
    nock.restore()
  })

  after(() => {
    // Restore any pre-existing environment variables.
    process.env.BITCOINCOM_BASEURL = originalEnvVars.BITCOINCOM_BASEURL
    process.env.RPC_BASEURL = originalEnvVars.RPC_BASEURL
    process.env.RPC_USERNAME = originalEnvVars.RPC_USERNAME
    process.env.RPC_PASSWORD = originalEnvVars.RPC_PASSWORD
  })

  describe("#root", async () => {
    // root route handler.
    const root = rawtransactions.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, "rawtransactions", "Returns static string")
    })
  })

  describe("decodeRawTransaction()", () => {
    // block route handler.
    const decodeRawTransaction =
      rawtransactions.testableComponents.decodeRawTransaction

    it("should throw error if hex is missing", async () => {
      const result = await decodeRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "hex can not be empty")
    })

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.hex =
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"

      const result = await decodeRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
      assert.include(result.error, "ENOTFOUND", "Error message expected")
    })

    it("should GET /decodeRawTransaction", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockDecodeRawTransaction })
      }

      req.params.hex =
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"

      const result = await decodeRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        "txid",
        "hash",
        "size",
        "version",
        "locktime",
        "vin",
        "vout"
      ])
      assert.isArray(result.vin)
      assert.isArray(result.vout)
    })
  })

  describe("decodeScript()", () => {
    // block route handler.
    const decodeScript = rawtransactions.testableComponents.decodeScript

    it("should throw error if hex is missing", async () => {
      const result = await decodeScript(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "hex can not be empty")
    })

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.hex =
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"

      const result = await decodeScript(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
      assert.include(result.error, "ENOTFOUND", "Error message expected")
    })

    it("should GET /decodeScript", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockDecodeScript })
      }

      req.params.hex =
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"

      const result = await decodeScript(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["asm", "type", "p2sh"])
    })
  })

  describe("getRawTransaction()", () => {
    // block route handler.
    const getRawTransaction =
      rawtransactions.testableComponents.getRawTransaction

    it("should throw 400 error if txids array is missing", async () => {
      const result = await getRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txids must be an array")
    })

    it("should throw 400 error if txids array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.txids = testArray

      const result = await getRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large. Max 20 txids")
    })

    it("should throw 400 error if txid is empty", async () => {
      req.body.txids = [""]

      const result = await getRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Encountered empty TXID")
    })

    it("should throw 500 error if txid is invalid", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, { result: "Error: Request failed with status code 500" })
      }

      req.body.txids = ["abc123"]

      const result = await getRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Request failed with status code 500")
    })

    it("should get concise transaction data", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockRawTransactionConcise })
      }

      req.body.txids = [
        "bd320377db7026a3dd5c7ec444596c0ee18fc25c4f34ee944adc03e432ce1971"
      ]

      const result = await getRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.isString(result[0])
    })

    it("should get verbose transaction data", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockRawTransactionVerbose })
      }

      req.body.txids = [
        "bd320377db7026a3dd5c7ec444596c0ee18fc25c4f34ee944adc03e432ce1971"
      ]
      req.body.verbose = true

      const result = await getRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "hex",
        "txid",
        "hash",
        "size",
        "version",
        "locktime",
        "vin",
        "vout",
        "blockhash",
        "confirmations",
        "time",
        "blocktime"
      ])
      assert.isArray(result[0].vin)
      assert.isArray(result[0].vout)
    })
  })

  describe("sendRawTransaction()", () => {
    // block route handler.
    const sendRawTransaction =
      rawtransactions.testableComponents.sendRawTransaction

    it("should throw 400 error if hexs array is missing", async () => {
      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "hex must be an array")
    })

    it("should throw 400 error if hexs array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.hex = testArray

      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large. Max 20 entries")
    })

    it("should throw 400 error if hex array element is empty", async () => {
      req.body.hex = [""]

      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Encountered empty hex")
    })

    it("should throw 500 error if hex is invalid", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, { result: "Error: Request failed with status code 500" })
      }

      req.body.hex = ["abc123"]

      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Request failed with status code 500")
    })

    it("should submit hex encoded transaction", async () => {
      // This is a difficult test to run as transaction hex is invalid after a
      // block confirmation. So the unit tests simulates what the output 'should'
      // be, but the integration asserts an expected failure.

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "aef8848396e67532b42008b9d75b5a5a3459a6717740f31f0553b74102b4b118"
          })
      }

      req.body.hex = [
        "0200000001189f7cf4303e2e0bcc5af4be323b9b397dd4104ca2de09528eb90a1450b8a999010000006a4730440220212ec2ffce136a30cec1bc86a40b08a2afdeb6f8dbd652d7bcb07b1aad6dfa8c022041f59585273b89d88879a9a531ba3272dc953f48ff57dad955b2dee70e76c0624121030143ffd18f1c4add75c86b2f930d9551d51f7a6bd786314247022b7afc45d231ffffffff0230d39700000000001976a914af64a026e06910c59463b000d18c3d125d7e951a88ac58c20000000000001976a914af64a026e06910c59463b000d18c3d125d7e951a88ac00000000"
      ]

      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      if (process.env.TEST === "unit") {
        assert.isArray(result)
        assert.isString(result[0])

        // Integration test
      } else {
        assert.hasAllKeys(result, ["error"])
        assert.include(result.error, "Request failed with status code 500")
      }
    })
  })

  describe("whChangeOutput()", () => {
    const whChangeOutput = rawtransactions.testableComponents.whChangeOutput

    it("should throw 400 error if rawtx is empty", async () => {
      req.params.rawtx = ""
      const result = await whChangeOutput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "rawtx can not be empty")
    })

    it("should throw 400 error if prevtx is empty", async () => {
      req.params.rawtx = "fakeTx"
      const result = await whChangeOutput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "could not parse prevtxs")
    })

    it("should throw 400 error if prevtx not parsable JSON", async () => {
      req.params.rawtx = "fakeTx"
      req.params.prevtxs = "someUnparsableJSON"
      const result = await whChangeOutput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "could not parse prevtxs")
    })

    it("should throw 400 error if destination is empty", async () => {
      req.params.rawtx = "fakeTx"
      req.params.prevtxs = JSON.stringify([{ a: 0 }])
      const result = await whChangeOutput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "destination can not be empty")
    })

    it("should throw 400 error fee is empty", async () => {
      req.params.rawtx = "fakeTx"
      req.params.prevtxs = JSON.stringify([{ a: 0 }])
      req.params.destination = "bchtest:fakeaddress"
      const result = await whChangeOutput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "fee can not be empty")
    })

    it("should generate change tx hex", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "0100000001b15ee60431ef57ec682790dec5a3c0d83a0c360633ea8308fbf6d5fc10a779670400000000ffffffff03efe40000000000001976a9141522a025f2365eebee65cd8a8b8a38180dbcd59588ac5c0d00000000000047512102f3e471222bb57a7d416c82bf81c627bfcd2bdc47f36e763ae69935bba4601ece21021580b888ff56feb27f17f08802ebed26258c23697d6a462d43fc13b565fda2dd52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000"
          })
      }

      req.params.rawtx =
        "0100000001b15ee60431ef57ec682790dec5a3c0d83a0c360633ea8308fbf6d5fc10a779670400000000ffffffff025c0d00000000000047512102f3e471222bb57a7d416c82bf81c627bfcd2bdc47f36e763ae69935bba4601ece21021580b888ff56feb27f17f08802ebed26258c23697d6a462d43fc13b565fda2dd52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000"
      req.params.prevtxs = JSON.stringify([
        {
          txid:
            "6779a710fcd5f6fb0883ea3306360c3ad8c0a3c5de902768ec57ef3104e65eb1",
          vout: 4,
          scriptPubKey: "76a9147b25205fd98d462880a3e5b0541235831ae959e588ac",
          value: 0.00068257
        }
      ])
      req.params.destination =
        "bchtest:qq2j9gp97gm9a6lwvhxc4zu28qvqm0x4j5e72v7ejg"
      req.params.fee = 0.000035

      const result = await whChangeOutput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        "0100000001b15ee60431ef57ec682790dec5a3c0d83a0c360633ea8308fbf6d5fc10a779670400000000ffffffff03efe40000000000001976a9141522a025f2365eebee65cd8a8b8a38180dbcd59588ac5c0d00000000000047512102f3e471222bb57a7d416c82bf81c627bfcd2bdc47f36e763ae69935bba4601ece21021580b888ff56feb27f17f08802ebed26258c23697d6a462d43fc13b565fda2dd52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000"
      )
    })
  })
})
