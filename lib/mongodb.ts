import { MongoClient, Db } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local")
}

const uri: string = process.env.MONGODB_URI
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  retryWrites: true
}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null
let db: Db | null = null

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function getDb(): Promise<Db> {
  if (!clientPromise) {
    throw new Error("MongoDB client not initialized")
  }
  
  try {
    if (!db) {
      const client = await clientPromise
      db = client.db()
      // Test the connection
      await db.command({ ping: 1 })
    }
    return db
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error)
    // Reset the connection
    client = null
    db = null
    clientPromise = null
    throw new Error("Failed to connect to database")
  }
}