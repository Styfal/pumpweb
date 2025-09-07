import { MongoClient, Db } from "mongodb"

const uri: string = process.env.MONGODB_URI ?? ""
if (!uri) {
  throw new Error("Missing MONGODB_URI in environment variables")
}

const options = {}

let client: MongoClient | null = null
let db: Db | null = null

export async function getDb(): Promise<Db> {
  if (!client) {
    client = new MongoClient(uri, options)
    await client.connect()
    db = client.db() // Uses default DB from URI
  }
  if (!db) {
    throw new Error("Failed to connect to database")
  }
  return db
}
