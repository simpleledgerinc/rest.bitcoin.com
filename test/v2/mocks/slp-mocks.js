/*
  This library contains mocking data for running unit tests.
*/

"use strict"

const mockList = {
  u: [],
  c: [
    {
      id: "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a",
      timestamp: "2018-08-26 07:06",
      symbol: "",
      name: "TESTYCOIN",
      document: ""
    },
    {
      id: "74d5c1b2916273f19d1a8e80536658f2d63fb337353d9cf108af62d8c6a65154",
      timestamp: "2018-12-08 17:04",
      symbol: "J9T",
      name: "J9-T",
      document: ""
    },
    {
      id: "8095d290d215975bc87bb34fd91b73f2cad60ba4949bb33791c1224e3b594a6f",
      timestamp: "2018-12-24 13:03",
      symbol: "B13",
      name: "B13",
      document: ""
    },
    {
      id: "730741cb0aa0d05110fdcc079a5e1f5a4acc86bd504bd00e26ddb514d1242f76",
      timestamp: "2018-12-24 16:57",
      symbol: "",
      name: "",
      document: ""
    }
  ]
}

const mockConvert = {
  slpAddress: "slptest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2shlcycvd5",
  cashAddress: "bchtest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2svtllzmlf",
  legacyAddress: "mvQPGnzRT6gMWASZBMg7NcT3vmvsSKSQtf"
}

module.exports = {
  mockList,
  mockConvert
}
