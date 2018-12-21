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
    req.query = {}

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
      rawtransactions.testableComponents.decodeRawTransactionSingle

    it("should throw error if hex is missing", async () => {
      const result = await decodeRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "hex can not be empty")
    })

    it("should throw 503 when network issues", async () => {
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

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node.",
        "Error message expected"
      )
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

    it("should throw 503 when network issues", async () => {
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

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node.",
        "Error message expected"
      )
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

  describe("getRawTransactionBulk()", () => {
    // block route handler.
    const getRawTransactionBulk =
      rawtransactions.testableComponents.getRawTransactionBulk

    it("should throw 400 error if txids array is missing", async () => {
      const result = await getRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txids must be an array")
    })

    it("should throw 400 error if txids array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.txids = testArray

      const result = await getRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large. Max 20 txids")
    })

    it("should throw 400 error if txid is empty", async () => {
      req.body.txids = [""]

      const result = await getRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Encountered empty TXID")
    })

    it("should throw 400 error if txid is invalid", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: { message: "parameter 1 must be of length 64 (not 6)" }
          })
      }

      req.body.txids = ["abc123"]

      const result = await getRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "parameter 1 must be of length 64 (not 6)")
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

      const result = await getRawTransactionBulk(req, res)
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

      const result = await getRawTransactionBulk(req, res)
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

  describe("getRawTransactionSingle()", () => {
    // block route handler.
    const getRawTransactionSingle =
      rawtransactions.testableComponents.getRawTransactionSingle

    it("should throw 400 error if txid is missing", async () => {
      const result = await getRawTransactionSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 400 error if txid is invalid", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: { message: "parameter 1 must be of length 64 (not 6)" }
          })
      }

      req.params.txid = "abc123"

      const result = await getRawTransactionSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "parameter 1 must be of length 64 (not 6)")
    })

    it("should get concise transaction data", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockRawTransactionConcise })
      }

      req.params.txid =
        "bd320377db7026a3dd5c7ec444596c0ee18fc25c4f34ee944adc03e432ce1971"

      const result = await getRawTransactionSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
    })

    it("should get verbose transaction data", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockRawTransactionVerbose })
      }

      req.params.txid =
        "bd320377db7026a3dd5c7ec444596c0ee18fc25c4f34ee944adc03e432ce1971"
      req.query.verbose = true

      const result = await getRawTransactionSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
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
      assert.isArray(result.vin)
      assert.isArray(result.vout)
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
          .reply(500, {
            error: { message: "TX decode failed" }
          })
      }

      req.body.hex = ["abc123"]

      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "TX decode failed")
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
        assert.include(result.error, "transaction already in block chain")
      }
    })
  })

  describe("whChangeOutput()", () => {
    const whChangeOutput = rawtransactions.testableComponents.whChangeOutput

    it("should throw 400 error if rawtx is empty", async () => {
      req.body.rawtx = ""
      const result = await whChangeOutput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "rawtx can not be empty")
    })

    it("should throw 400 error if prevtx is empty", async () => {
      req.body.rawtx = "fakeTx"
      const result = await whChangeOutput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "prevtxs can not be empty")
    })

    it("should throw 400 error if destination is empty", async () => {
      req.body.rawtx = "fakeTx"
      req.body.prevtxs = JSON.stringify([{ a: 0 }])
      const result = await whChangeOutput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "destination can not be empty")
    })

    it("should throw 400 error fee is empty", async () => {
      req.body.rawtx = "fakeTx"
      req.body.prevtxs = JSON.stringify([{ a: 0 }])
      req.body.destination = "bchtest:fakeaddress"
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

      req.body.rawtx =
        "0100000001b15ee60431ef57ec682790dec5a3c0d83a0c360633ea8308fbf6d5fc10a779670400000000ffffffff025c0d00000000000047512102f3e471222bb57a7d416c82bf81c627bfcd2bdc47f36e763ae69935bba4601ece21021580b888ff56feb27f17f08802ebed26258c23697d6a462d43fc13b565fda2dd52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000"
      req.body.prevtxs = [
        {
          txid:
            "6779a710fcd5f6fb0883ea3306360c3ad8c0a3c5de902768ec57ef3104e65eb1",
          vout: 4,
          scriptPubKey: "76a9147b25205fd98d462880a3e5b0541235831ae959e588ac",
          value: 0.00068257
        }
      ]
      req.body.destination =
        "bchtest:qq2j9gp97gm9a6lwvhxc4zu28qvqm0x4j5e72v7ejg"
      req.body.fee = 0.000035

      const result = await whChangeOutput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        "0100000001b15ee60431ef57ec682790dec5a3c0d83a0c360633ea8308fbf6d5fc10a779670400000000ffffffff03efe40000000000001976a9141522a025f2365eebee65cd8a8b8a38180dbcd59588ac5c0d00000000000047512102f3e471222bb57a7d416c82bf81c627bfcd2bdc47f36e763ae69935bba4601ece21021580b888ff56feb27f17f08802ebed26258c23697d6a462d43fc13b565fda2dd52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000"
      )
    })
  })

  describe("whInput()", () => {
    const whInput = rawtransactions.testableComponents.whInput

    it("should throw 400 error if txid is empty", async () => {
      const result = await whInput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 400 error if n is empty", async () => {
      req.body.txid = "fakeTXID"

      const result = await whInput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "n can not be empty")
    })

    it("should generate tx hex if rawtx is empty", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "0200000001ee42830efcd184b75581f8ad0a34bee5feccf8d39adf86a5ed05df17907206b00000000000ffffffff0000000000"
          })
      }

      req.body.txid =
        "b006729017df05eda586df9ad3f8ccfee5be340aadf88155b784d1fc0e8342ee"
      req.body.n = 0

      const result = await whInput(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        "0200000001ee42830efcd184b75581f8ad0a34bee5feccf8d39adf86a5ed05df17907206b00000000000ffffffff0000000000"
      )
    })
  })

  describe("whOpReturn()", () => {
    const whOpReturn = rawtransactions.testableComponents.whOpReturn

    it("should throw 400 error if rawtx is empty", async () => {
      const result = await whOpReturn(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "rawtx can not be empty")
    })

    it("should throw 400 error if payload is empty", async () => {
      req.body.rawtx = "fakeTX"

      const result = await whOpReturn(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "payload can not be empty")
    })

    it("should return a transaction payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "0100000000010000000000000000166a140877686300000000000000020000000006dac2c000000000"
          })
      }

      req.body.rawtx = "01000000000000000000"
      req.body.payload = "00000000000000020000000006dac2c0"

      const result = await whOpReturn(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        "0100000000010000000000000000166a140877686300000000000000020000000006dac2c000000000"
      )
    })
  })

  describe("whReference()", () => {
    const whReference = rawtransactions.testableComponents.whReference

    it("should throw 400 error if rawtx is empty", async () => {
      const result = await whReference(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "rawtx can not be empty")
    })

    it("should throw 400 error if destination is empty", async () => {
      req.body.rawtx = "faketx"

      const result = await whReference(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "destination can not be empty")
    })

    it("should generate reference tx hex with no amount specified", async () => {
      const expected =
        "0100000001a7a9402ecd77f3c9f745793c9ec805bfa2e14b89877581c734c774864247e6f50400000000ffffffff04aa0a0000000000001976a9146d18edfe073d53f84dd491dae1379f8fb0dfe5d488ac5c0d0000000000004751210252ce4bdd3ce38b4ebbc5a6e1343608230da508ff12d23d85b58c964204c4cef3210294cc195fc096f87d0f813a337ae7e5f961b1c8a18f1f8604a909b3a5121f065b52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac22020000000000001976a9141522a025f2365eebee65cd8a8b8a38180dbcd59588ac00000000"

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result: expected
          })
      }

      req.body.rawtx =
        "0100000001a7a9402ecd77f3c9f745793c9ec805bfa2e14b89877581c734c774864247e6f50400000000ffffffff03aa0a0000000000001976a9146d18edfe073d53f84dd491dae1379f8fb0dfe5d488ac5c0d0000000000004751210252ce4bdd3ce38b4ebbc5a6e1343608230da508ff12d23d85b58c964204c4cef3210294cc195fc096f87d0f813a337ae7e5f961b1c8a18f1f8604a909b3a5121f065b52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000"
      req.body.destination =
        "bchtest:qq2j9gp97gm9a6lwvhxc4zu28qvqm0x4j5e72v7ejg"

      const result = await whReference(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, expected)
    })

    it("should generate reference tx hex with amount specified", async () => {
      const expected =
        "0100000001a7a9402ecd77f3c9f745793c9ec805bfa2e14b89877581c734c774864247e6f50400000000ffffffff04aa0a0000000000001976a9146d18edfe073d53f84dd491dae1379f8fb0dfe5d488ac5c0d0000000000004751210252ce4bdd3ce38b4ebbc5a6e1343608230da508ff12d23d85b58c964204c4cef3210294cc195fc096f87d0f813a337ae7e5f961b1c8a18f1f8604a909b3a5121f065b52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac20a10700000000001976a9141522a025f2365eebee65cd8a8b8a38180dbcd59588ac00000000"

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result: expected
          })
      }

      req.body.rawtx =
        "0100000001a7a9402ecd77f3c9f745793c9ec805bfa2e14b89877581c734c774864247e6f50400000000ffffffff03aa0a0000000000001976a9146d18edfe073d53f84dd491dae1379f8fb0dfe5d488ac5c0d0000000000004751210252ce4bdd3ce38b4ebbc5a6e1343608230da508ff12d23d85b58c964204c4cef3210294cc195fc096f87d0f813a337ae7e5f961b1c8a18f1f8604a909b3a5121f065b52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000"
      req.body.destination =
        "bchtest:qq2j9gp97gm9a6lwvhxc4zu28qvqm0x4j5e72v7ejg"
      req.body.amount = 0.005

      const result = await whReference(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, expected)
    })
  })

  describe("whDecodeTx()", () => {
    const whDecodeTx = rawtransactions.testableComponents.whDecodeTx

    it("should throw 400 error if rawtx is empty", async () => {
      const result = await whDecodeTx(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "rawtx can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.rawtx =
        "0200000001f4158c5ec0424656626d201a50f8b51fbe94468aaec88d211bbc59c306e9df01000000006b483045022100c8397a4dd8c8cf1cdc80fb3d86665a8d88379f2583c2efa4165219939eebe32202207ec12283d6a5fe764e2b2efa3934357da161526d497eff20ac221d5f737d68d24121033dab7ef8681396e7c95f88a2733c470fdb11e2f9825838ecd059fc9fe7301275ffffffff0392809800000000001976a914a4b98b0c118de83e7d39c834445f51dce62425f588ac0000000000000000166a14087768630000000000000170000000003b9aca0022020000000000001976a914a4b98b0c118de83e7d39c834445f51dce62425f588ac00000000"

      const result = await whDecodeTx(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node.",
        "Error message expected"
      )
    })

    it("should return node-error if rawtx is not a WH TX", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: { message: "Not a Wormhole Protocol transaction" }
          })
      }

      req.params.rawtx =
        "020000000189ff70b9107ccd7af762d9d6ad33f4316719fcb0b1affcb588a2b8e37f85a9f8000000006b483045022100abcee73654cf4fb5ad951b3967a3577a5049435a35bc23e2d064026dc49f6b07022062cba94df0a90fa5bde2d2973eae1dfd3027126b7dec579baf9dc123a2a79fd44121033dab7ef8681396e7c95f88a2733c470fdb11e2f9825838ecd059fc9fe7301275ffffffff0210270000000000001976a914a4b98b0c118de83e7d39c834445f51dce62425f588ac8a589800000000001976a914a4b98b0c118de83e7d39c834445f51dce62425f588ac00000000"

      const result = await whDecodeTx(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Not a Wormhole Protocol transaction")
    })

    it("should decode WH TX", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockWHDecode })
      }

      req.params.rawtx =
        "0200000001f4158c5ec0424656626d201a50f8b51fbe94468aaec88d211bbc59c306e9df01000000006b483045022100c8397a4dd8c8cf1cdc80fb3d86665a8d88379f2583c2efa4165219939eebe32202207ec12283d6a5fe764e2b2efa3934357da161526d497eff20ac221d5f737d68d24121033dab7ef8681396e7c95f88a2733c470fdb11e2f9825838ecd059fc9fe7301275ffffffff0392809800000000001976a914a4b98b0c118de83e7d39c834445f51dce62425f588ac0000000000000000166a14087768630000000000000170000000003b9aca0022020000000000001976a914a4b98b0c118de83e7d39c834445f51dce62425f588ac00000000"

      const result = await whDecodeTx(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        "txid",
        "fee",
        "sendingaddress",
        "referenceaddress",
        "ismine",
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
        "block",
        "confirmations"
      ])
    })
  })

  describe("whCreateTx()", () => {
    const whCreateTx = rawtransactions.testableComponents.whCreateTx

    it("should throw 400 error if inputs are empty", async () => {
      const result = await whCreateTx(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "inputs can not be empty")
    })

    it("should throw 400 error if outputs are empty", async () => {
      req.body.inputs = JSON.stringify([{ txid: "myid", vout: 0 }])
      const result = await whCreateTx(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "outputs can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.inputs = JSON.stringify([mockData.mockWHCreateInput])
      req.body.outputs = JSON.stringify({})

      const result = await whCreateTx(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node.",
        "Error message expected"
      )
    })

    it("should return node-error", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: { message: "txid must be hexadecimal string (not 'myid')" }
          })
      }

      req.body.inputs = [{ txid: "myid", vout: 0 }]
      req.body.outputs = {}

      const result = await whCreateTx(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "txid must be hexadecimal string (not 'myid')"
      )
    })

    it("should create WH TX", async () => {
      const expected =
        "0200000001b29af9aaf74f82ad7ff181fcc6f3d2cf5fa701a1c969620f9185ee3df29cedf70100000000ffffffff0000000000"

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: expected })
      }

      req.body.inputs = [mockData.mockWHCreateInput]
      req.body.outputs = {}

      const result = await whCreateTx(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, expected)
    })
  })
})
