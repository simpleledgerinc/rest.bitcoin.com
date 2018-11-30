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
  [payloadCreationRateLimit1: string]: any
  payloadCreationRateLimit2: any
  payloadCreationRateLimit3: any
  payloadCreationRateLimit4: any
  payloadCreationRateLimit5: any
  payloadCreationRateLimit6: any
  payloadCreationRateLimit7: any
  payloadCreationRateLimit8: any
  payloadCreationRateLimit9: any
  payloadCreationRateLimit10: any
  payloadCreationRateLimit11: any
  payloadCreationRateLimit12: any
  payloadCreationRateLimit13: any
  payloadCreationRateLimit14: any
  payloadCreationRateLimit15: any
}

const config: IRLConfig = {
  payloadCreationRateLimit1: undefined,
  payloadCreationRateLimit2: undefined,
  payloadCreationRateLimit3: undefined,
  payloadCreationRateLimit4: undefined,
  payloadCreationRateLimit5: undefined,
  payloadCreationRateLimit6: undefined,
  payloadCreationRateLimit7: undefined,
  payloadCreationRateLimit8: undefined,
  payloadCreationRateLimit9: undefined,
  payloadCreationRateLimit10: undefined,
  payloadCreationRateLimit11: undefined,
  payloadCreationRateLimit12: undefined,
  payloadCreationRateLimit13: undefined,
  payloadCreationRateLimit14: undefined,
  payloadCreationRateLimit15: undefined
}

let i = 1
while (i < 16) {
  config[`payloadCreationRateLimit${i}`] = new RateLimit({
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

router.get("/", config.payloadCreationRateLimit1, root)
router.get("/burnBCH", config.payloadCreationRateLimit2, burnBCH)
router.post(
  "/changeIssuer/:propertyId",
  config.payloadCreationRateLimit2,
  changeIssuer
)
router.post(
  "/closeCrowdSale/:propertyId",
  config.payloadCreationRateLimit3,
  closeCrowdSale
)
router.post(
  "/grant/:propertyId/:amount",
  config.payloadCreationRateLimit4,
  grant
)
router.post(
  "/crowdsale/:ecosystem/:propertyPrecision/:previousId/:category/:subcategory/:name/:url/:data/:propertyIdDesired/:tokensPerUnit/:deadline/:earlyBonus/:undefine/:totalNumber",
  config.payloadCreationRateLimit6,
  crowdsale
)
router.post(
  "/fixed/:ecosystem/:propertyPrecision/:previousId/:category/:subcategory/:name/:url/:data/:amount",
  config.payloadCreationRateLimit7,
  fixed
)
router.post(
  "/managed/:ecosystem/:propertyPrecision/:previousId/:category/:subcategory/:name/:url/:data",
  config.payloadCreationRateLimit8,
  managed
)
router.post(
  "/participateCrowdSale/:amount",
  config.payloadCreationRateLimit9,
  participateCrowdSale
)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "payloadCreation" })
}

async function burnBCH(
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

    requestConfig.data.id = "whc_createpayload_burnbch"
    requestConfig.data.method = "whc_createpayload_burnbch"
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

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function changeIssuer(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validate input parameter
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

    requestConfig.data.id = "whc_createpayload_changeissuer"
    requestConfig.data.method = "whc_createpayload_changeissuer"
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

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function closeCrowdSale(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validate input parameter
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

    requestConfig.data.id = "whc_createpayload_closecrowdsale"
    requestConfig.data.method = "whc_createpayload_closecrowdsale"
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

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function grant(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validate input parameter
    let propertyId = req.params.propertyId
    if (!propertyId || propertyId === "") {
      res.status(400)
      return res.json({ error: "propertyId can not be empty" })
    }
    propertyId = parseInt(propertyId)

    // Validate input parameter
    let amount = req.params.amount
    if (!amount || amount === "") {
      res.status(400)
      return res.json({ error: "amount can not be empty" })
    }

    const params = [propertyId, amount]

    if (req.query.memo) params.push(req.query.memo)

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_createpayload_grant"
    requestConfig.data.method = "whc_createpayload_grant"
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

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)

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
    // "/crowdsale/:ecosystem/:propertyPrecision/:previousId/:category/:subcategory/:name/:url/:data/:propertyIdDesired/:tokensPerUnit/:deadline/:earlyBonus/:undefine/:totalNumber",

    // Validate input parameter
    let ecosystem = req.params.ecosystem
    if (!ecosystem || ecosystem === "") {
      res.status(400)
      return res.json({ error: "ecosystem can not be empty" })
    }
    ecosystem = parseInt(ecosystem)

    let propertyPrecision = req.params.propertyPrecision
    if (propertyPrecision === undefined || propertyPrecision === "") {
      res.status(400)
      return res.json({ error: "propertyPrecision can not be empty" })
    }
    propertyPrecision = parseInt(propertyPrecision)

    let previousId = req.params.previousId
    if (previousId === undefined || previousId === "") {
      res.status(400)
      return res.json({ error: "previousId can not be empty" })
    }
    previousId = parseInt(previousId)

    const category = req.params.category
    if (!category || category === "") {
      res.status(400)
      return res.json({ error: "category can not be empty" })
    }

    const subcategory = req.params.subcategory
    if (!subcategory || subcategory === "") {
      res.status(400)
      return res.json({ error: "subcategory can not be empty" })
    }

    const name = req.params.name
    if (!name || name === "") {
      res.status(400)
      return res.json({ error: "name can not be empty" })
    }

    const url = req.params.url
    if (!url || url === "") {
      res.status(400)
      return res.json({ error: "url can not be empty" })
    }

    const data = req.params.data
    if (!data || data === "") {
      res.status(400)
      return res.json({ error: "data can not be empty" })
    }

    let propertyIdDesired = req.params.propertyIdDesired
    if (!propertyIdDesired || propertyIdDesired === "") {
      res.status(400)
      return res.json({ error: "propertyIdDesired can not be empty" })
    }
    propertyIdDesired = parseInt(propertyIdDesired)

    let tokensPerUnit = req.params.tokensPerUnit
    if (!tokensPerUnit || tokensPerUnit === "") {
      res.status(400)
      return res.json({ error: "tokensPerUnit can not be empty" })
    }
    tokensPerUnit = tokensPerUnit.toString()

    let deadline = req.params.deadline
    if (!deadline || deadline === "") {
      res.status(400)
      return res.json({ error: "deadline can not be empty" })
    }
    deadline = parseInt(deadline)

    let earlyBonus = req.params.earlyBonus
    if (earlyBonus === undefined || earlyBonus === "") {
      res.status(400)
      return res.json({ error: "earlyBonus can not be empty" })
    }
    earlyBonus = parseInt(earlyBonus)

    let undefine = req.params.undefine
    if (undefine === undefined || undefine === "") {
      res.status(400)
      return res.json({ error: "undefine can not be empty" })
    }
    undefine = parseInt(undefine)

    let totalNumber = req.params.totalNumber
    if (!totalNumber || totalNumber === "") {
      res.status(400)
      return res.json({ error: "totalNumber can not be empty" })
    }
    totalNumber = totalNumber.toString()

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_createpayload_issuancecrowdsale"
    requestConfig.data.method = "whc_createpayload_issuancecrowdsale"
    requestConfig.data.params = [
      ecosystem,
      propertyPrecision,
      previousId,
      category,
      subcategory,
      name,
      url,
      data,
      propertyIdDesired,
      tokensPerUnit,
      deadline,
      earlyBonus,
      undefine,
      totalNumber
    ]

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

async function fixed(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validate input parameter
    let ecosystem = req.params.ecosystem
    if (!ecosystem || ecosystem === "") {
      res.status(400)
      return res.json({ error: "ecosystem can not be empty" })
    }
    ecosystem = parseInt(ecosystem)

    let propertyPrecision = req.params.propertyPrecision
    if (!propertyPrecision || propertyPrecision === "") {
      res.status(400)
      return res.json({ error: "propertyPrecision can not be empty" })
    }
    propertyPrecision = parseInt(propertyPrecision)

    let previousId = req.params.previousId
    if (previousId === undefined || previousId === "") {
      res.status(400)
      return res.json({ error: "previousId can not be empty" })
    }
    previousId = parseInt(previousId)

    const category = req.params.category
    if (!category || category === "") {
      res.status(400)
      return res.json({ error: "category can not be empty" })
    }

    const subcategory = req.params.subcategory
    if (!subcategory || subcategory === "") {
      res.status(400)
      return res.json({ error: "subcategory can not be empty" })
    }

    const name = req.params.name
    if (!name || name === "") {
      res.status(400)
      return res.json({ error: "name can not be empty" })
    }

    const url = req.params.url
    if (!url || url === "") {
      res.status(400)
      return res.json({ error: "url can not be empty" })
    }

    const data = req.params.data
    if (!data || data === "") {
      res.status(400)
      return res.json({ error: "data can not be empty" })
    }

    let amount = req.params.amount
    if (!amount || amount === "") {
      res.status(400)
      return res.json({ error: "amount can not be empty" })
    }
    amount = amount.toString()

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_createpayload_issuancefixed"
    requestConfig.data.method = "whc_createpayload_issuancefixed"
    requestConfig.data.params = [
      ecosystem,
      propertyPrecision,
      previousId,
      category,
      subcategory,
      name,
      url,
      data,
      amount
    ]

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

async function managed(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validate input parameter
    let ecosystem = req.params.ecosystem
    if (!ecosystem || ecosystem === "") {
      res.status(400)
      return res.json({ error: "ecosystem can not be empty" })
    }
    ecosystem = parseInt(ecosystem)

    let propertyPrecision = req.params.propertyPrecision
    if (!propertyPrecision || propertyPrecision === "") {
      res.status(400)
      return res.json({ error: "propertyPrecision can not be empty" })
    }
    propertyPrecision = parseInt(propertyPrecision)

    let previousId = req.params.previousId
    if (previousId === undefined || previousId === "") {
      res.status(400)
      return res.json({ error: "previousId can not be empty" })
    }
    previousId = parseInt(previousId)

    const category = req.params.category
    if (!category || category === "") {
      res.status(400)
      return res.json({ error: "category can not be empty" })
    }

    const subcategory = req.params.subcategory
    if (!subcategory || subcategory === "") {
      res.status(400)
      return res.json({ error: "subcategory can not be empty" })
    }

    const name = req.params.name
    if (!name || name === "") {
      res.status(400)
      return res.json({ error: "name can not be empty" })
    }

    const url = req.params.url
    if (!url || url === "") {
      res.status(400)
      return res.json({ error: "url can not be empty" })
    }

    const data = req.params.data
    if (!data || data === "") {
      res.status(400)
      return res.json({ error: "data can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_createpayload_issuancemanaged"
    requestConfig.data.method = "whc_createpayload_issuancemanaged"
    requestConfig.data.params = [
      ecosystem,
      propertyPrecision,
      previousId,
      category,
      subcategory,
      name,
      url,
      data
    ]

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

async function participateCrowdSale(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let amount = req.params.amount
    if (!amount || amount === "") {
      res.status(400)
      return res.json({ error: "amount can not be empty" })
    }
    amount = amount.toString()

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "whc_createpayload_particrowdsale"
    requestConfig.data.method = "whc_createpayload_particrowdsale"
    requestConfig.data.params = [amount]

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

router.post(
  "/revoke/:propertyId/:amount",
  config.payloadCreationRateLimit10,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const params = [parseInt(req.params.propertyId), req.params.amount]
    if (req.query.memo) params.push(req.query.memo)

    requestConfig.data.id = "whc_createpayload_revoke"
    requestConfig.data.method = "whc_createpayload_revoke"
    requestConfig.data.params = params

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.post(
  "/sendAll/:ecosystem",
  config.payloadCreationRateLimit11,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    requestConfig.data.id = "whc_createpayload_sendall"
    requestConfig.data.method = "whc_createpayload_sendall"
    requestConfig.data.params = [parseInt(req.params.ecosystem)]

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.post(
  "/simpleSend/:propertyId/:amount",
  config.payloadCreationRateLimit12,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    requestConfig.data.id = "whc_createpayload_simplesend"
    requestConfig.data.method = "whc_createpayload_simplesend"
    requestConfig.data.params = [
      parseInt(req.params.propertyId),
      req.params.amount
    ]

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.post(
  "/STO/:propertyId/:amount",
  config.payloadCreationRateLimit13,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const params = [parseInt(req.params.propertyId), req.params.amount]
    if (req.query.distributionProperty)
      params.push(parseInt(req.query.distributionProperty))

    requestConfig.data.id = "whc_createpayload_sto"
    requestConfig.data.method = "whc_createpayload_sto"
    requestConfig.data.params = params

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.post(
  "/freeze/:toAddress/:propertyId",
  config.payloadCreationRateLimit14,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const params = [
      BITBOX.Address.toCashAddress(req.params.toAddress),
      parseInt(req.params.propertyId),
      "100"
    ]

    requestConfig.data.id = "whc_createpayload_freeze"
    requestConfig.data.method = "whc_createpayload_freeze"
    requestConfig.data.params = params

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.post(
  "/unfreeze/:toAddress/:propertyId",
  config.payloadCreationRateLimit15,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const params = [
      BITBOX.Address.toCashAddress(req.params.toAddress),
      parseInt(req.params.propertyId),
      "100"
    ]

    requestConfig.data.id = "whc_createpayload_unfreeze"
    requestConfig.data.method = "whc_createpayload_unfreeze"
    requestConfig.data.params = params

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

module.exports = {
  router,
  testableComponents: {
    root,
    burnBCH,
    changeIssuer,
    closeCrowdSale,
    grant,
    crowdsale,
    fixed,
    managed,
    participateCrowdSale
  }
}
