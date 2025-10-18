// lib/mongodb.ts
import { MongoClient, Db } from "mongodb";

// ----------------------------------------------------------------------------
// IMPORTANT: Need to all pre-existing Supabase that was already configured.
// Run runtime and dynamic on all client for it to work on development
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

declare global {
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
  return c.db(); 
}
