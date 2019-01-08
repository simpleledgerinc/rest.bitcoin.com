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

const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default
const BITBOX = new BITBOXCli()

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
  slpRateLimit8: any
  slpRateLimit9: any
  slpRateLimit10: any
  slpRateLimit11: any
  slpRateLimit12: any
  slpRateLimit13: any
  slpRateLimit14: any
  slpRateLimit15: any
}

const config: IRLConfig = {
  slpRateLimit1: undefined,
  slpRateLimit2: undefined,
  slpRateLimit3: undefined,
  slpRateLimit4: undefined,
  slpRateLimit5: undefined,
  slpRateLimit6: undefined,
  slpRateLimit7: undefined,
  slpRateLimit8: undefined,
  slpRateLimit9: undefined,
  slpRateLimit10: undefined,
  slpRateLimit11: undefined,
  slpRateLimit12: undefined,
  slpRateLimit13: undefined,
  slpRateLimit14: undefined,
  slpRateLimit15: undefined
}

let i = 1
while (i < 16) {
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

    const tokenRes = await axios.get(url)
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
    return res.json({ error: `Error in /properties: ${err.message}` })
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
    return t
  } catch (err) {
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({ error: `Error in /properties: ${err.message}` })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    list,
    listSingleToken
  }
}
