/*
  This library contains mocking data for running unit tests with the wormholedb service.
*/

"use strict";

const mockWormholedb = {
  getConfirmedTransactions: function() {
    return {
      data: {
        c: [
          {
            metadata: [
              {
                count: 2
              }
            ],
            data: [
              {
                txid:
                  "9a6ea779c4b700ac4b75d0346bc1ea9fc408c4cf14833220caa2a4b39c78ba07",
                fee: "1000",
                sendingaddress:
                  "bitcoincash:qp2ajcfvh2tssqrf2rx0h5fukmu86weg3ueznk4e5q",
                referenceaddress:
                  "bitcoincash:qpf2ppk6nfxa2sxp6vhww2uj3xw04ya7xqwp3nndke",
                version: 0,
                type_int: 0,
                type: "Simple Send",
                propertyid: 196,
                precision: "8",
                amount: "1000.00000000",
                valid: true,
                blockhash:
                  "000000000000000000f46f10c9b9eede487d51dd525db60704d96cace27db3b6",
                blocktime: 1543038230,
                positioninblock: 78,
                block: 557961
              },
              {
                txid:
                  "901c49e6985707e3e74cb1d471ec88882e38e0ad02bacd503f9c6b051c94fb11",
                fee: "288",
                sendingaddress:
                  "bitcoincash:qrkgpah795m3krhggmu6gduyp4luxn4fagrned07ps",
                referenceaddress:
                  "bitcoincash:qpf2ppk6nfxa2sxp6vhww2uj3xw04ya7xqwp3nndke",
                version: 0,
                type_int: 0,
                type: "Simple Send",
                propertyid: 1,
                precision: "8",
                amount: "5.00000000",
                valid: true,
                blockhash:
                  "00000000000000000197bf0664a7dc34c427578dc7c2204f4eca1034a86bde32",
                blocktime: 1543046207,
                positioninblock: 36,
                block: 557971
              }
            ]
          }
        ]
      }
    }
  }
};

module.exports = mockWormholedb
