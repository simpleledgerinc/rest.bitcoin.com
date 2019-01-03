/*
  TESTS FOR THE DATARETRIEVAL.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  TODO:
  -pendingTransactions: Create e2e test for pendingTransactions as the data is
  transient and can not be adaquately tested in a unit or integration test.
  -frozenBalance: Need an address with an actual balance of a managed token with
  a frozen balance, for integration tests.
  -frozenBalanceForAddress: Same as frozenBalance
  -frozenBalanceForId: Same as frozenBalance
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
        "Network error: Could not communicate with full node",
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
        "Network error: Could not communicate with full node",
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

  describe("addressPropertyBalance()", () => {
    const addressPropertyBalance =
      dataRetrievalRoute.testableComponents.addressPropertyBalance

    it("should throw 400 if propertyId is empty", async () => {
      const result = await addressPropertyBalance(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 400 if address is empty", async () => {
      req.params.propertyId = 24

      const result = await addressPropertyBalance(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.propertyId = 24
      req.params.address = "bchtest:qz3fgledq0tgl0ry6pn0c5nmufspfrr8aqsyuc39yl"

      const result = await addressPropertyBalance(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should report token balances correctly", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockAddressPropertyBalance })
      }

      req.params.propertyId = 24
      req.params.address = "bchtest:qz3fgledq0tgl0ry6pn0c5nmufspfrr8aqsyuc39yl"

      const result = await addressPropertyBalance(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["balance", "reserved"])
    })
  })

  describe("balancesHash()", () => {
    const balancesHash = dataRetrievalRoute.testableComponents.balancesHash

    it("should throw 400 if propertyId is empty", async () => {
      const result = await balancesHash(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.propertyId = 24
      req.params.address = "bchtest:qz3fgledq0tgl0ry6pn0c5nmufspfrr8aqsyuc39yl"

      const result = await balancesHash(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should report token block information", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBalanceHash })
      }

      req.params.propertyId = 24

      const result = await balancesHash(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        "block",
        "blockhash",
        "propertyid",
        "balanceshash"
      ])
    })
  })

  describe("crowdsale()", () => {
    const crowdsale = dataRetrievalRoute.testableComponents.crowdsale

    it("should throw 400 if propertyId is empty", async () => {
      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.propertyId = 7

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should throw 400 for noncrowdsale propertyid", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: {
              message: "Property identifier does not refer to a crowdsale"
            }
          })
      }

      req.params.propertyId = 6

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Property identifier does not refer to a crowdsale"
      )
    })

    it("should report crowdsale information", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockCrowdsale })
      }

      req.params.propertyId = 7

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        "propertyid",
        "name",
        "active",
        "issuer",
        "propertyiddesired",
        "precision",
        "tokensperunit",
        "earlybonus",
        "starttime",
        "deadline",
        "amountraised",
        "tokensissued",
        "addedissuertokens",
        "closedearly",
        "maxtokens"
      ])
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
        "Network error: Could not communicate with full node",
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

  describe("grants()", () => {
    const grants = dataRetrievalRoute.testableComponents.grants

    it("should throw 400 if propertyId is empty", async () => {
      const result = await grants(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.propertyId = 4

      const result = await grants(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should throw 400 for non-managed propertyid", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: {
              message:
                "Property identifier does not refer to a managed property"
            }
          })
      }

      req.params.propertyId = 6

      const result = await grants(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Property identifier does not refer to a managed property"
      )
    })

    it("should report crowdsale information", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockGrants })
      }

      req.params.propertyId = 4

      const result = await grants(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        "propertyid",
        "name",
        "issuer",
        "creationtxid",
        "totaltokens",
        "issuances"
      ])
      assert.isArray(result.issuances)
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
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET info", async () => {
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

  describe("payload()", () => {
    const payload = dataRetrievalRoute.testableComponents.payload

    it("should throw 400 if txid is empty", async () => {
      const result = await payload(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.txid =
        "18abf3097cf2b8731daeea06bf0b19b0df9f3d4895d7d09ddf77bb7f63c9b831"

      const result = await payload(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should throw 400 for non-WH TX", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: {
              message: "Not a Wormhole Protocol transaction"
            }
          })
      }

      req.params.txid =
        "af90b66b3568ab879ad6c7a59cb2cd85c13c92fada0de2a691b27673e87e337f"

      const result = await payload(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Not a Wormhole Protocol transaction")
    })

    it("should get tx payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockPayload })
      }

      req.params.txid =
        "18abf3097cf2b8731daeea06bf0b19b0df9f3d4895d7d09ddf77bb7f63c9b831"

      const result = await payload(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["payload", "payloadsize"])
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
        "Network error: Could not communicate with full node",
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

  describe("property()", () => {
    const property = dataRetrievalRoute.testableComponents.property

    it("should throw 400 if propertyid is empty", async () => {
      const result = await property(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.propertyId = 111

      const result = await property(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should throw 400 for non-existing propertyid", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: {
              message: "JSON integer out of range"
            }
          })
      }

      req.params.propertyId = 111111111111111111111

      const result = await property(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "JSON integer out of range")
    })

    it("should get property information", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockProperty })
      }

      req.params.propertyId = 111

      const result = await property(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        "propertyid",
        "name",
        "category",
        "subcategory",
        "data",
        "url",
        "precision",
        "issuer",
        "creationtxid",
        "fixedissuance",
        "managedissuance",
        "totaltokens"
      ])
    })
  })

  describe("sto()", () => {
    const sto = dataRetrievalRoute.testableComponents.sto

    it("should throw 400 if txid is empty", async () => {
      const result = await sto(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.txid =
        "18abf3097cf2b8731daeea06bf0b19b0df9f3d4895d7d09ddf77bb7f63c9b831"

      const result = await sto(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should throw 400 for non-WH transaction", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: {
              message: "Not a Wormhole Protocol transaction"
            }
          })
      }

      req.params.txid =
        "af90b66b3568ab879ad6c7a59cb2cd85c13c92fada0de2a691b27673e87e337f"

      const result = await sto(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Not a Wormhole Protocol transaction")
    })

    it("should get STO information", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockSTO })
      }

      req.params.txid =
        "18abf3097cf2b8731daeea06bf0b19b0df9f3d4895d7d09ddf77bb7f63c9b831"

      const result = await sto(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
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

  describe("transaction()", () => {
    const transaction = dataRetrievalRoute.testableComponents.transaction

    it("should throw 400 if txid is empty", async () => {
      const result = await transaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.txid =
        "18abf3097cf2b8731daeea06bf0b19b0df9f3d4895d7d09ddf77bb7f63c9b831"

      const result = await transaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should throw 400 for non-WH transaction", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: {
              message: "Not a Wormhole Protocol transaction"
            }
          })
      }

      req.params.txid =
        "af90b66b3568ab879ad6c7a59cb2cd85c13c92fada0de2a691b27673e87e337f"

      const result = await transaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Not a Wormhole Protocol transaction")
    })

    it("should get transaction information", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockTransaction })
      }

      req.params.txid =
        "18abf3097cf2b8731daeea06bf0b19b0df9f3d4895d7d09ddf77bb7f63c9b831"

      const result = await transaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
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

  describe("blockTransactions()", () => {
    const blockTransactions =
      dataRetrievalRoute.testableComponents.blockTransactions

    it("should throw 400 if index is empty", async () => {
      const result = await blockTransactions(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "index can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.index = 1249133

      const result = await blockTransactions(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should throw 400 for out-of-range block index", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: {
              message: "JSON integer out of range"
            }
          })
      }

      req.params.index = 1111111111111111

      const result = await blockTransactions(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "JSON integer out of range")
    })

    it("should get WH block transactions", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBlockTransactions })
      }

      req.params.index = 1249133

      const result = await blockTransactions(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
    })
  })

  describe("pendingTransactions()", () => {
    const pendingTransactions =
      dataRetrievalRoute.testableComponents.pendingTransactions

    it("should throw 400 if address is empty", async () => {
      const result = await pendingTransactions(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.address = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"

      const result = await pendingTransactions(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should throw 400 if address is invalid", async () => {
      req.params.address = "badAddress"

      const result = await pendingTransactions(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.params.address =
        "bitcoincash:qzxtuwx8jxjja5wj8eyq98amq9z669s8xsl76vph9z"

      const result = await pendingTransactions(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid network.")
    })

    it("should get pending transactions", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: [] })
      }

      req.params.address = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"

      const result = await pendingTransactions(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
    })
  })

  describe("frozenBalance()", () => {
    const frozenBalance = dataRetrievalRoute.testableComponents.frozenBalance

    it("should throw 400 if address is empty", async () => {
      const result = await frozenBalance(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 400 if propertyId is empty", async () => {
      req.params.address = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"
      const result = await frozenBalance(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.address = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"
      req.params.propertyId = 4

      const result = await frozenBalance(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should throw 400 if address is invalid", async () => {
      req.params.address = "badAddress"
      req.params.propertyId = 4

      const result = await frozenBalance(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.params.address =
        "bitcoincash:qzxtuwx8jxjja5wj8eyq98amq9z669s8xsl76vph9z"
      req.params.propertyId = 4

      const result = await frozenBalance(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid network.")
    })

    it("should get frozen balance", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockFrozenBalance })
      }

      req.params.address = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"
      req.params.propertyId = 4

      const result = await frozenBalance(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["frozen", "balance"])
    })
  })

  describe("frozenBalanceForAddress()", () => {
    const frozenBalanceForAddress =
      dataRetrievalRoute.testableComponents.frozenBalanceForAddress

    it("should throw 400 if address is empty", async () => {
      const result = await frozenBalanceForAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.address = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"

      const result = await frozenBalanceForAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should throw 400 if address is invalid", async () => {
      req.params.address = "badAddress"

      const result = await frozenBalanceForAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.params.address =
        "bitcoincash:qzxtuwx8jxjja5wj8eyq98amq9z669s8xsl76vph9z"

      const result = await frozenBalanceForAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid network.")
    })

    it("should get frozen balance", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: [] })
      }

      req.params.address = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"

      const result = await frozenBalanceForAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
    })
  })

  describe("frozenBalanceForId()", () => {
    const frozenBalanceForId =
      dataRetrievalRoute.testableComponents.frozenBalanceForId

    it("should throw 400 if propertyId is empty", async () => {
      const result = await frozenBalanceForId(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should get frozen balance", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: [] })
      }

      req.params.propertyId = 4

      const result = await frozenBalanceForId(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
    })
  })
})
