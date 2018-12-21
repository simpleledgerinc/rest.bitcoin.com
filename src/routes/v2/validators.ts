const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default
const BITBOX = new BITBOXCli()
const routeUtils = require("./route-utils")

const address = (address: string) => {
  if (!address || address === "") {
    throw new Error("address can not be empty")
  }

  // Reject if address is an array.
  if (Array.isArray(address)) {
    throw new Error("address can not be an array. Use POST for bulk upload.")
  }

  // Ensure the input is a valid BCH address.
  try {
    var legacyAddr = BITBOX.Address.toLegacyAddress(address)
  } catch (err) {
    throw new Error(`Invalid BCH address. Double check your address is valid: ${address}`)
  }

  // Prevent a common user error. Ensure they are using the correct network address.
  const networkIsValid = routeUtils.validateNetwork(address)
  if (!networkIsValid) {
    throw new Error("Invalid network. Trying to use a testnet address on mainnet, or vice versa.")
  }

  return address
}

const addresses = (addresses: Array<string>, { req }: any) => {
  // Reject if address is not an array.
  if (!Array.isArray(addresses)) {
    throw new Error("addresses needs to be an array. Use GET for single address.")
  }

  // Validate each address in array
  for (let i = 0; i < addresses.length; i++) {
    const thisAddress = addresses[i]

    address(thisAddress)
  }
}

export {
  address,
  addresses
}
