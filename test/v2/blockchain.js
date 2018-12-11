/*
  TODO:
  -getRawMempool
  --Add tests for 'verbos' input values
  -getMempoolEntry
  --Needs e2e test to create unconfirmed tx, for real-world test.
*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const nock = require("nock") // HTTP mocking
const blockchainRoute = require("../../dist/routes/v2/blockchain")

const util = require("util")
util.inspect.defaultOptions = { depth: 2 }

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockData = require("./mocks/blockchain-mock")

let originalEnvVars // Used during transition from integration to unit tests.

describe("#BlockchainRouter", () => {
  let req, res

  // local node will be started in regtest mode on the port 48332
  //before(panda.runLocalNode)

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
    // otherwise the panda will run forever
    //process.exit()

    // Restore any pre-existing environment variables.
    process.env.BITCOINCOM_BASEURL = originalEnvVars.BITCOINCOM_BASEURL
    process.env.RPC_BASEURL = originalEnvVars.RPC_BASEURL
    process.env.RPC_USERNAME = originalEnvVars.RPC_USERNAME
    process.env.RPC_PASSWORD = originalEnvVars.RPC_PASSWORD
  })

  describe("#root", () => {
    // root route handler.
    const root = blockchainRoute.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)

      assert.equal(result.status, "blockchain", "Returns static string")
    })
  })

  describe("getBestBlockHash()", () => {
    // block route handler.
    const getBestBlockHash = blockchainRoute.testableComponents.getBestBlockHash

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getBestBlockHash(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
      assert.include(result.error, "ENOTFOUND", "Error message expected")
    })

    it("should GET /getBestBlockHash", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBlockHash })
      }

      const result = await getBestBlockHash(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result.length, 64, "Hash string is fixed length")
    })
  })

  describe("getBlockchainInfo()", () => {
    // block route handler.
    const getBlockchainInfo =
      blockchainRoute.testableComponents.getBlockchainInfo

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getBlockchainInfo(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
      assert.include(result.error, "ENOTFOUND", "Error message expected")
    })

    it("should GET /getBlockchainInfo", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBlockchainInfo })
      }

      const result = await getBlockchainInfo(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        "chain",
        "blocks",
        "headers",
        "bestblockhash",
        "difficulty",
        "mediantime",
        "verificationprogress",
        "chainwork",
        "pruned",
        "softforks",
        "bip9_softforks"
      ])
    })
  })

  describe("getBlockCount()", () => {
    // block route handler.
    const getBlockCount = blockchainRoute.testableComponents.getBlockCount

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getBlockCount(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
      assert.include(result.error, "ENOTFOUND", "Error message expected")
    })

    it("should GET /getBlockCount", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: 126769 })
      }

      const result = await getBlockCount(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result)
    })
  })

  describe("getBlockHeader()", async () => {
    const getBlockHeader = blockchainRoute.testableComponents.getBlockHeader

    it("should throw 400 error if hash is missing", async () => {
      const result = await getBlockHeader(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "hash can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.hash =
        "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900"

      const result = await getBlockHeader(req, res)
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

    it("should GET block header", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "0000ff7f7d217c9b7845ea8b50d620c59a1bf7c276566406e9b7bc7e463e0000000000006d70322c0b697c1c81d2744f87f09f1e9780ba5d30338952e2cdc64e60456f8423bb0a5ceafa091a3e843526"
          })
      }

      req.params.hash =
        "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900"

      const result = await getBlockHeader(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        "0000ff7f7d217c9b7845ea8b50d620c59a1bf7c276566406e9b7bc7e463e0000000000006d70322c0b697c1c81d2744f87f09f1e9780ba5d30338952e2cdc64e60456f8423bb0a5ceafa091a3e843526"
      )
    })

    it("should GET verbose block header", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBlockHeader })
      }

      req.query.verbose = true
      req.params.hash =
        "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900"

      const result = await getBlockHeader(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        "hash",
        "confirmations",
        "height",
        "version",
        "versionHex",
        "merkleroot",
        "time",
        "mediantime",
        "nonce",
        "bits",
        "difficulty",
        "chainwork",
        "previousblockhash",
        "nextblockhash"
      ])
    })
  })

  describe("getChainTips()", () => {
    // block route handler.
    const getChainTips = blockchainRoute.testableComponents.getChainTips

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getChainTips(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
      assert.include(result.error, "ENOTFOUND", "Error message expected")
    })

    it("should GET /getChainTips", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockChainTips })
      }

      const result = await getChainTips(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], ["height", "hash", "branchlen", "status"])
    })
  })

  describe("getDifficulty()", () => {
    // block route handler.
    const getDifficulty = blockchainRoute.testableComponents.getDifficulty

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getDifficulty(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /getDifficulty", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: 4049809.205246544 })
      }

      const result = await getDifficulty(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result)
    })
  })

  describe("getMempoolInfo()", () => {
    // block route handler.
    const getMempoolInfo = blockchainRoute.testableComponents.getMempoolInfo

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getMempoolInfo(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
      assert.include(result.error, "ENOTFOUND", "Error message expected")
    })

    it("should GET /getMempoolInfo", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockMempoolInfo })
      }

      const result = await getMempoolInfo(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        "result",
        "bytes",
        "usage",
        "maxmempool",
        "mempoolminfree"
      ])
    })
  })

  describe("getRawMempool()", () => {
    // block route handler.
    const getRawMempool = blockchainRoute.testableComponents.getRawMempool

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getRawMempool(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
      assert.include(result.error, "ENOTFOUND", "Error message expected")
    })

    it("should GET /getMempoolInfo", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockRawMempool })
      }

      const result = await getRawMempool(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      // Not sure what other assertions should be made here.
    })
  })

  describe("getMempoolEntry()", () => {
    // block route handler.
    const getMempoolEntry = blockchainRoute.testableComponents.getMempoolEntry

    it("should throw 400 if txid is empty", async () => {
      const result = await getMempoolEntry(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.txid = `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`

      const result = await getMempoolEntry(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /getMempoolEntry", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: { error: "Transaction not in mempool" } })
      }

      req.params.txid = `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`

      const result = await getMempoolEntry(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.isString(result.error)
      assert.equal(result.error, "Transaction not in mempool")
    })
  })
})
