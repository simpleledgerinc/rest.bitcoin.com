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

const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default
const BITBOX = new BITBOXCli()

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
  [dataRetrievalRateLimit1: string]: any
  dataRetrievalRateLimit2: any
  dataRetrievalRateLimit3: any
  dataRetrievalRateLimit4: any
  dataRetrievalRateLimit5: any
  dataRetrievalRateLimit6: any
  dataRetrievalRateLimit7: any
  dataRetrievalRateLimit8: any
  dataRetrievalRateLimit9: any
  dataRetrievalRateLimit10: any
  dataRetrievalRateLimit11: any
  dataRetrievalRateLimit12: any
  dataRetrievalRateLimit13: any
  dataRetrievalRateLimit14: any
  dataRetrievalRateLimit15: any
  dataRetrievalRateLimit16: any
  dataRetrievalRateLimit17: any
  dataRetrievalRateLimit18: any
  dataRetrievalRateLimit19: any
  dataRetrievalRateLimit20: any
}

const config: IRLConfig = {
  dataRetrievalRateLimit1: undefined,
  dataRetrievalRateLimit2: undefined,
  dataRetrievalRateLimit3: undefined,
  dataRetrievalRateLimit4: undefined,
  dataRetrievalRateLimit5: undefined,
  dataRetrievalRateLimit6: undefined,
  dataRetrievalRateLimit7: undefined,
  dataRetrievalRateLimit8: undefined,
  dataRetrievalRateLimit9: undefined,
  dataRetrievalRateLimit10: undefined,
  dataRetrievalRateLimit11: undefined,
  dataRetrievalRateLimit12: undefined,
  dataRetrievalRateLimit13: undefined,
  dataRetrievalRateLimit14: undefined,
  dataRetrievalRateLimit15: undefined,
  dataRetrievalRateLimit16: undefined,
  dataRetrievalRateLimit17: undefined,
  dataRetrievalRateLimit18: undefined,
  dataRetrievalRateLimit19: undefined,
  dataRetrievalRateLimit20: undefined
}

let i = 1
while (i < 21) {
  config[`dataRetrievalRateLimit${i}`] = new RateLimit({
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

// Create the routes and point to the route handler functions.
router.get("/", config.dataRetrievalRateLimit1, root)
router.get(
  "/balancesForAddress/:address",
  config.dataRetrievalRateLimit2,
  balancesForAddress
)
router.get(
  "/balancesForId/:propertyId",
  config.dataRetrievalRateLimit3,
  balancesForId
)
router.get(
  "/balance/:address/:propertyId",
  config.dataRetrievalRateLimit4,
  addressPropertyBalance
)
router.get(
  "/balancesHash/:propertyId",
  config.dataRetrievalRateLimit5,
  balancesHash
)
router.get("/crowdSale/:propertyId", config.dataRetrievalRateLimit6, crowdsale)
router.get(
  "/currentConsensusHash",
  config.dataRetrievalRateLimit7,
  getCurrentConsensusHash
)
router.get("/grants/:propertyId", config.dataRetrievalRateLimit8, grants)

router.get("/info", config.dataRetrievalRateLimit9, info)
router.get("/payload/:txid", config.dataRetrievalRateLimit10, payload)
router.get("/properties", config.dataRetrievalRateLimit11, properties)
router.get("/property/:propertyId", config.dataRetrievalRateLimit12, property)
router.get(
  "/seedBlocks/:startBlock/:endBlock",
  config.dataRetrievalRateLimit13,
  seedBlocks
)
router.get("/STO/:txid/:recipientFilter", config.dataRetrievalRateLimit14, sto)
router.get("/transaction/:txid", config.dataRetrievalRateLimit15, transaction)
router.get(
  "/blockTransactions/:index",
  config.dataRetrievalRateLimit16,
  blockTransactions
)
router.get(
  "/pendingTransactions",
  config.dataRetrievalRateLimit17,
  pendingTransactions
)
router.get(
  "/frozenBalance/:address/:propertyId",
  config.dataRetrievalRateLimit18,
  frozenBalance
)
router.get(
  "/frozenBalanceForAddress/:address",
  config.dataRetrievalRateLimit19,
  frozenBalanceForAddress
)
router.get(
  "/frozenBalanceForId/:propertyId",
  config.dataRetrievalRateLimit20,
  frozenBalanceForId
)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "dataRetrieval" })
}

// Returns a list of all token balances for a given address.
async function balancesForAddress(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    // Ensure the input is a valid BCH address.
    try {
      var legacyAddr = BITBOX.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid = routeUtils.validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getallbalancesforaddress"
    requestConfig.data.method = "whc_getallbalancesforaddress"
    requestConfig.data.params = [req.params.address]

    const response = await BitboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)

    // Catch corner-case specific to this route. 'Address not found' error message
    // actually means the address has no token balance.
    if (msg === "Address not found") return res.send("No tokens found.")

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

// Returns a list of token balances for a given property identifier.
async function balancesForId(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let propertyId = req.params.propertyId
    if (!propertyId || propertyId === "") {
      res.status(400)
      return res.json({ error: "propertyId can not be empty" })
    }
    propertyId = parseInt(propertyId)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getallbalancesforid"
    requestConfig.data.method = "whc_getallbalancesforid"
    requestConfig.data.params = [propertyId]

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

async function addressPropertyBalance(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let propertyId = req.params.propertyId
    if (!propertyId || propertyId === "") {
      res.status(400)
      return res.json({ error: "propertyId can not be empty" })
    }
    propertyId = parseInt(propertyId)

    const address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getbalance"
    requestConfig.data.method = "whc_getbalance"
    requestConfig.data.params = [address, propertyId]

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

async function balancesHash(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let propertyId = req.params.propertyId
    if (!propertyId || propertyId === "") {
      res.status(400)
      return res.json({ error: "propertyId can not be empty" })
    }
    propertyId = parseInt(propertyId)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getbalanceshash"
    requestConfig.data.method = "whc_getbalanceshash"
    requestConfig.data.params = [propertyId]

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

async function crowdsale(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let verbose = false
    if (req.query.verbose && req.query.verbose === "true") verbose = true

    let propertyId = req.params.propertyId
    if (!propertyId || propertyId === "") {
      res.status(400)
      return res.json({ error: "propertyId can not be empty" })
    }
    propertyId = parseInt(propertyId)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getcrowdsale"
    requestConfig.data.method = "whc_getcrowdsale"
    requestConfig.data.params = [propertyId, verbose]

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

async function getCurrentConsensusHash(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getcurrentconsensushash"
    requestConfig.data.method = "whc_getcurrentconsensushash"
    requestConfig.data.params = []

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

async function grants(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let propertyId = req.params.propertyId
    if (!propertyId || propertyId === "") {
      res.status(400)
      return res.json({ error: "propertyId can not be empty" })
    }
    propertyId = parseInt(propertyId)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getgrants"
    requestConfig.data.method = "whc_getgrants"
    requestConfig.data.params = [propertyId]

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

async function info(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getinfo"
    requestConfig.data.method = "whc_getinfo"
    requestConfig.data.params = []

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

async function payload(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const txid = req.params.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getpayload"
    requestConfig.data.method = "whc_getpayload"
    requestConfig.data.params = [txid]

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

async function property(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let propertyid = req.params.propertyId
    if (!propertyid || propertyid === "") {
      res.status(400)
      return res.json({ error: "propertyId can not be empty" })
    }
    propertyid = parseInt(propertyid)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getproperty"
    requestConfig.data.method = "whc_getproperty"
    requestConfig.data.params = [propertyid]

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

// Returns a list of blocks containing Omni transactions for use in seed block filtering.
// Does this even work?
async function seedBlocks(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let startBlock = req.params.startBlock
    if (!startBlock || startBlock === "") {
      res.status(400)
      return res.json({ error: "startBlock can not be empty" })
    }
    startBlock = parseInt(startBlock)

    let endBlock = req.params.endBlock
    if (!endBlock || endBlock === "") {
      res.status(400)
      return res.json({ error: "endBlock can not be empty" })
    }
    endBlock = parseInt(endBlock)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getseedblocks"
    requestConfig.data.method = "whc_getseedblocks"
    requestConfig.data.params = [startBlock, endBlock]

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

// Get information and recipients of a send-to-owners transaction.
async function sto(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const txid = req.params.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    let recipientFilter = req.params.recipientFilter
    if (!recipientFilter || recipientFilter === "") {
      recipientFilter = "*"
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getsto"
    requestConfig.data.method = "whc_getsto"
    requestConfig.data.params = [txid, recipientFilter]

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

async function transaction(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const txid = req.params.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_gettransaction"
    requestConfig.data.method = "whc_gettransaction"
    requestConfig.data.params = [txid]

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

async function blockTransactions(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let index = req.params.index
    if (!index || index === "") {
      res.status(400)
      return res.json({ error: "index can not be empty" })
    }
    index = parseInt(index)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_listblocktransactions"
    requestConfig.data.method = "whc_listblocktransactions"
    requestConfig.data.params = [index]

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

async function pendingTransactions(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    // Ensure the input is a valid BCH address.
    try {
      var legacyAddr = BITBOX.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid = routeUtils.validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_listpendingtransactions"
    requestConfig.data.method = "whc_listpendingtransactions"
    requestConfig.data.params = [address]

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

// Get a list of all tokens that have been created.
async function properties(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_listproperties"
    requestConfig.data.method = "whc_listproperties"
    requestConfig.data.params = []

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
    return res.json({ error: `Error in /change: ${err.message}` })
  }
}

// Returns the frozen token balance for a given address and property.
async function frozenBalance(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    let propertyId = req.params.propertyId
    if (!propertyId || propertyId === "") {
      res.status(400)
      return res.json({ error: "propertyId can not be empty" })
    }
    propertyId = parseInt(propertyId)

    // Ensure the input is a valid BCH address.
    try {
      var legacyAddr = BITBOX.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid = routeUtils.validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getfrozenbalance"
    requestConfig.data.method = "whc_getfrozenbalance"
    requestConfig.data.params = [address, propertyId]

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

async function frozenBalanceForAddress(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    // Ensure the input is a valid BCH address.
    try {
      var legacyAddr = BITBOX.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid = routeUtils.validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getfrozenbalanceforaddress"
    requestConfig.data.method = "whc_getfrozenbalanceforaddress"
    requestConfig.data.params = [address]

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

async function frozenBalanceForId(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let propertyId = req.params.propertyId
    if (!propertyId || propertyId === "") {
      res.status(400)
      return res.json({ error: "propertyId can not be empty" })
    }
    propertyId = parseInt(propertyId)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_getfrozenbalanceforid"
    requestConfig.data.method = "whc_getfrozenbalanceforid"
    requestConfig.data.params = [propertyId]

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
    balancesForAddress,
    balancesForId,
    addressPropertyBalance,
    balancesHash,
    crowdsale,
    getCurrentConsensusHash,
    grants,
    info,
    payload,
    properties,
    property,
    seedBlocks,
    sto,
    transaction,
    blockTransactions,
    pendingTransactions,
    frozenBalance,
    frozenBalanceForAddress,
    frozenBalanceForId
  }
}
