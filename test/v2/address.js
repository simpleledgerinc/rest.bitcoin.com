/*
  TESTS FOR THE ADDRESS.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  To-Do:
  -/details/:address
  --Verify to/from query options work correctly.
  -GET /unconfirmed/:address & POST /unconfirmed
  --Should initiate a transfer of BCH to verify unconfirmed TX.
  ---This would be more of an e2e test.
*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const addressRoute = require("../../dist/routes/v2/address")
const nock = require("nock") // HTTP mocking

// Full route testing
const request = require("supertest")
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const routeRateLimit = require("../../dist/middleware/route-ratelimit").routeRateLimit

let originalUrl // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockData = require("./mocks/address-mock")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#AddressRouter", () => {
  let req, res

  before(() => {
    originalUrl = process.env.BITCOINCOM_BASEURL

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(routeRateLimit)
    app.use(addressRoute.router)

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "unit"
    if (process.env.TEST === "unit")
      process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

    console.log(`Testing type is: ${process.env.TEST}`)
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
    process.env.BITCOINCOM_BASEURL = originalUrl
  })

  describe("#root", () => {
    // root route handler.
    const root = addressRoute.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)

      assert.equal(result.status, "address", "Returns static string")
    })

    it("should reject requests after rate limit exceeded", async () => {
      for (let i = 0; i < 60; i++) {
        await request(app)
          .get("/")
          .set("Accept", "application/json")
          .expect(200)
          .then(response => {
            assert.include(response.body.status, "address")
          })
      }

      return request(app)
        .get("/")
        .set("Accept", "application/json")
        .expect(500)
        .then(response => {
          assert.include(
            response.body.error,
            "Too many requests. Limits are 60 requests per minute.",
            "Proper error message"
          )
        })
    })
  })

  describe("#AddressDetailsBulk", () => {
    // details route handler.
    const detailsBulk = addressRoute.testableComponents.detailsBulk

    it("should throw an error for an empty body", async () => {
      return request(app)
        .post("/details")
        .set("Content-Type", "application/json")
        .set("Accept", "application/json")
        .expect(400)
        .then(response => {
          assert.include(
            response.body.error,
            "addresses needs to be an array",
            "Proper error message"
          )
        })
    })

    it("should error on non-array single address", async () => {
      return request(app)
        .post("/details")
        .send({ address: "qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c" })
        .set("Content-Type", "application/json")
        .set("Accept", "application/json")
        .expect(400)
        .then(response => {
          assert.include(
            response.body.error,
            "addresses needs to be an array",
            "Proper error message"
          )
        })
    })

    it("should throw an error for an invalid address", async () => {
      return request(app)
        .post("/details")
        .send({
          addresses: ["02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c"]
        })
        .set("Content-Type", "application/json")
        .set("Accept", "application/json")
        .expect(400)
        .then(response => {
          assert.include(
            response.body.error,
            "Invalid BCH address",
            "Proper error message"
          )
        })
    })

    it("should detect a network mismatch", async () => {
      return request(app)
        .post("/details")
        .send({
          addresses: [`bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`]
        })
        .set("Content-Type", "application/json")
        .set("Accept", "application/json")
        .expect(400)
        .then(response => {
          assert.include(
            response.body.error,
            "Invalid network",
            "Proper error message"
          )
        })
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.body = {
          addresses: [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]
        }

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

        const result = await detailsBulk(req, res)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should default to page 0", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(/addr\/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz.*/)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsBulk(req, res)

      // Assert current page defaults to 0
      assert.equal(result[0].currentPage, 0)
    })

    it("should process the requested page", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`],
        page: 5
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(/addr\/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz.*/)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsBulk(req, res)

      // Assert current page is same as requested
      assert.equal(result[0].currentPage, 5)
    })

    it("should calculate the total number of pages", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(/addr\/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz.*/)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsBulk(req, res)

      assert.equal(result[0].pagesTotal, 1)
    })

    it("should get details for a single address", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(/addr\/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz.*/)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.equal(result.length, 1, "Array with one entry")
      assert.exists(result[0].addrStr)
      assert.exists(result[0].balance)
      assert.exists(result[0].balanceSat)
      assert.exists(result[0].totalReceived)
      assert.exists(result[0].totalReceivedSat)
      assert.exists(result[0].totalSent)
      assert.exists(result[0].totalSentSat)
      assert.exists(result[0].unconfirmedBalance)
      assert.exists(result[0].unconfirmedBalanceSat)
      assert.exists(result[0].unconfirmedTxApperances)
      assert.exists(result[0].txApperances)
      assert.isArray(result[0].transactions)
      assert.exists(result[0].legacyAddress)
      assert.exists(result[0].cashAddress)
      assert.exists(result[0].currentPage)
      assert.exists(result[0].pagesTotal)
    })

    it("should get details for multiple addresses", async () => {
      req.body = {
        addresses: [
          `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`,
          `bchtest:qzknfggae0av6yvxk77gmyq7syc67yux6sk80haqyr`
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(/addr\/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz.*/)
          .reply(200, mockData.mockAddressDetails)

        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(/addr\/mwJnEzXzKkveF2q5Af9jxi9j1zrtWAnPU8.*/)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, "2 outputs for 2 inputs")
    })
  })

  describe("#AddressDetailsSingle", () => {
    // details route handler.
    const detailsSingle = addressRoute.testableComponents.detailsSingle

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.params.address = `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

        const result = await detailsSingle(req, res)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should default to page 0", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(/addr\/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz.*/)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsSingle(req, res)

      // Assert current page defaults to 0
      assert.equal(result.currentPage, 0)
    })

    it("should process the requested page", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`
      req.query.page = 5

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(/addr\/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz.*/)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsSingle(req, res)

      // Assert current page is same as requested
      assert.equal(result.currentPage, 5)
    })

    it("should calculate the total number of pages", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(/addr\/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz.*/)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsSingle(req, res)

      assert.equal(result.pagesTotal, 1)
    })

    it("should get details for a single address", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(/addr\/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz.*/)
          .reply(200, mockData.mockAddressDetails)
      }

      // Call the details API.
      const result = await detailsSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.hasAllKeys(result, [
        "addrStr",
        "balance",
        "balanceSat",
        "totalReceived",
        "totalReceivedSat",
        "totalSent",
        "totalSentSat",
        "unconfirmedBalance",
        "unconfirmedBalanceSat",
        "unconfirmedTxApperances",
        "txApperances",
        "transactions",
        "legacyAddress",
        "cashAddress",
        "currentPage",
        "pagesTotal"
      ])
    })
  })
})
