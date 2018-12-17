const axios = require('axios')

var _instance: Wormholedb = null

const init = async function(instance: Wormholedb = null) {
  if (instance !== null) {
    _instance = instance
    return
  }

  _instance = new Wormholedb()
  await _instance.init()
}

const getInstance = async function (): Promise<Wormholedb> {
  if (!_instance) {
    await init()
  }

  return _instance
}

class Wormholedb  {
  private _url: any
  async init() {
    this._url = process.env.WORMHOLEDB_URL ? process.env.WORMHOLEDB_URL : "http://localhost"
  }

  async getConfirmedTransactions(address: string, pageSize: number, currentPage: number) {
    const query = {
      v: 3,
      q: {
        db: ["c"],
        aggregate: [
          {
            $match: {
              valid: true, // Only valid transactions
              type_int: 0, // Simple Send type
              $or: [
                { sendingaddress: address }, // From address
                { referenceaddress: address }, // Receiving address
              ]
            }
          },
          {
           $project: {
              _id: 0,
              blk: 0,
              confirmations: 0,
              ismine: 0,
              tx: 0
            }
          },
          {
            $sort: {
              block: 1,
              positioninblock: 1
            }
          },
          {
            $facet: {
              metadata: [ { $count: "count" } ],
              data: [
                { $skip: currentPage * pageSize },
                { $limit: pageSize }
              ]
            }
          }
        ]
      }
    }
    const s = JSON.stringify(query);
    const b64 = Buffer.from(s).toString('base64')
    const url = `${this._url}q/${b64}`
    const result = await axios.get(url)
    return result
  }
}

module.exports = {
  init: init,
  getInstance: getInstance,
}
