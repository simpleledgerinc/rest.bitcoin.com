const MongoClient = require("mongodb").MongoClient

var db: any = null

const init = async function() {
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
  db = client.db("wormholedb")
  return db
}

const getInstance = async function () {
  if (!db) {
    await init()
  }

  return db
}

module.exports = getInstance
