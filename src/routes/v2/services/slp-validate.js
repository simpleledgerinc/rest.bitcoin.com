"use strict"

const axios = require("axios")
// const chunk = require("lodash.chunk")
const SLPSDK = require("slp-sdk/lib/SLP").default
const SLP = new SLPSDK()

const slpParse = require("./slp-parse")

async function validate(tokenId) {
  try {
    const utxos = await getSlpUtxos(tokenId)
    if (utxos.length === 0) return []

    // const txidsToValidate = [...new Set(utxos.map(utxo => utxo.txid))]
    const txidsToValidate = utxos.map(utxo => utxo.txid)

    // const validTxidArrays = await Promise.all(
    //   chunk(txidsToValidate, 20).map(txids => {
    //     return axios({
    //       method: "GET",
    //       url: `https://tokengraph.network/verify/${txids.join(",")}`,
    //       json: true
    //     }).then(res => res.data.response.filter(i => !i.errors).map(i => i.tx));
    //   })
    // );
    // const validTxids = [].concat(...validTxidArrays);

    const validTxids = txidsToValidate

    const validUtxos = utxos.filter(utxo => validTxids.includes(utxo.txid))

    const balances = validUtxos
      .reduce((bals, utxo) => {
        const existingBal = bals.find(bal => bal.address === utxo.address)
        if (existingBal) {
          existingBal.amount = existingBal.amount.plus(utxo.amount)
        } else {
          bals.push({
            cashAddress: SLP.Address.toCashAddress(utxo.address),
            slpAddress: SLP.Utils.toSLPAddress(utxo.address),
            legacyAddress: SLP.Address.toLegacyAddress(utxo.address),
            balance: utxo.amount
          })
        }
        return bals
      }, [])
      .map(bal => {
        bal.balance = bal.balance.toString()
        return bal
      })

    return balances
  } catch (err) {
    console.error("slp-balances", err)
    return []
  }
}

async function getSlpTransactions(tokenId) {
  try {
    var query = {
      v: 3,
      q: {
        find: {
          "out.h1": "534c5000",
          $or: [
            {
              $and: [
                {
                  $or: [{ "out.s3": "MINT" }, { "out.s3": "SEND" }],
                  "out.h4": tokenId
                }
              ]
            },
            {
              "tx.h": tokenId
            }
          ]
        }
      }
    }

    var s = JSON.stringify(query)
    var b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.BITDB_URL}q/${b64}`

    const tokenTxRes = await axios.get(url)
    const tokenTxs = tokenTxRes.data.c
    if (tokenTxRes.data.u && tokenTxRes.data.u.length)
      tokenTxs.concat(tokenTxRes.data.u)

    const genesisTxs = tokenTxs.filter(tx => tx.tx.h === tokenId)
    if (genesisTxs.length !== 1) throw new Error("Could not find genesis tx")
    const genesisTx = genesisTxs[0]

    const unspentOutputs = outputs.filter(
      output =>
        !tokenTxs.some(tokenTx =>
          tokenTx.in.some(
            input => input.e.h === output.txid && input.e.i === output.vout
          )
        )
    )

    return unspentOutputs
  } catch (err) {
    console.error("slp-balances", err)
    return []
  }
}

async function validateTx(tokenTxs, transaction, inputAmount) {
  // Parse all token properties

  // Validate protocol format rules

  // Get list of amounts sent to each output
  const outputAmounts = ["5", "3"]

  // Validate protocol balance rules of input and output amounts

  // Find valid vout range of transaction outputs
  const validVouts = ["1", "2", "3"]

  // Find children
  const children = tokenTxs.filter(tx => {
    for (var i; i < tx.in.length; i++) {
      if (tx.in[i].e.h === transaction.tx.h && validVouts.includes(tx.in[i].e.i)) return true
    }
    return false
  })

  // Validate each child
  validateTx(tokenTxs, children[0], outputAmounts[0])
}

async function getSlpUtxos(tokenId) {
  try {
    var query = {
      v: 3,
      q: {
        find: {
          "out.h1": "534c5000",
          $or: [
            {
              $and: [
                {
                  $or: [{ "out.s3": "MINT" }, { "out.s3": "SEND" }],
                  "out.h4": tokenId
                }
              ]
            },
            {
              "tx.h": tokenId
            }
          ]
        },
        limit: 1000
      }
    }

    var s = JSON.stringify(query)
    var b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.BITDB_URL}q/${b64}`

    const tokenTxRes = await axios.get(url)
    const tokenTxs = tokenTxRes.data.c
    if (tokenTxRes.data.u && tokenTxRes.data.u.length)
      tokenTxs.concat(tokenTxRes.data.u)

    // console.log(tokenTxs)

    const outputs = slpParse(tokenId, tokenTxs)

    const unspentOutputs = outputs.filter(
      output =>
        !tokenTxs.some(tokenTx =>
          tokenTx.in.some(
            input => input.e.h === output.txid && input.e.i === output.vout
          )
        )
    )

    return unspentOutputs
  } catch (err) {
    console.error("slp-balances", err)
    return []
  }
}

module.exports = validate
