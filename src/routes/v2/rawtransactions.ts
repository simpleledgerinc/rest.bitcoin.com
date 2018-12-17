"use strict"

import * as express from "express"
const router = express.Router()
import axios from "axios"
import { IRequestConfig } from "./interfaces/IRequestConfig"
const RateLimit = require("express-rate-limit")
const routeUtils = require("./route-utils")
const logger = require("./logging.js")

// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const BitboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})
const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

const requestConfig: IRequestConfig = {
  method: "post",
  auth: {
    username: username,
    password: password
  },
  data: {
    jsonrpc: "1.0"
  }
}

interface IRLConfig {
  [rawTransactionsRateLimit1: string]: any
  rawTransactionsRateLimit2: any
  rawTransactionsRateLimit3: any
  rawTransactionsRateLimit4: any
  rawTransactionsRateLimit5: any
  rawTransactionsRateLimit6: any
  rawTransactionsRateLimit7: any
  rawTransactionsRateLimit8: any
  rawTransactionsRateLimit9: any
  rawTransactionsRateLimit10: any
  rawTransactionsRateLimit11: any
}

const config: IRLConfig = {
  rawTransactionsRateLimit1: undefined,
  rawTransactionsRateLimit2: undefined,
  rawTransactionsRateLimit3: undefined,
  rawTransactionsRateLimit4: undefined,
  rawTransactionsRateLimit5: undefined,
  rawTransactionsRateLimit6: undefined,
  rawTransactionsRateLimit7: undefined,
  rawTransactionsRateLimit8: undefined,
  rawTransactionsRateLimit9: undefined,
  rawTransactionsRateLimit10: undefined,
  rawTransactionsRateLimit11: undefined
}

let i = 1

while (i < 12) {
  config[`rawTransactionsRateLimit${i}`] = new RateLimit({
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

router.get("/", config.rawTransactionsRateLimit1, root)
router.get(
  "/decodeRawTransaction/:hex",
  config.rawTransactionsRateLimit2,
  decodeRawTransaction
)
router.get("/decodeScript/:hex", config.rawTransactionsRateLimit3, decodeScript)
router.get(
  "/getRawTransaction/:txid",
  config.rawTransactionsRateLimit4,
  getRawTransaction
)
router.post(
  "/sendRawTransaction/:hex",
  config.rawTransactionsRateLimit5,
  sendRawTransaction
)
router.put("/change", config.rawTransactionsRateLimit6, whChangeOutput)
router.put("/input", config.rawTransactionsRateLimit7, whInput)
router.put("/opreturn", config.rawTransactionsRateLimit8, whOpReturn)
router.put("/reference", config.rawTransactionsRateLimit9, whReference)
router.get(
  "/decodeTransaction/:rawtx",
  config.rawTransactionsRateLimit10,
  whDecodeTx
)
router.put("/create", config.rawTransactionsRateLimit11, whCreateTx)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "rawtransactions" })
}

// Decode transaction hex into a JSON object.
// GET
async function decodeRawTransaction(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const hex = req.params.hex

    // Throw an error if hex is empty.
    if (!hex || hex === "") {
      res.status(400)
      return res.json({ error: "hex can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "decoderawtransaction"
    requestConfig.data.method = "decoderawtransaction"
    requestConfig.data.params = [hex]

    const response = await BitboxHTTP(requestConfig)
    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Decode a raw transaction from hex to assembly.
// GET
async function decodeScript(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const hex = req.params.hex

    // Throw an error if hex is empty.
    if (!hex || hex === "") {
      res.status(400)
      return res.json({ error: "hex can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "decodescript"
    requestConfig.data.method = "decodescript"
    requestConfig.data.params = [hex]

    const response = await BitboxHTTP(requestConfig)
    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeScript: `, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Get a JSON object breakdown of transaction details.
// POST
async function getRawTransaction(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let verbose = 0
    if (req.body.verbose) verbose = 1

    const txids = req.body.txids
    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({ error: "txids must be an array" })
    }
    if (txids.length > 20) {
      res.status(400)
      return res.json({ error: "Array too large. Max 20 txids" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getrawtransaction"
    requestConfig.data.method = "getrawtransaction"

    const results = []

    // Loop through each txid in the array
    for (let i = 0; i < txids.length; i++) {
      const txid = txids[i]

      if (!txid || txid === "") {
        res.status(400)
        return res.json({ error: "Encountered empty TXID" })
      }

      requestConfig.data.params = [txid, verbose]

      const response = await BitboxHTTP(requestConfig)
      results.push(response.data.result)
    }

    return res.json(results)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/getRawTransaction: `, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Transmit a raw transaction to the BCH network.
async function sendRawTransaction(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validation
    const hexs = req.body.hex
    if (!Array.isArray(hexs)) {
      res.status(400)
      return res.json({ error: "hex must be an array" })
    }
    if (hexs.length > 20) {
      res.status(400)
      return res.json({ error: "Array too large. Max 20 entries" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "sendrawtransaction"
    requestConfig.data.method = "sendrawtransaction"

    const results = []

    // Loop through each hex in the array
    for (let i = 0; i < hexs.length; i++) {
      const hex = hexs[i]

      if (!hex || hex === "") {
        res.status(400)
        return res.json({ error: "Encountered empty hex" })
      }

      requestConfig.data.params = [hex]

      const response = await BitboxHTTP(requestConfig)
      results.push(response.data.result)
    }

    return res.json(results)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// WH add change output to the transaction.
async function whChangeOutput(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // TODO: What kind of validations should go here?

    const rawTx = req.body.rawtx
    if (!rawTx || rawTx === "") {
      res.status(400)
      return res.json({ error: "rawtx can not be empty" })
    }

    const prevTxs = req.body.prevtxs
    if (!prevTxs || prevTxs === "") {
      res.status(400)
      return res.json({ error: "prevtxs can not be empty" })
    }

    const destination = req.body.destination
    if (!destination || destination === "") {
      res.status(400)
      return res.json({ error: "destination can not be empty" })
    }

    let fee = req.body.fee
    if (!fee || fee === "") {
      res.status(400)
      return res.json({ error: "fee can not be empty" })
    }
    fee = parseFloat(fee)

    const params = [rawTx, prevTxs, destination, fee]
    if (req.body.position) params.push(parseInt(req.body.position))

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_createrawtx_change"
    requestConfig.data.method = "whc_createrawtx_change"
    requestConfig.data.params = params

    const response = await BitboxHTTP(requestConfig)
    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Add a transaction input
async function whInput(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const rawtx = req.body.rawtx

    const txid = req.body.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    let n = req.body.n
    if (n === undefined || n === "") {
      res.status(400)
      return res.json({ error: "n can not be empty" })
    }
    n = parseInt(n)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_createrawtx_input"
    requestConfig.data.method = "whc_createrawtx_input"
    requestConfig.data.params = [rawtx, txid, n]

    const response = await BitboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Add an op-return to the transaction.
async function whOpReturn(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const rawtx = req.body.rawtx
    if (!rawtx || rawtx === "") {
      res.status(400)
      return res.json({ error: "rawtx can not be empty" })
    }

    const payload = req.body.payload
    if (!payload || payload === "") {
      res.status(400)
      return res.json({ error: "payload can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_createrawtx_opreturn"
    requestConfig.data.method = "whc_createrawtx_opreturn"
    requestConfig.data.params = [rawtx, payload]

    const response = await BitboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function whReference(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const rawtx = req.body.rawtx
    if (!rawtx || rawtx === "") {
      res.status(400)
      return res.json({ error: "rawtx can not be empty" })
    }

    const destination = req.body.destination
    if (!destination || destination === "") {
      res.status(400)
      return res.json({ error: "destination can not be empty" })
    }

    const params = [rawtx, destination]
    if (req.body.amount) params.push(req.body.amount)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_createrawtx_reference"
    requestConfig.data.method = "whc_createrawtx_reference"
    requestConfig.data.params = params

    const response = await BitboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Decode the raw hex of a WH transaction.
async function whDecodeTx(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const rawtx = req.params.rawtx
    if (!rawtx || rawtx === "") {
      res.status(400)
      return res.json({ error: "rawtx can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    const params = [rawtx]

    if (req.query.prevTxs) params.push(JSON.parse(req.query.prevTxs))

    if (req.query.height) params.push(req.query.height)

    requestConfig.data.id = "whc_decodetransaction"
    requestConfig.data.method = "whc_decodetransaction"
    requestConfig.data.params = params

    const response = await BitboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Return the error message from the node, if it exists.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Create a transaction spending the given inputs and creating new outputs.
async function whCreateTx(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validate input parameters
    let inputs = req.body.inputs
    if (!inputs || inputs === "") {
      res.status(400)
      return res.json({ error: "inputs can not be empty" })
    }

    let outputs = req.body.outputs
    if (!outputs || outputs === "") {
      res.status(400)
      return res.json({ error: "outputs can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    const params = [inputs, outputs]
    if (req.body.locktime) params.push(req.body.locktime)

    requestConfig.data.id = "createrawtransaction"
    requestConfig.data.method = "createrawtransaction"
    requestConfig.data.params = params

    const response = await BitboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    decodeRawTransaction,
    decodeScript,
    getRawTransaction,
    sendRawTransaction,
    whChangeOutput,
    whInput,
    whOpReturn,
    whReference,
    whDecodeTx,
    whCreateTx
  }
}
