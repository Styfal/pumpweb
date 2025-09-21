// lib/mongodb.ts
import { MongoClient, Db, ServerApiVersion } from "mongodb";
import path from "node:path";
import fs from "node:fs";

// ----------------------------------------------------------------------------
// IMPORTANT: Any route that imports this MUST specify:
//   export const runtime = "nodejs";
//   export const dynamic = "force-dynamic";
// ----------------------------------------------------------------------------

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("❌ Please add MONGODB_URI to your environment variables.");

// Optional envs for DocDB / custom TLS
const allowInsecure = process.env.MONGODB_TLS_INSECURE === "1";
const caFileEnv = process.env.MONGODB_TLS_CA_FILE; // e.g. "certs/rds-combined-ca-bundle.pem"
const isDocDB = process.env.MONGODB_PROVIDER === "docdb";

// Try to resolve CA file if defined
let tlsCAFile: string | undefined;
if (caFileEnv) {
  const resolved = path.isAbsolute(caFileEnv)
    ? caFileEnv
    : path.join(process.cwd(), caFileEnv);
  if (fs.existsSync(resolved)) {
    tlsCAFile = resolved;
  } else {
    console.warn(`[mongo] ⚠️ CA file not found at: ${resolved}. Continuing without tlsCAFile.`);
  }
}

// Mongo client options
const clientOptions: ConstructorParameters<typeof MongoClient>[1] = {
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 30_000,
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 10_000,

  // TLS only if needed
  ...(tlsCAFile ? { tls: true, tlsCAFile } : {}),
  ...(allowInsecure ? { tlsAllowInvalidCertificates: true, tlsAllowInvalidHostnames: true } : {}),
  ...(isDocDB ? { tls: true, tlsAllowInvalidHostnames: true, retryWrites: false } : {}),

  retryReads: true,

  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
};

// Client caching across hot reloads / serverless invocations
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

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
  return c.db(); // uses default DB from URI
}
