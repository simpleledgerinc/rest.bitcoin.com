/*
  TESTS FOR THE PAYLOADCREATION.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  TODO:
  -Didn't see any logic to prevent really large unix timestamp dates in a crowdsale.
  Should we have a unit test for that?
*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const payloadCreationRoute = require("../../dist/routes/v2/payloadCreation")
const nock = require("nock") // HTTP mocking

let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
//const mockData = require("./mocks/mining-mocks")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#Payload Creation", () => {
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
    req.body = {}
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
    const root = payloadCreationRoute.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, "payloadCreation", "Returns static string")
    })
  })

  describe("#burnBCH", async () => {
    const burnBCH = payloadCreationRoute.testableComponents.burnBCH

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await burnBCH(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should GET mining information", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: "00000044" })
      }

      const result = await burnBCH(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, "00000044")
    })
  })

  describe("#changeIssuer", async () => {
    const changeIssuer = payloadCreationRoute.testableComponents.changeIssuer

    it("should throw 400 error if propertyId is missing", async () => {
      const result = await changeIssuer(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.propertyId = 4

      const result = await changeIssuer(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should GET mining information", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: "0000004600000004" })
      }

      req.body.propertyId = 4

      const result = await changeIssuer(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, "0000004600000004")
    })
  })

  describe("#closeCrowdSale", async () => {
    const closeCrowdSale =
      payloadCreationRoute.testableComponents.closeCrowdSale

    it("should throw 400 error if propertyId is missing", async () => {
      const result = await closeCrowdSale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.propertyId = 4

      const result = await closeCrowdSale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should GET mining information", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: "0000003500000004" })
      }

      req.body.propertyId = 4

      const result = await closeCrowdSale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, "0000003500000004")
    })
  })

  describe("#grant", async () => {
    const grant = payloadCreationRoute.testableComponents.grant

    it("should throw 400 error if propertyId is missing", async () => {
      const result = await grant(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 400 error if amount is missing", async () => {
      req.body.propertyId = 4

      const result = await grant(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "amount can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.propertyId = 4
      req.body.amount = "1000"

      const result = await grant(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should GET mining information", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: "000000370000000400000000000186a000" })
      }

      req.body.propertyId = 4
      req.body.amount = "1000"

      const result = await grant(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, "000000370000000400000000000186a000")
    })
  })

  describe("#crowdsale", async () => {
    const crowdsale = payloadCreationRoute.testableComponents.crowdsale

    it("should throw 400 error if ecosystem is missing", async () => {
      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "ecosystem can not be empty")
    })

    it("should throw 400 error if propertyPrecision is missing", async () => {
      req.body.ecosystem = 1

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyPrecision can not be empty")
    })

    it("should throw 400 error if previousId is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "previousId can not be empty")
    })

    it("should throw 400 error if category is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "category can not be empty")
    })

    it("should throw 400 error if subcategory is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "subcategory can not be empty")
    })

    it("should throw 400 error if name is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "name can not be empty")
    })

    it("should throw 400 error if url is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "url can not be empty")
    })

    it("should throw 400 error if data is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "data can not be empty")
    })

    it("should throw 400 error if propertyIdDesired is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyIdDesired can not be empty")
    })

    it("should throw 400 error if tokensPerUnit is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"
      req.body.propertyIdDesired = 1

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokensPerUnit can not be empty")
    })

    it("should throw 400 error if deadline is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"
      req.body.propertyIdDesired = 1
      req.body.tokensPerUnit = 1

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "deadline can not be empty")
    })

    it("should throw 400 error if earlyBonus is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"
      req.body.propertyIdDesired = 1
      req.body.tokensPerUnit = 1
      req.body.deadline = 1751969410

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "earlyBonus can not be empty")
    })

    it("should throw 400 error if totalNumber is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"
      req.body.propertyIdDesired = 1
      req.body.tokensPerUnit = 1
      req.body.deadline = 1751969410
      req.body.earlyBonus = 30
      req.body.undefine = 0

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "totalNumber can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"
      req.body.propertyIdDesired = 1
      req.body.tokensPerUnit = 1
      req.body.deadline = 1751969410
      req.body.earlyBonus = 30
      req.body.undefine = 0
      req.body.totalNumber = 10000

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return crowdsale payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "00000033010008000000007465737400746573740074657374007777772e746573742e636f6d00736f6d65206461746100000000010000000005f5e10000000000686cee821e00000000e8d4a51000"
          })
      }

      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"
      req.body.propertyIdDesired = 1
      req.body.tokensPerUnit = 1
      req.body.deadline = 1751969410
      req.body.earlyBonus = 30
      req.body.undefine = 0
      req.body.totalNumber = 10000

      const result = await crowdsale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        "00000033010008000000007465737400746573740074657374007777772e746573742e636f6d00736f6d65206461746100000000010000000005f5e10000000000686cee821e00000000e8d4a51000"
      )
    })
  })

  describe("#fixed", async () => {
    const fixed = payloadCreationRoute.testableComponents.fixed

    it("should throw 400 error if ecosystem is missing", async () => {
      const result = await fixed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "ecosystem can not be empty")
    })

    it("should throw 400 error if propertyPrecision is missing", async () => {
      req.body.ecosystem = 1

      const result = await fixed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyPrecision can not be empty")
    })

    it("should throw 400 error if previousId is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8

      const result = await fixed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "previousId can not be empty")
    })

    it("should throw 400 error if category is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0

      const result = await fixed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "category can not be empty")
    })

    it("should throw 400 error if subcategory is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"

      const result = await fixed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "subcategory can not be empty")
    })

    it("should throw 400 error if name is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"

      const result = await fixed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "name can not be empty")
    })

    it("should throw 400 error if url is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"

      const result = await fixed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "url can not be empty")
    })

    it("should throw 400 error if data is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"

      const result = await fixed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "data can not be empty")
    })

    it("should throw 400 error if amount is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"

      const result = await fixed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "amount can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"
      req.body.amount = 1000

      const result = await fixed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return fixed token payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "00000032010008000000007465737400746573740074657374007777772e746573742e636f6d00736f6d65206461746100000000174876e800"
          })
      }

      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"
      req.body.amount = 1000

      const result = await fixed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        "00000032010008000000007465737400746573740074657374007777772e746573742e636f6d00736f6d65206461746100000000174876e800"
      )
    })
  })

  describe("#managed", async () => {
    const managed = payloadCreationRoute.testableComponents.managed

    it("should throw 400 error if ecosystem is missing", async () => {
      const result = await managed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "ecosystem can not be empty")
    })

    it("should throw 400 error if propertyPrecision is missing", async () => {
      req.body.ecosystem = 1

      const result = await managed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyPrecision can not be empty")
    })

    it("should throw 400 error if previousId is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8

      const result = await managed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "previousId can not be empty")
    })

    it("should throw 400 error if category is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0

      const result = await managed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "category can not be empty")
    })

    it("should throw 400 error if subcategory is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"

      const result = await managed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "subcategory can not be empty")
    })

    it("should throw 400 error if name is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"

      const result = await managed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "name can not be empty")
    })

    it("should throw 400 error if url is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"

      const result = await managed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "url can not be empty")
    })

    it("should throw 400 error if data is missing", async () => {
      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"

      const result = await managed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "data can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"

      const result = await managed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return fixed token payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "00000036010008000000007465737400746573740074657374007777772e746573742e636f6d00736f6d65206461746100"
          })
      }

      req.body.ecosystem = 1
      req.body.propertyPrecision = 8
      req.body.previousId = 0
      req.body.category = "test"
      req.body.subcategory = "test"
      req.body.name = "test"
      req.body.url = "www.test.com"
      req.body.data = "some data"
      req.body.amount = 1000

      const result = await managed(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        "00000036010008000000007465737400746573740074657374007777772e746573742e636f6d00736f6d65206461746100"
      )
    })
  })

  describe("#participateCrowdSale", async () => {
    const participateCrowdSale =
      payloadCreationRoute.testableComponents.participateCrowdSale

    it("should throw 400 error if amount is missing", async () => {
      const result = await participateCrowdSale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "amount can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.amount = 1000

      const result = await participateCrowdSale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return fixed participateCrowdSale payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result: "0000000100000001000000174876e800"
          })
      }

      req.body.amount = 1000

      const result = await participateCrowdSale(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, "0000000100000001000000174876e800")
    })
  })

  describe("#revoke", async () => {
    const revoke = payloadCreationRoute.testableComponents.revoke

    it("should throw 400 error if propertyId is missing", async () => {
      const result = await revoke(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 400 error if amount is missing", async () => {
      req.body.propertyId = 4

      const result = await revoke(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "amount can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.propertyId = 4
      req.body.amount = 1000

      const result = await revoke(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return fixed participateCrowdSale payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result: "000000380000000400000000000186a000"
          })
      }

      req.body.propertyId = 4
      req.body.amount = 1000

      const result = await revoke(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, "000000380000000400000000000186a000")
    })
  })

  describe("#sendAll", async () => {
    const sendAll = payloadCreationRoute.testableComponents.sendAll

    it("should throw 400 error if ecosystem is missing", async () => {
      const result = await sendAll(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "ecosystem can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.ecosystem = 1

      const result = await sendAll(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return fixed participateCrowdSale payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result: "0000000401"
          })
      }

      req.body.ecosystem = 1

      const result = await sendAll(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, "0000000401")
    })
  })

  describe("#simpleSend", async () => {
    const simpleSend = payloadCreationRoute.testableComponents.simpleSend

    it("should throw 400 error if propertyId is missing", async () => {
      const result = await simpleSend(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 400 error if amount is missing", async () => {
      req.body.propertyId = 4

      const result = await simpleSend(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "amount can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.propertyId = 4
      req.body.amount = 1000

      const result = await simpleSend(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return fixed participateCrowdSale payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result: "000000000000000400000000000186a0"
          })
      }

      req.body.propertyId = 4
      req.body.amount = 1000

      const result = await simpleSend(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, "000000000000000400000000000186a0")
    })
  })

  describe("#STO (send to owner)", async () => {
    const STO = payloadCreationRoute.testableComponents.STO

    it("should throw 400 error if propertyId is missing", async () => {
      const result = await STO(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 400 error if amount is missing", async () => {
      req.body.propertyId = 4

      const result = await STO(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "amount can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.propertyId = 4
      req.body.amount = 1000

      const result = await STO(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return fixed participateCrowdSale payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result: "000000030000000400000000000186a000000004"
          })
      }

      req.body.propertyId = 4
      req.body.amount = 1000

      const result = await STO(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result, "000000030000000400000000000186a000000004")
    })
  })

  describe("#freeze", async () => {
    const freeze = payloadCreationRoute.testableComponents.freeze

    it("should throw 400 error if propertyId is missing", async () => {
      const result = await freeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 400 if address is empty", async () => {
      req.body.propertyId = 4

      const result = await freeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 400 if address is invalid", async () => {
      req.body.propertyId = 4
      req.body.toAddress = "badAddress"

      const result = await freeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.body.propertyId = 4
      req.body.toAddress =
        "bitcoincash:qzxtuwx8jxjja5wj8eyq98amq9z669s8xsl76vph9z"

      const result = await freeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid network.")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.propertyId = 4
      req.body.toAddress = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"

      const result = await freeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return fixed participateCrowdSale payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "000000b9000000040000000000002710626368746573743a71723436777a763063756d613667736b68367377786c707671646364726a6e7a6a67677174346578767000"
          })
      }

      req.body.propertyId = 4
      req.body.toAddress = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"

      const result = await freeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        "000000b9000000040000000000002710626368746573743a71723436777a763063756d613667736b68367377786c707671646364726a6e7a6a67677174346578767000"
      )
    })
  })

  describe("#unfreeze", async () => {
    const unfreeze = payloadCreationRoute.testableComponents.unfreeze

    it("should throw 400 error if propertyId is missing", async () => {
      const result = await unfreeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "propertyId can not be empty")
    })

    it("should throw 400 if address is empty", async () => {
      req.body.propertyId = 4

      const result = await unfreeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 400 if address is invalid", async () => {
      req.body.propertyId = 4
      req.body.toAddress = "badAddress"

      const result = await unfreeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.body.propertyId = 4
      req.body.toAddress =
        "bitcoincash:qzxtuwx8jxjja5wj8eyq98amq9z669s8xsl76vph9z"

      const result = await unfreeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid network.")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.propertyId = 4
      req.body.toAddress = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"

      const result = await unfreeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(res.statusCode, 499, "HTTP status code 500 or greater expected.")
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return fixed participateCrowdSale payload", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "000000ba000000040000000000002710626368746573743a71723436777a763063756d613667736b68367377786c707671646364726a6e7a6a67677174346578767000"
          })
      }

      req.body.propertyId = 4
      req.body.toAddress = "bchtest:qr46wzv0cuma6gskh6swxlpvqdcdrjnzjggqt4exvp"

      const result = await unfreeze(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        "000000ba000000040000000000002710626368746573743a71723436777a763063756d613667736b68367377786c707671646364726a6e7a6a67677174346578767000"
      )
    })
  })
})
