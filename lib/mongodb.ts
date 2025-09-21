// lib/mongodb.ts
import { MongoClient, Db } from "mongodb";

// ----------------------------------------------------------------------------
// IMPORTANT: Any route that imports this MUST specify:
//   export const runtime = "nodejs";
//   export const dynamic = "force-dynamic";
// ----------------------------------------------------------------------------

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("❌ Please add MONGODB_URI to your environment variables.");
}

// Simple client options for Atlas
const clientOptions = {
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 30_000,
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 10_000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Cache the client across hot reloads / serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, clientOptions);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise!;
} else {
  client = new MongoClient(uri, clientOptions);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db(); // defaults to DB name inside your URI (or "test" if not specified)
}
