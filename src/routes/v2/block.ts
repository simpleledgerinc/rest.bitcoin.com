"use strict"

import * as express from "express"
import * as requestUtils from "./services/requestUtils"
import * as bitbox from "./services/bitbox"
const logger = require("./logging.js")
import axios from "axios"
const routeUtils = require("./route-utils")

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const router: express.Router = express.Router()
//const BitboxHTTP = bitbox.getInstance()

const RateLimit = require("express-rate-limit")

interface IRLConfig {
  [blockRateLimit1: string]: any
  blockRateLimit2: any
  blockRateLimit3: any
  blockRateLimit4: any
  blockRateLimit5: any
}

const config: IRLConfig = {
  blockRateLimit1: undefined,
  blockRateLimit2: undefined,
  blockRateLimit3: undefined,
  blockRateLimit4: undefined,
  blockRateLimit5: undefined
}

let i = 1
while (i < 6) {
  config[`blockRateLimit${i}`] = new RateLimit({
    windowMs: 60000, // 1 hour window
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

router.get("/", config.blockRateLimit1, root)
router.get("/detailsByHash/:hash", config.blockRateLimit2, detailsByHashSingle)
router.post("/detailsByHash", config.blockRateLimit3, detailsByHashBulk)
router.get(
  "/detailsByHeight/:height",
  config.blockRateLimit4,
  detailsByHeightSingle
)
router.post("/detailsByHeight", config.blockRateLimit5, detailsByHeightBulk)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "block" })
}

// Call the insight server to get block details based on the hash.
async function detailsByHashSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const hash = req.params.hash

    // Reject if hash is empty
    if (!hash || hash === "") {
      res.status(400)
      return res.json({ error: "hash must not be empty" })
    }

    const response = await axios.get(
      `${process.env.BITCOINCOM_BASEURL}block/${hash}`
    )

    const parsed = response.data
    return res.json(parsed)
  } catch (error) {
    // Write out error to error log.
    //logger.error(`Error in block/detailsByHash: `, error)

    if (error.response && error.response.status === 404) {
      res.status(404)
      return res.json({ error: "Not Found" })
    }

    res.status(500)
    return res.json({ error: util.inspect(error) })
  }
}

async function detailsByHashBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const hashes = req.body.hashes

    // Reject if hashes is not an array.
    if (!Array.isArray(hashes)) {
      res.status(400)
      return res.json({
        error: "hashes needs to be an array. Use GET for single hash."
      })
    }

    // Enforce no more than 20 hashes.
    if (hashes.length > 20) {
      res.json({
        error: "Array too large. Max 20 hashes"
      })
    }

    logger.debug(`Executing detailsByHash with these hashes: `, hashes)

    // Loop through each hash.
    const retArray = []
    for (let i = 0; i < hashes.length; i++) {
      const thisHash = hashes[i] // Current hash.

      // Ensure the input is a valid BCH address.
      try {
        if (thisHash.length !== 64) {
          throw "This is not a hash"
        }
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid hash. Double check your hash is valid: ${thisHash}`
        })
      }

      const response = await axios.get(
        `${process.env.BITCOINCOM_BASEURL}block/${thisHash}`
      )

      retArray.push(response.data)
    }

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retArray)
  } catch (error) {
    // Write out error to error log.
    //logger.error(`Error in block/detailsByHash: `, error)

    if (error.response && error.response.status === 404) {
      res.status(404)
      return res.json({ error: "Not Found" })
    }

    res.status(500)
    return res.json({ error: util.inspect(error) })
  }
}

// Call the Full Node to get block hash based on height, then call the Insight
// server to get details from that hash.
async function detailsByHeightSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const height = req.params.height

    // Reject if id is empty
    if (!height || height === "") {
      res.status(400)
      return res.json({ error: "height must not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getblockhash"
    requestConfig.data.method = "getblockhash"
    requestConfig.data.params = [parseInt(height)]

    const response = await BitboxHTTP(requestConfig)

    const hash = response.data.result
    //console.log(`hash: ${hash}`)

    // Call detailsByHashSingle now that the hash has been retrieved.
    req.params.hash = hash
    return detailsByHashSingle(req, res, next)
  } catch (error) {
    // Write out error to error log.
    //logger.error(`Error in control/getInfo: `, error)

    res.status(500)
    return res.json({ error: util.inspect(error) })
  }
}

async function detailsByHeightBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const heights = req.body.heights

    // Reject if heights is not an array.
    if (!Array.isArray(heights)) {
      res.status(400)
      return res.json({
        error: "heights needs to be an array. Use GET for single height."
      })
    }

    // Enforce no more than 20 heights.
    if (heights.length > 20) {
      res.json({
        error: "Array too large. Max 20 heights"
      })
    }

    logger.debug(`Executing detailsByHeight with these heights: `, heights)

    // Loop through each height.
    const retArray = []
    for (let i = 0; i < heights.length; i++) {
      const thisHeight = heights[i] // Current height.

      // Reject if id is empty
      if (!thisHeight || thisHeight === "") {
        res.status(400)
        return res.json({ error: "height must not be empty" })
      }

      const {
        BitboxHTTP,
        username,
        password,
        requestConfig
      } = routeUtils.setEnvVars()

      requestConfig.data.id = "getblockhash"
      requestConfig.data.method = "getblockhash"
      requestConfig.data.params = [parseInt(thisHeight)]

      const response = await BitboxHTTP(requestConfig)

      const hash = response.data.result
      //console.log(`hash: ${hash}`)

      // Call detailsByHashSingle now that the hash has been retrieved.
      // req.params.hash = hash
      // return detailsByHashSingle(req, res, next)
      // console.log(response)

      const resp = await axios.get(
        `${process.env.BITCOINCOM_BASEURL}block/${hash}`
      )

      retArray.push(resp.data)
    }

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retArray)
  } catch (error) {
    // Write out error to error log.
    //logger.error(`Error in block/detailsByHash: `, error)

    if (error.response && error.response.status === 404) {
      res.status(404)
      return res.json({ error: "Not Found" })
    }

    res.status(500)
    return res.json({ error: util.inspect(error) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    detailsByHashSingle,
    detailsByHashBulk,
    detailsByHeightSingle,
    detailsByHeightBulk
  }
}
