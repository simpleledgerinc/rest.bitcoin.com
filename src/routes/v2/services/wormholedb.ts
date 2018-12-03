const MongoClient = require("mongodb").MongoClient

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
  private _db: any
  async init() {
    const host = process.env.WORMHOLEDB_HOST ? process.env.WORMHOLEDB_HOST : "localhost"
    const username = process.env.WORMHOLEDB_USERNAME
    const password = process.env.WORMHOLEDB_PASSWORD
    const credentials = username && password ? `${username}:${password}@` : ""
    const url = `mongodb://${credentials}${host}:27017`
    const client = new MongoClient(
      url,
      { useNewUrlParser: true }
    )
    await client.connect()
    this._db = client.db("wormholedb")
  }

  async getConfirmedTransactions(address: string, pageSize: number, currentPage: number) {
    const query = {
      valid: true, // Only valid transactions
      type_int: 0, // Simple Send type
      $or: [
        { sendingaddress: address }, // From address
        { referenceaddress: address }, // Receiving address
      ]
    }
    const result = await this._db.collection('confirmed').find(query).project({
      _id: 0,
      blk: 0,
      confirmations: 0,
      ismine: 0,
      tx: 0,
    })
    .sort({
      block: 1,
      positioninblock: 1,
    })
    .skip(currentPage * pageSize)
    .limit(pageSize)
    .toArray()

    const resultCount = await this._db.collection('confirmed').countDocuments(query)
    const pagesTotal = Math.ceil(resultCount / pageSize)

    return {
      currentPage: currentPage,
      pagesTotal: pagesTotal,
      txs: result,
    }
  }
}

module.exports = {
  init: init,
  getInstance: getInstance,
}
