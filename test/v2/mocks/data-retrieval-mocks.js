/*
  This library contains mocking data for running unit tests.
*/

"use strict"

const mockConsensusHash = {
  block: 1267863,
  blockhash: "000000000001e7e30c34eaf044ffd0e5bf28eeeaad5fc6b2a6de5cb70befa54c",
  consensushash:
    "476bff1d01a66420a53b65bf72ac46056c91ea32d64a46440306f4a9f1695668"
}

const mockInfo = {
  wormholeversion_int: 10000000,
  wormholeversion: "0.1.0",
  bitcoincoreversion: "0.17.2",
  block: 1267875,
  blocktime: 1542218842,
  blocktransactions: 0,
  totaltransactions: 4355,
  alerts: []
}

const mockProperties = [
  {
    propertyid: 1,
    name: "WHC",
    category: "N/A",
    subcategory: "N/A",
    data:
      "WHC serve as the binding between Bitcoin cash, smart properties and contracts created on the Wormhole.",
    url: "http://www.wormhole.cash",
    precision: 8
  },
  {
    propertyid: 3,
    name: "test_token1",
    category: "test managed token 0",
    subcategory: "test",
    data: "my data",
    url: "www.testmanagedtoken.com",
    precision: 0
  },
  {
    propertyid: 4,
    name: "test_token1",
    category: "test managed token 2",
    subcategory: "test",
    data: "my data",
    url: "www.testmanagedtoken.com",
    precision: 2
  }
]

const mockBalancesForAddress = [
  { propertyid: 1, balance: "3.97384339", reserved: "0.00000000" },
  { propertyid: 314, balance: "1000.00000000", reserved: "0.00000000" },
  { propertyid: 317, balance: "100.00000000", reserved: "0.00000000" },
  { propertyid: 353, balance: "4567.00000000", reserved: "0.00000000" },
  { propertyid: 363, balance: "4567000.00000000", reserved: "0.00000000" },
  { propertyid: 364, balance: "4567000.00000000", reserved: "0.00000000" },
  { propertyid: 367, balance: "4567000.00000000", reserved: "0.00000000" },
  { propertyid: 368, balance: "4566655.00000000", reserved: "0.00000000" },
  { propertyid: 473, balance: "4566655.00000000", reserved: "0.00000000" }
]

const mockBalanceForId = [
  {
    address: "bchtest:qqcsp0yke938cdvvstehhqv07pzhel30tv32e5vz8a",
    balance: "24.2",
    reserved: "0.0"
  },
  {
    address: "bchtest:qp7z6v3mqq3p8f0kqy6lv2s54sq7pupluu85hgp327",
    balance: "75.8",
    reserved: "0.0"
  },
  {
    address: "bchtest:qpalmy832fp9ytdlx444sehajljnm554dulckcvjl5",
    balance: "1.0",
    reserved: "0.0"
  },
  {
    address: "bchtest:qqwrj8yer7us830ca4y7fw89q24gh3cu8u8a7z489j",
    balance: "10.0",
    reserved: "0.0"
  },
  {
    address: "bchtest:qzspkw5g0tew8k3xl7cwctlt3swuaurvkqelj2pmzf",
    balance: "100.0",
    reserved: "0.0"
  },
  {
    address: "bchtest:qq0ae7jqqvr87gex4yk3ukppvnm0w7ftqqpzv0lcqa",
    balance: "99.0",
    reserved: "0.0"
  },
  {
    address: "bchtest:qq6qag6mv2fzuq73qanm6k60wppy23djnv7ddk3lpk",
    balance: "90.0",
    reserved: "0.0"
  }
]

const mockAddressPropertyBalance = {
  balance: "1234567890123.123000",
  reserved: "0.000000"
}

const mockBalanceHash = {
  block: 1270046,
  blockhash: "00000000b0ed54ba9be49a23dc38baa11eba1454056212c4f6de4fe9fbbc02f8",
  propertyid: 24,
  balanceshash:
    "80e368a2b6b6ed8183dbaa7969bb5129eaac9154c8022525e0597bb58ba7ab0e"
}

const mockCrowdsale = {
  propertyid: 7,
  name: "crowsale_5",
  active: false,
  issuer: "bchtest:qz04wg2jj75x34tge2v8w0l6r0repfcvcygv3t7sg5",
  propertyiddesired: 1,
  precision: "5",
  tokensperunit: "0.10000000",
  earlybonus: 10,
  starttime: 1532875701,
  deadline: 1533874961,
  amountraised: "42.50925682",
  tokensissued: "10000000.00000",
  addedissuertokens: "9999995.61573",
  closedearly: false,
  maxtokens: false
}

const mockGrants = {
  propertyid: 4,
  name: "test_token1",
  issuer: "bchtest:qz04wg2jj75x34tge2v8w0l6r0repfcvcygv3t7sg5",
  creationtxid:
    "6579dea76c3d0b4463671c5476f90f20c746992c300a4b8ec4ce6748c0960836",
  totaltokens: "122.22",
  issuances: [
    {
      txid: "18abf3097cf2b8731daeea06bf0b19b0df9f3d4895d7d09ddf77bb7f63c9b831",
      grant: "123.45"
    },
    {
      txid: "e41c5a52e4985d07308d98d029c92c5350f1169dfd7af1a5ab20b956c90f8c86",
      revoke: "1.23"
    }
  ]
}

const mockPayload = {
  payload: "0000003700000004000000000000303900",
  payloadsize: 17
}

const mockProperty = {
  propertyid: 111,
  name: "Quantum Miner",
  category: "Companies",
  subcategory: "Bitcoin Mining",
  data: "Quantum Miner Tokens QMT",
  url: "www.example.com",
  precision: 1,
  issuer: "bchtest:qq2j9gp97gm9a6lwvhxc4zu28qvqm0x4j5e72v7ejg",
  creationtxid:
    "8d2e358edcddadbaa4e0f7c9e3fe2ff7e128c4bed6d3a6a67af6aa5922c7bcd8",
  fixedissuance: true,
  managedissuance: false,
  totaltokens: "1000000.0"
}

const mockSTO = {
  txid: "18abf3097cf2b8731daeea06bf0b19b0df9f3d4895d7d09ddf77bb7f63c9b831",
  fee: "1114",
  sendingaddress: "bchtest:qz04wg2jj75x34tge2v8w0l6r0repfcvcygv3t7sg5",
  referenceaddress: "bchtest:qz04wg2jj75x34tge2v8w0l6r0repfcvcygv3t7sg5",
  ismine: false,
  version: 0,
  type_int: 55,
  type: "Grant Property Tokens",
  propertyid: 4,
  precision: "2",
  amount: "123.45",
  valid: true,
  blockhash: "0000000000000048c5939847c8304448af2f0b4851b30150c9b2a352dd02bae5",
  blocktime: 1532837111,
  positioninblock: 3,
  block: 1249133,
  confirmations: 20920
}

const mockTransaction = {
  txid: "18abf3097cf2b8731daeea06bf0b19b0df9f3d4895d7d09ddf77bb7f63c9b831",
  fee: "1114",
  sendingaddress: "bchtest:qz04wg2jj75x34tge2v8w0l6r0repfcvcygv3t7sg5",
  referenceaddress: "bchtest:qz04wg2jj75x34tge2v8w0l6r0repfcvcygv3t7sg5",
  ismine: false,
  version: 0,
  type_int: 55,
  type: "Grant Property Tokens",
  propertyid: 4,
  precision: "2",
  amount: "123.45",
  valid: true,
  blockhash: "0000000000000048c5939847c8304448af2f0b4851b30150c9b2a352dd02bae5",
  blocktime: 1532837111,
  positioninblock: 3,
  block: 1249133,
  confirmations: 20978
}

const mockBlockTransactions = [
  "5a6e71b12718fff4ca9981376fdf6e78357e9bfd126162ab22a8ee728c8dfad3",
  "6afffd7d14060b6e79c504c5f17596616eb99356b71d301b5b37df1df065b9a0",
  "18abf3097cf2b8731daeea06bf0b19b0df9f3d4895d7d09ddf77bb7f63c9b831"
]

const mockFrozenBalance = {
  frozen: false,
  balance: "0.00"
}

module.exports = {
  mockConsensusHash,
  mockInfo,
  mockProperties,
  mockBalancesForAddress,
  mockBalanceForId,
  mockAddressPropertyBalance,
  mockBalanceHash,
  mockCrowdsale,
  mockGrants,
  mockPayload,
  mockProperty,
  mockSTO,
  mockTransaction,
  mockBlockTransactions,
  mockFrozenBalance
}
