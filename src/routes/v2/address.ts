"use strict"

import * as express from "express"
import * as requestUtils from "./services/requestUtils"
import { IResponse } from "./interfaces/IResponse"
import axios from "axios"
const logger = require("./logging.js")
const routeUtils = require("./route-utils")

//const router = express.Router()
const router: express.Router = express.Router()
const RateLimit = require("express-rate-limit")

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default
const BITBOX = new BITBOXCli()

const FREEMIUM_INPUT_SIZE = 20

interface IRLConfig {
  [addressRateLimit1: string]: any
  addressRateLimit2: any
  addressRateLimit3: any
  addressRateLimit4: any
  addressRateLimit5: any
}

const config: IRLConfig = {
  addressRateLimit1: undefined,
  addressRateLimit2: undefined,
  addressRateLimit3: undefined,
  addressRateLimit4: undefined,
  addressRateLimit5: undefined,
  addressRateLimit6: undefined,
  addressRateLimit7: undefined,
  addressRateLimit8: undefined,
  addressRateLimit9: undefined
}

let i = 1
while (i < 10) {
  config[`addressRateLimit${i}`] = new RateLimit({
    windowMs: 60000, // 1 hour window
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    max: 60, // start blocking after 60 requests
    handler: function(req: express.Request, res: express.Response /*next*/) {
      res.format({
        json: function() {
          res.status(500).json({
            error: "Too many requests. Limits are 60 requests per minute."
          })
        }
      })
    }
  })
  i++
}

// Connect the route endpoints to their handler functions.
router.get("/", config.addressRateLimit1, root)
router.get("/details/:address", config.addressRateLimit2, detailsSingle)
router.post("/details", config.addressRateLimit3, detailsBulk)
router.post("/utxo", config.addressRateLimit4, utxoBulk)
router.get("/utxo/:address", config.addressRateLimit5, utxoSingle)
router.post("/unconfirmed", config.addressRateLimit6, unconfirmedBulk)
router.get("/unconfirmed/:address", config.addressRateLimit7, unconfirmedSingle)
router.get(
  "/transactions/:address",
  config.addressRateLimit8,
  transactionsSingle
)
router.post("/transactions", config.addressRateLimit9, transactionsBulk)

// Root API endpoint. Simply acknowledges that it exists.
function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "address" })
}

// Query the Insight API for details on a single BCH address.
async function detailsFromInsight(
  thisAddress: string,
  currentPage: number = 0
) {
  try {
    // Use the default (and max) page size of 1000
    // https://github.com/bitpay/insight-api#notes-on-upgrading-from-v03
    const pageSize = 1000

    const legacyAddr = BITBOX.Address.toLegacyAddress(thisAddress)

    let path = `${process.env.BITCOINCOM_BASEURL}addr/${legacyAddr}`

    // Set from and to params based on currentPage and pageSize
    // https://github.com/bitpay/insight-api/blob/master/README.md#notes-on-upgrading-from-v02
    const from = currentPage * pageSize
    const to = from + pageSize
    path = `${path}?from=${from}&to=${to}`

    // Query the Insight server.
    const response = await axios.get(path)

    // Calculate pagesTotal from response
    const pagesTotal = Math.ceil(response.data.txApperances / pageSize)

    // Append different address formats to the return data.
    const retData = response.data
    retData.legacyAddress = BITBOX.Address.toLegacyAddress(thisAddress)
    retData.cashAddress = BITBOX.Address.toCashAddress(thisAddress)
    retData.currentPage = currentPage
    retData.pagesTotal = pagesTotal

    return retData
  } catch (err) {
    throw err
  }
}

// POST handler for bulk queries on address details
// curl -d '{"addresses": ["bchtest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr", "bchtest:qp6hgvevf4gzz6l7pgcte3gaaud9km0l459fa23dul"]}' -H "Content-Type: application/json" http://localhost:3000/v2/address/details
// curl -d '{"addresses": ["bchtest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr", "bchtest:qp6hgvevf4gzz6l7pgcte3gaaud9km0l459fa23dul"], "from": 1, "to": 5}' -H "Content-Type: application/json" http://localhost:3000/v2/address/details
async function detailsBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let addresses = req.body.addresses
    const currentPage = req.body.page ? parseInt(req.body.page, 10) : 0

    // Reject if addresses is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({
        error: "addresses needs to be an array. Use GET for single address."
      })
    }

    // Enforce no more than 20 addresses.
    if (addresses.length > FREEMIUM_INPUT_SIZE) {
      res.status(400)
      return res.json({
        error: "Array too large. Max 20 addresses"
      })
    }

    logger.debug(`Executing address/details with these addresses: `, addresses)

    // stub response object
    let returnResponse: IResponse = {
      status: 100,
      json: {
        error: ""
      }
    }

    // Loop through each address and creates an array of insight requests to call in parallel
    addresses = addresses.map(async (address: any, index: number) => {
      // Ensure the input is a valid BCH address.
      try {
        BITBOX.Address.toLegacyAddress(address)
      } catch (er) {
        if (er.message.includes("Unsupported address format"))
          returnResponse.status = 400
        returnResponse.json = {
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        }
        return
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(address)
      if (!networkIsValid) {
        returnResponse.status = 400
        returnResponse.json = {
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        }
      }

      return await detailsFromInsight(address, currentPage)
    })

    // if any input errors return response
    if (returnResponse.status !== 100) {
      res.status(returnResponse.status)
      return res.json(returnResponse.json)
    }

    const result: Array<any> = []
    return axios.all(addresses).then(
      axios.spread((...args) => {
        args.forEach((arg: any) => {
          arg.legacyAddress = BITBOX.Address.toLegacyAddress(arg.addrStr)
          arg.cashAddress = BITBOX.Address.toCashAddress(arg.addrStr)
          delete arg.addrSr
          result.push(arg)
        })

        // Return the array of retrieved address information.
        res.status(200)
        return res.json(result)
      })
    )
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

// GET handler for single address details
async function detailsSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const address = req.params.address
    const currentPage = req.query.page ? parseInt(req.query.page, 10) : 0

    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(`Executing address/detailsSingle with this address: `, address)

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

    // Query the Insight API.
    const retData = await detailsFromInsight(address, currentPage)

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retData)
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

// Retrieve UTXO data from the Insight API
async function utxoFromInsight(thisAddress: string) {
  try {
    const legacyAddr = BITBOX.Address.toLegacyAddress(thisAddress)

    const path = `${process.env.BITCOINCOM_BASEURL}addr/${legacyAddr}/utxo`

    // Query the Insight server.
    const response = await axios.get(path)

    // Append different address formats to the return data.
    const retData = {
      utxos: Array,
      legacyAddress: String,
      cashAddress: String
    }
    retData.utxos = response.data
    retData.legacyAddress = BITBOX.Address.toLegacyAddress(thisAddress)
    retData.cashAddress = BITBOX.Address.toCashAddress(thisAddress)
    //console.log(`utxoFromInsight retData: ${util.inspect(retData)}`)

    return retData
  } catch (err) {
    throw err
  }
}

// Retrieve UTXO information for an address.
async function utxoBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const result: Array<any> = []
    let returnResponse: IResponse = {
      status: 100,
      json: {
        error: ""
      }
    }
    let addresses = req.body.addresses

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    // Enforce no more than 20 addresses.
    if (addresses.length > FREEMIUM_INPUT_SIZE) {
      res.status(400)
      return res.json({
        error: "Array too large. Max 20 addresses"
      })
    }

    logger.debug(`Executing address/utxoBulk with these addresses: `, addresses)

    addresses = addresses.map(async (address: any, index: number) => {
      // Ensure the input is a valid BCH address.
      try {
        BITBOX.Address.toLegacyAddress(address)
      } catch (er) {
        if (er.message.includes("Unsupported address format"))
          returnResponse.status = 400
        returnResponse.json = {
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        }
        return
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(address)
      if (!networkIsValid) {
        returnResponse.status = 400
        returnResponse.json = {
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        }
      }

      return await utxoFromInsight(address)
    })

    if (returnResponse.status !== 100) {
      res.status(returnResponse.status)
      return res.json(returnResponse.json)
    }

    return axios.all(addresses).then(
      axios.spread((...args) => {
        args.forEach((arg: any) => {
          result.push(arg)
        })
        res.status(200)
        return res.json(result)
      })
    )
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

// GET handler for single address details
async function utxoSingle(
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

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(`Executing address/utxoSingle with this address: `, address)

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

    // Query the Insight API.
    const retData = await utxoFromInsight(address)

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retData)
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

// Retrieve any unconfirmed TX information for a given address.
async function unconfirmedBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const result: Array<any> = []
    let returnResponse: IResponse = {
      status: 100,
      json: {
        error: ""
      }
    }
    let addresses = req.body.addresses

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    logger.debug(`Executing address/utxo with these addresses: `, addresses)

    // Enforce no more than 20 addresses.
    if (addresses.length > FREEMIUM_INPUT_SIZE) {
      res.status(400)
      return res.json({
        error: "Array too large. Max 20 addresses"
      })
    }

    // Loop through each address.
    addresses = addresses.map(async (address: any, index: number) => {
      // Ensure the input is a valid BCH address.
      try {
        BITBOX.Address.toLegacyAddress(address)
      } catch (er) {
        if (er.message.includes("Unsupported address format"))
          returnResponse.status = 400
        returnResponse.json = {
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        }
        return
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(address)
      if (!networkIsValid) {
        returnResponse.status = 400
        returnResponse.json = {
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        }
      }

      const retData = await utxoFromInsight(address)

      // Loop through each returned UTXO.
      for (let j = 0; j < retData.utxos.length; j++) {
        const thisUtxo = (<any>retData.utxos)[j]

        // Only interested in UTXOs with no confirmations.
        if (thisUtxo.confirmations !== 0) return thisUtxo
      }
    })

    if (returnResponse.status !== 100) {
      res.status(returnResponse.status)
      return res.json(returnResponse.json)
    }

    return axios.all(addresses).then(
      axios.spread((...args) => {
        args.forEach((arg: any) => {
          if (arg) {
            result.push(arg)
          }
        })
        res.status(200)
        return res.json(result)
      })
    )
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

// GET handler. Retrieve any unconfirmed TX information for a given address.
async function unconfirmedSingle(
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

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(`Executing address/utxoSingle with this address: `, address)

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

    interface Iutxo {
      address: String
      txid: String
      vout: Number
      scriptPubKey: String
      amount: Number
      satoshis: Number
      height: Number
      confirmations: Number
    }

    // Query the Insight API.
    const retData: any = await utxoFromInsight(address)
    //console.log(`retData: ${JSON.stringify(retData,null,2)}`)

    // Loop through each returned UTXO.
    const unconfirmedUTXOs = []
    for (let j = 0; j < retData.utxos.length; j++) {
      const thisUtxo: Iutxo = retData.utxos[j]

      // Only interested in UTXOs with no confirmations.
      if (thisUtxo.confirmations === 0) unconfirmedUTXOs.push(thisUtxo)
    }

    retData.utxos = unconfirmedUTXOs

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retData)
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

// Retrieve transaction data from the Insight API
async function transactionsFromInsight(
  thisAddress: string,
  currentPage: number = 0
) {
  try {
    const path = `${
      process.env.BITCOINCOM_BASEURL
    }txs/?address=${thisAddress}&pageNum=${currentPage}`

    // Query the Insight server.
    const response = await axios.get(path)

    // Append different address formats to the return data.
    const retData = response.data
    retData.legacyAddress = BITBOX.Address.toLegacyAddress(thisAddress)
    retData.cashAddress = BITBOX.Address.toCashAddress(thisAddress)
    retData.currentPage = currentPage

    return retData
  } catch (err) {
    throw err
  }
}

// Get an array of TX information for a given address.
async function transactionsBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const result: Array<any> = []
    let returnResponse: IResponse = {
      status: 100,
      json: {
        error: ""
      }
    }
    let addresses = req.body.addresses
    const currentPage = req.body.page ? parseInt(req.body.page, 10) : 0

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    logger.debug(`Executing address/utxo with these addresses: `, addresses)

    // Enforce no more than 20 addresses.
    if (addresses.length > FREEMIUM_INPUT_SIZE) {
      res.status(400)
      return res.json({
        error: "Array too large. Max 20 addresses"
      })
    }

    // Loop through each address.
    addresses = addresses.map(async (address: any, index: number) => {
      // Ensure the input is a valid BCH address.
      try {
        BITBOX.Address.toLegacyAddress(address)
      } catch (er) {
        if (er.message.includes("Unsupported address format"))
          returnResponse.status = 400
        returnResponse.json = {
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        }
        return
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(address)
      if (!networkIsValid) {
        returnResponse.status = 400
        returnResponse.json = {
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        }
      }

      return await transactionsFromInsight(address, currentPage)
    })

    if (returnResponse.status !== 100) {
      res.status(returnResponse.status)
      return res.json(returnResponse.json)
    }

    return axios.all(addresses).then(
      axios.spread((...args) => {
        args.forEach((arg: any) => {
          if (arg) {
            result.push(arg)
          }
        })
        res.status(200)
        return res.json(result)
      })
    )
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

// GET handler. Retrieve any unconfirmed TX information for a given address.
async function transactionsSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const address = req.params.address
    const currentPage = req.query.page ? parseInt(req.query.page, 10) : 0

    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(
      `Executing address/transactionsSingle with this address: `,
      address
    )

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

    // Query the Insight API.
    const retData = await transactionsFromInsight(address, currentPage)
    //console.log(`retData: ${JSON.stringify(retData,null,2)}`)

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retData)
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

module.exports = {
  router,
  testableComponents: {
    root,
    detailsBulk,
    detailsSingle,
    utxoBulk,
    utxoSingle,
    unconfirmedBulk,
    unconfirmedSingle,
    transactionsBulk,
    transactionsSingle
  }
}
