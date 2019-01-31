"use strict"

import * as express from "express"
const router = express.Router()
const RateLimit = require("express-rate-limit")
const logger = require("./logging.js")
const routeUtils = require("./route-utils")
const getWormholedb = require("./services/wormholedb").getInstance

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

// BITBOX
const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default
const BITBOX = new BITBOXCli()

// Typescript
interface IRLConfig {
  [controlRateLimit1: string]: any
  controlRateLimit2: any
}

// Typescript
const config: IRLConfig = {
  controlRateLimit1: undefined,
  controlRateLimit2: undefined
}

let i = 1
while (i < 3) {
  config[`controlRateLimit${i}`] = new RateLimit({
    windowMs: 60 * 1000, // 1 minute window
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    max: 60, // start blocking after 60 requests
    handler: (req: express.Request, res: express.Response /*next*/) => {
      res.format({
        json: () => {
          res.status(500).json({
            error: "Too many requests. Limits are 60 requests per minute."
          })
        }
      })
    }
  })
  i++
}

router.get("/", config.controlRateLimit1, root)
router.post("/confirmed", config.controlRateLimit2, confirmed)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "wormhole/transaction" })
}

// Get an array of wormhole TX information for a given addresses
async function confirmed(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const addresses = req.body.addresses
    const currentPage = req.body.page ? parseInt(req.body.page, 10) : 0
    const pageSize = 100
    const whdb: Wormholedb = await getWormholedb()

    logger.debug(`Executing wormhole/transactions with these addresses: `, addresses, `on page: `, currentPage)

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses must be an array" })
    }

    // Loop through each address.
    const retArray = []
    for (let i = 0; i < addresses.length; i++) {
      const thisAddress = addresses[i] // Current address.

      // Ensure the input is a valid BCH address.
      try {
        BITBOX.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }

      try {
        const result = await whdb.getConfirmedTransactions(thisAddress, pageSize, currentPage)

        const resultTxs = result.data.c[0].data
        const resultCount = result.data.c[0].metadata[0] ? result.data.c[0].metadata[0].count : 0
        const pagesTotal = Math.ceil(resultCount / pageSize)

        retArray.push({
          currentPage: currentPage,
          pagesTotal: pagesTotal,
          txs: resultTxs,
        })
      } catch (err) {
        console.log(err)
        res.status(400)
        return res.json({
          error: `Error fetching transactions`
        })
      }
    }

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retArray)
  } catch (error) {
    // Return error message to the caller.
    res.status(500)
    if (error.response && error.response.data && error.response.data.error)
      return res.json({ error: error.response.data.error })
    return res.json({ error: util.inspect(error) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    confirmed
  }
}
