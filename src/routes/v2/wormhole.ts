"use strict"

import * as express from "express"
const router = express.Router()
import axios from "axios"
import { IRequestConfig } from "./interfaces/IRequestConfig"
const RateLimit = require("express-rate-limit")
const logger = require("./logging.js")
const routeUtils = require("./route-utils")
const getWormholedb = require("./services/wormholedb")

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

// BITBOX
const BITBOXCli = require("bitbox-cli/lib/bitbox-cli").default
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
router.post("/confirmedTransactions", config.controlRateLimit2, confirmedTransactions)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "wormhole" })
}

// Get an array of wormhole TX information for a given addresses
async function confirmedTransactions(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const addresses = req.body.addresses
    const page = req.body.page ? parseInt(req.body.page, 10) : 0
    const pageSize = 100
    const whdb = await getWormholedb()

    logger.debug(`Executing wormhole/transactions with these addresses: `, addresses, `on page: `, page)

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
        const query = {
          valid: true, // Only valid transactions
          type_int: 0, // Simple Send type
          $or: [
            { sendingaddress: thisAddress }, // From address
            { referenceaddress: thisAddress }, // Receiving address
          ]
        }
        const result = await whdb.collection('confirmed').find(query).project({
          _id: 0,
          blk: 0,
          confirmations: 0,
          ismine: 0,
          tx: 0,
        })
        .sort({
          block: 1,
          positioninblock: 1,
        })
        .skip(page * pageSize)
        .limit(pageSize)
        .toArray()

        const resultCount = await whdb.collection('confirmed').countDocuments(query)
        const pagesTotal = Math.ceil(resultCount / pageSize)

        retArray.push({
          page: page,
          pagesTotal: pagesTotal,
          txs: result,
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
    confirmedTransactions
  }
}
