/*
  TESTS FOR THE DATARETRIEVAL.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const dataRetrievalRoute = require("../../dist/routes/v2/dataRetrieval")
const nock = require("nock") // HTTP mocking

let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockData = require("./mocks/data-retrieval-mocks")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#DataRetrieval", () => {
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
    const root = dataRetrievalRoute.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, "dataRetrieval", "Returns static string")
    })
  })

  describe("balancesForAddress()", () => {
    const balancesForAddress =
      dataRetrievalRoute.testableComponents.balancesForAddress

    it("should throw 400 if address is empty", async () => {
      const result = await balancesForAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 400 if address is invalid", async () => {
      req.params.address = "badAddress"

      const result = await balancesForAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.params.address =
        "bitcoincash:qzxtuwx8jxjja5wj8eyq98amq9z669s8xsl76vph9z"

      const result = await balancesForAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid network.")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.address = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"

      const result = await balancesForAddress(req, res)
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

    it("should report a zero balance correctly.", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: "No tokens found." })
      }

      req.params.address = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"

      const result = await balancesForAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, "No tokens found.")
    })

    it("should report multiple token balance correctly", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBalancesForAddress })
      }

      req.params.address = "bchtest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr"

      const result = await balancesForAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], ["propertyid", "balance", "reserved"])
    })
  })

  describe("balancesForId()", () => {
    const balancesForId = dataRetrievalRoute.testableComponents.balancesForId

    it("should throw 400 if propertyId is empty", async () => {
      const result = await balancesForId(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.propertyId = 192

      const result = await balancesForId(req, res)
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

    it("should return empty array for zero balances", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: [] })
      }

      req.params.propertyId = 117

      const result = await balancesForId(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.isEmpty(result)
    })

    it("should report token balances correctly", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBalanceForId })
      }

      req.params.propertyId = 192

      const result = await balancesForId(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ["address", "balance", "reserved"])
    })
  })

  describe("getCurrentConsensusHash()", () => {
    // block route handler.
    const getCurrentConsensusHash =
      dataRetrievalRoute.testableComponents.getCurrentConsensusHash

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getCurrentConsensusHash(req, res)
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

    it("should GET /getCurrentConsensusHash", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockConsensusHash })
      }

      const result = await getCurrentConsensusHash(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, ["block", "blockhash", "consenushash"])
    })
  })

  describe("info()", () => {
    // block route handler.
    const info = dataRetrievalRoute.testableComponents.info

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await info(req, res)
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

    it("should GET /getCurrentConsensusHash", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockInfo })
      }

      const result = await info(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        "wormholeversion_int",
        "wormholeversion",
        "bitcoincoreversion",
        "block",
        "blocktime",
        "blocktransactions",
        "totaltransactions",
        "alerts"
      ])
    })
  })

  describe("properties()", () => {
    // block route handler.
    const properties = dataRetrievalRoute.testableComponents.properties

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await properties(req, res)
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

    it("should GET properties", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockProperties })
      }

      const result = await properties(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "propertyid",
        "name",
        "category",
        "subcategory",
        "data",
        "url",
        "precision"
      ])
    })
  })
})
