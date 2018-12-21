import axios from "axios"
const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default
const BITBOX = new BITBOXCli()

// Query the Insight API for details on a single BCH address.
async function details(thisAddress: string, currentPage: number = 0) {
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

export {
  details
}
