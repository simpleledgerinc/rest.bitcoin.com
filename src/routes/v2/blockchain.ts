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

interface IRLConfig {
  [blockchainRateLimit1: string]: any
  blockchainRateLimit2: any
  blockchainRateLimit3: any
  blockchainRateLimit4: any
  blockchainRateLimit5: any
  blockchainRateLimit6: any
  blockchainRateLimit7: any
  blockchainRateLimit8: any
  blockchainRateLimit9: any
  blockchainRateLimit10: any
  blockchainRateLimit11: any
  blockchainRateLimit12: any
  blockchainRateLimit13: any
  blockchainRateLimit14: any
  blockchainRateLimit15: any
  blockchainRateLimit16: any
  blockchainRateLimit17: any
}

const config: IRLConfig = {
  blockchainRateLimit1: undefined,
  blockchainRateLimit2: undefined,
  blockchainRateLimit3: undefined,
  blockchainRateLimit4: undefined,
  blockchainRateLimit5: undefined,
  blockchainRateLimit6: undefined,
  blockchainRateLimit7: undefined,
  blockchainRateLimit8: undefined,
  blockchainRateLimit9: undefined,
  blockchainRateLimit10: undefined,
  blockchainRateLimit11: undefined,
  blockchainRateLimit12: undefined,
  blockchainRateLimit13: undefined,
  blockchainRateLimit14: undefined,
  blockchainRateLimit15: undefined,
  blockchainRateLimit16: undefined,
  blockchainRateLimit17: undefined
}

let i = 1
while (i < 17) {
  config[`blockchainRateLimit${i}`] = new RateLimit({
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

// Define routes.
router.get("/", config.blockchainRateLimit1, root)
router.get("/getBestBlockHash", config.blockchainRateLimit2, getBestBlockHash)
// TODO: Where is getBlockByHash?
//router.get("/getBlock/:hash", config.blockchainRateLimit3, getBlock) // Same as block/getBlockByHash
router.get("/getBlockchainInfo", config.blockchainRateLimit3, getBlockchainInfo)
router.get("/getBlockCount", config.blockchainRateLimit4, getBlockCount)
router.get(
  "/getBlockHeader/:hash",
  config.blockchainRateLimit5,
  getBlockHeaderSingle
)
router.post("/getBlockHeader", config.blockchainRateLimit6, getBlockHeaderBulk)

router.get("/getChainTips", config.blockchainRateLimit7, getChainTips)
router.get("/getDifficulty", config.blockchainRateLimit8, getDifficulty)
router.get(
  "/getMempoolEntry/:txid",
  config.blockchainRateLimit9,
  getMempoolEntrySingle
)
router.post(
  "/getMempoolEntry",
  config.blockchainRateLimit10,
  getMempoolEntryBulk
)
router.get("/getMempoolInfo", config.blockchainRateLimit11, getMempoolInfo)
router.get("/getRawMempool", config.blockchainRateLimit12, getRawMempool)
router.get("/getTxOut/:txid/:n", config.blockchainRateLimit13, getTxOut)
router.get(
  "/getTxOutProof/:txid",
  config.blockchainRateLimit14,
  getTxOutProofSingle
)
router.post("/getTxOutProof", config.blockchainRateLimit15, getTxOutProofBulk)
router.get(
  "/verifyTxOutProof/:proof",
  config.blockchainRateLimit16,
  verifyTxOutProof
)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "blockchain" })
}

// Returns the hash of the best (tip) block in the longest block chain.
async function getBestBlockHash(
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

    requestConfig.data.id = "getbestblockhash"
    requestConfig.data.method = "getbestblockhash"
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

async function getBlockchainInfo(
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

    requestConfig.data.id = "getblockchaininfo"
    requestConfig.data.method = "getblockchaininfo"
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

async function getBlockCount(
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

    requestConfig.data.id = "getblockcount"
    requestConfig.data.method = "getblockcount"
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

async function getBlockHeaderSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let verbose = false
    if (req.query.verbose && req.query.verbose.toString() === "true")
      verbose = true

    const hash = req.params.hash
    if (!hash || hash === "") {
      res.status(400)
      return res.json({ error: "hash can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getblockheader"
    requestConfig.data.method = "getblockheader"
    requestConfig.data.params = [hash, verbose]

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

async function getBlockHeaderBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const hashes = req.body.hashes
    const verbose = req.body.verbose ? req.body.verbose : false

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

    logger.debug(
      `Executing blockchain/getBlockHeader with these hashes: `,
      hashes
    )

    // Loop through each hash.
    const retArray = []
    for (let i = 0; i < hashes.length; i++) {
      const thisHash = hashes[i] // Current hash.

      // Ensure the input is a valid BCH hash.
      try {
        if (thisHash.length !== 64) {
          throw "This is not a hash"
        }
      } catch (err) {
        res.status(400)
        return res.json({
          error: err
        })
      }

      const {
        BitboxHTTP,
        username,
        password,
        requestConfig
      } = routeUtils.setEnvVars()

      requestConfig.data.id = "getblockheader"
      requestConfig.data.method = "getblockheader"
      requestConfig.data.params = [thisHash, verbose]

      const retData = await BitboxHTTP(requestConfig)

      retArray.push(retData.data.result)
    }

    // Return the array of retrieved block information.
    res.status(200)
    return res.json(retArray)
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

async function getChainTips(
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

    requestConfig.data.id = "getchaintips"
    requestConfig.data.method = "getchaintips"
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

// Get the current difficulty value, used to regulate mining power on the network.
async function getDifficulty(
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

    requestConfig.data.id = "getdifficulty"
    requestConfig.data.method = "getdifficulty"
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

// Returns mempool data for given transaction. TXID must be in mempool (unconfirmed)
async function getMempoolEntrySingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validate input parameter
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

    requestConfig.data.id = "getmempoolentry"
    requestConfig.data.method = "getmempoolentry"
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

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function getMempoolEntryBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const txids = req.body.txids

    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({
        error: "txids needs to be an array. Use GET for single txid."
      })
    }

    // Enforce no more than 20 txids.
    if (txids.length > 20) {
      res.json({
        error: "Array too large. Max 20 txids"
      })
    }

    logger.debug(
      `Executing blockchain/getMempoolEntry with these txids: `,
      txids
    )

    // Loop through each hash.
    const retArray = []
    for (let i = 0; i < txids.length; i++) {
      const thisTxid = txids[i] // Current txid.

      try {
        if (thisTxid.length !== 64) {
          throw "This is not a txid"
        }
      } catch (err) {
        res.status(400)
        return res.json({
          error: err
        })
      }

      const {
        BitboxHTTP,
        username,
        password,
        requestConfig
      } = routeUtils.setEnvVars()

      requestConfig.data.id = "getmempoolentry"
      requestConfig.data.method = "getmempoolentry"
      requestConfig.data.params = [thisTxid]

      const retData = await BitboxHTTP(requestConfig)

      retArray.push(retData.data.result)
    }

    // Return the array of retrieved block information.
    res.status(200)
    return res.json(retArray)
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

async function getMempoolInfo(
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

    requestConfig.data.id = "getmempoolinfo"
    requestConfig.data.method = "getmempoolinfo"
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

async function getRawMempool(
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

    let verbose = false
    if (req.query.verbose && req.query.verbose === "true") verbose = true

    requestConfig.data.id = "getrawmempool"
    requestConfig.data.method = "getrawmempool"
    requestConfig.data.params = [verbose]

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

// Returns details about an unspent transaction output.
async function getTxOut(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validate input parameter
    const txid = req.params.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    let n = req.params.n
    if (n === undefined || n === "") {
      res.status(400)
      return res.json({ error: "n can not be empty" })
    }
    n = parseInt(n)

    let include_mempool = false
    if (req.query.include_mempool && req.query.include_mempool === "true")
      include_mempool = true

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "gettxout"
    requestConfig.data.method = "gettxout"
    requestConfig.data.params = [txid, n, include_mempool]

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

// Returns a hex-encoded proof that 'txid' was included in a block.
async function getTxOutProofSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validate input parameter
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

    requestConfig.data.id = "gettxoutproof"
    requestConfig.data.method = "gettxoutproof"
    requestConfig.data.params = [[txid]]

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

// Returns a hex-encoded proof that 'txid' was included in a block.
async function getTxOutProofBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const txids = req.body.txids

    // Reject if txids is not an array.
    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({
        error: "txids needs to be an array. Use GET for single txid."
      })
    }

    // Enforce no more than 20 txids.
    if (txids.length > 20) {
      res.json({
        error: "Array too large. Max 20 txids"
      })
    }

    logger.debug(`Executing blockchain/getTxOutProof with these txids: `, txids)

    // Loop through each txid.
    const retArray = []
    for (let i = 0; i < txids.length; i++) {
      const thisTxid = txids[i] // Current txid.

      // Ensure the input is a valid txid.
      try {
        if (thisTxid.length !== 64) {
          throw "This is not a txid"
        }
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid txid. Double check your txid is valid: ${thisTxid}`
        })
      }

      const {
        BitboxHTTP,
        username,
        password,
        requestConfig
      } = routeUtils.setEnvVars()

      requestConfig.data.id = "gettxoutproof"
      requestConfig.data.method = "gettxoutproof"
      requestConfig.data.params = [[thisTxid]]

      const response = await BitboxHTTP(requestConfig)

      interface Tmp {
        [txid: string]: any
      }

      let tmp: Tmp = {}
      tmp[thisTxid] = response.data.result
      retArray.push(tmp)
    }

    res.status(200)
    return res.json(retArray)
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

/*
//
// router.get('/preciousBlock/:hash', async (req, res, next) => {
//   BitboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"preciousblock",
//       method: "preciousblock",
//       params: [
//         req.params.hash
//       ]
//     }
//   })
//   .then((response) => {
//     res.json(JSON.stringify(response.data.result));
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
//
// router.post('/pruneBlockchain/:height', async (req, res, next) => {
//   BitboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"pruneblockchain",
//       method: "pruneblockchain",
//       params: [
//         req.params.height
//       ]
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
//
// router.get('/verifyChain', async (req, res, next) => {
//   BitboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"verifychain",
//       method: "verifychain"
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
*/

async function verifyTxOutProof(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validate input parameter
    const proof = req.params.proof
    if (!proof || proof === "") {
      res.status(400)
      return res.json({ error: "proof can not be empty" })
    }

    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "verifytxoutproof"
    requestConfig.data.method = "verifytxoutproof"
    requestConfig.data.params = [req.params.proof]

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

module.exports = {
  router,
  testableComponents: {
    root,
    getBestBlockHash,
    //getBlock,
    getBlockchainInfo,
    getBlockCount,
    getBlockHeaderSingle,
    getBlockHeaderBulk,
    getChainTips,
    getDifficulty,
    getMempoolInfo,
    getRawMempool,
    getMempoolEntrySingle,
    getMempoolEntryBulk,
    getTxOut,
    getTxOutProofSingle,
    getTxOutProofBulk,
    verifyTxOutProof
  }
}
