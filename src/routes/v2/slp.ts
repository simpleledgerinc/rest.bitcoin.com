"use strict"

import * as express from "express"
const router = express.Router()
import axios from "axios"
import { IRequestConfig } from "./interfaces/IRequestConfig"
const RateLimit = require("express-rate-limit")
const routeUtils = require("./route-utils")
const logger = require("./logging.js")

const bitboxproxy = require("slpjs").bitbox
const utils = require("slpjs").utils
const slpBalances = require("slp-balances")
// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 5 }

const BitboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})
const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default
const BITBOX = new BITBOXCli()

const SLPsdk = require("slp-sdk/lib/SLP").default
const SLP = new SLPsdk()

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
  [slpRateLimit1: string]: any
  slpRateLimit2: any
  slpRateLimit3: any
  slpRateLimit4: any
  slpRateLimit5: any
  slpRateLimit6: any
  slpRateLimit7: any
}

const config: IRLConfig = {
  slpRateLimit1: undefined,
  slpRateLimit2: undefined,
  slpRateLimit3: undefined,
  slpRateLimit4: undefined,
  slpRateLimit5: undefined,
  slpRateLimit6: undefined,
  slpRateLimit7: undefined
}

let i = 1
while (i < 8) {
  config[`slpRateLimit${i}`] = new RateLimit({
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

router.get("/", config.slpRateLimit1, root)
router.get("/list", config.slpRateLimit2, list)
router.get("/list/:tokenId", config.slpRateLimit3, listSingleToken)
router.get(
  "/balancesForAddress/:address",
  config.slpRateLimit4,
  balancesForAddress
)
router.get(
  "/balance/:address/:tokenId",
  config.slpRateLimit5,
  balancesForAddressByTokenID
)
router.get("/address/convert/:address", config.slpRateLimit6, convertAddress)
router.post("/validate", config.slpRateLimit7, validateBulk)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "slp" })
}

async function list(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const query = {
      v: 3,
      q: {
        find: { "out.h1": "534c5000", "out.s3": "GENESIS" },
        limit: 1000
      },
      r: {
        f:
          '[ .[] | { id: .tx.h, timestamp: (.blk.t | strftime("%Y-%m-%d %H:%M")), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6 } ]'
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.BITDB_URL}q/${b64}`

    // Get data from BitDB.
    const tokenRes = await axios.get(url)

    // Parse data.
    const tokens = tokenRes.data.c
    if (tokenRes.data.u && tokenRes.data.u.length)
      tokens.concat(tokenRes.data.u)
    res.json(tokens.reverse())

    return tokens
  } catch (err) {
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({ error: `Error in /list: ${err.message}` })
  }
}

async function listSingleToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let tokenId = req.params.tokenId
    if (!tokenId || tokenId === "") {
      res.status(400)
      return res.json({ error: "tokenId can not be empty" })
    }
    const query = {
      v: 3,
      q: {
        find: { "out.h1": "534c5000", "out.s3": "GENESIS" },
        limit: 1000
      },
      r: {
        f:
          '[ .[] | { id: .tx.h, timestamp: (.blk.t | strftime("%Y-%m-%d %H:%M")), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6 } ]'
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.BITDB_URL}q/${b64}`

    const tokenRes = await axios.get(url)
    const tokens = tokenRes.data.c
    if (tokenRes.data.u && tokenRes.data.u.length)
      tokens.concat(tokenRes.data.u)

    let t
    tokens.forEach((token: any) => {
      if (token.id === req.params.tokenId) t = token
    })
    return res.json(t)
  } catch (err) {
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({ error: `Error in /list/:tokenId: ${err.message}` })
  }
}

// TODO - Only works for mainnet. Get it to work for testnet too.
async function balancesForAddress(
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
      var legacyAddr = SLP.Utils.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    let cashAddr = SLP.Utils.toCashAddress(address)
    const networkIsValid = routeUtils.validateNetwork(cashAddr)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    const slpAddr = utils.toSlpAddress(req.params.address)
    const balances = await bitboxproxy.getAllTokenBalances(slpAddr)
    balances.slpAddress = slpAddr
    balances.cashAddress = utils.toCashAddress(slpAddr)
    balances.legacyAddress = BITBOX.Address.toLegacyAddress(
      balances.cashAddress
    )
    return res.json(balances)
  } catch (err) {
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({
      error: `Error in /balancesForAddress/:address: ${err.message}`
    })
  }
}

// TODO - Only works for mainnet. Get it to work for testnet too.
async function balancesForAddressByTokenID(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let address = req.params.address
    let tokenId = req.params.tokenId
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    if (!tokenId || tokenId === "") {
      res.status(400)
      return res.json({ error: "tokenId can not be empty" })
    }

    // Ensure the input is a valid BCH address.
    try {
      var legacyAddr = SLP.Utils.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    let cashAddr = SLP.Utils.toCashAddress(address)
    const networkIsValid = routeUtils.validateNetwork(cashAddr)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    const slpAddr = utils.toSlpAddress(address)
    const balances = await bitboxproxy.getAllTokenBalances(slpAddr)
    const query = {
      v: 3,
      q: {
        find: { "out.h1": "534c5000", "out.s3": "GENESIS" },
        limit: 1000
      },
      r: {
        f:
          '[ .[] | { id: .tx.h, timestamp: (.blk.t | strftime("%Y-%m-%d %H:%M")), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6 } ]'
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.BITDB_URL}q/${b64}`

    const tokenRes = await axios.get(url)
    const tokens = tokenRes.data.c
    if (tokenRes.data.u && tokenRes.data.u.length)
      tokens.concat(tokenRes.data.u)

    let t: any
    tokens.forEach((token: any) => {
      if (token.id === req.params.tokenId) t = token
    })

    interface ReturnObj {
      [id: string]: any
      timestamp: any
      symbol: any
      name: any
      document: any
      balance: any
      slpAddress: any
      cashAddress: any
      legacyAddress: any
    }
    const obj: ReturnObj = {
      id: undefined,
      timestamp: undefined,
      symbol: undefined,
      name: undefined,
      document: undefined,
      balance: undefined,
      slpAddress: undefined,
      cashAddress: undefined,
      legacyAddress: undefined
    }

    obj.id = t.id
    obj.timestamp = t.timestamp
    obj.symbol = t.symbol
    obj.name = t.name
    obj.document = t.document
    obj.balance = balances[req.params.tokenId]
    obj.slpAddress = slpAddr
    obj.cashAddress = utils.toCashAddress(slpAddr)
    obj.legacyAddress = BITBOX.Address.toLegacyAddress(obj.cashAddress)
    return res.json(obj)
  } catch (err) {
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({
      error: `Error in /balance/:address/:tokenId: ${err.message}`
    })
  }
}

async function convertAddress(
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
    const slpAddr = utils.toSlpAddress(req.params.address)
    const obj: {
      [slpAddress: string]: any
      cashAddress: any
      legacyAddress: any
    } = {
      slpAddress: "",
      cashAddress: "",
      legacyAddress: ""
    }
    obj.slpAddress = slpAddr
    obj.cashAddress = utils.toCashAddress(slpAddr)
    obj.legacyAddress = BITBOX.Address.toLegacyAddress(obj.cashAddress)
    return res.json(obj)
  } catch (err) {
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({
      error: `Error in /address/convert/:address: ${err.message}`
    })
  }
}

async function validateBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const txids = req.body.txids

    // Reject if address is not an array.
    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({ error: "txids needs to be an array" })
    }

    // Enforce no more than 20 txids.
    if (txids.length > 20) {
      res.status(400)
      return res.json({
        error: "Array too large. Max 20 txids"
      })
    }

    logger.debug(`Executing slp/validate with these txids: `, txids)

    // Validate each txid
    const validatePromises = txids.map(async txid => {
      const isValid = await isValidSlpTxid(txid)
      return isValid ? txid : false
    })

    // Filter array to only valid txid results
    const validateResults = await axios.all(validatePromises)
    const validTxids = validateResults.filter(result => result)

    res.status(200)
    return res.json(validTxids)
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

async function isValidSlpTxid(txid: string): Promise<boolean> {
  let result
  try {
    result = await validateTx(txid, process.env.SLP_VALIDATE_URL)
  } catch (err) {
    result = await validateTx(txid, process.env.SLP_VALIDATE_FAILOVER_URL)
  }

  if (result === true) {
    return true
  } else {
    return false
  }
}

async function validateTx(txid: string, network: string): Promise<boolean> {
  try {
    let isValid = await SLP.Utils.validateTxid(
      txid,
      network
    );
    res.json(isValid: isValid)
    return isValid
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    list,
    listSingleToken,
    balancesForAddress,
    balancesForAddressByTokenID,
    convertAddress,
    validateBulk
  }
}
