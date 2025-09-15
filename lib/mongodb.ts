// lib/mongodb.ts
import { MongoClient, Db, ServerApiVersion } from "mongodb";
import path from "node:path";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Please add your Mongo URI to environment variables");

const allowInsecure = process.env.MONGODB_TLS_INSECURE === "1"; // ← only if you fully accept the risk
const caFile = process.env.MONGODB_TLS_CA_FILE; // e.g., "certs/rds-combined-ca-bundle.pem" for DocDB
const isDocDB = process.env.MONGODB_PROVIDER === "docdb";

const clientOptions = {
  // Connectivity & pools
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 30_000,
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 10_000,

  // TLS
  tls: true,
  // Prefer a proper CA bundle over disabling checks:
  tlsCAFile: caFile ? path.join(process.cwd(), caFile) : undefined,
  // The following relaxations should be gated and avoided in production when possible:
  tlsAllowInvalidCertificates: allowInsecure || undefined,
  tlsAllowInvalidHostnames: (allowInsecure || isDocDB) || undefined,

  // Retry semantics
  retryReads: true,
  retryWrites: isDocDB ? false : true, // DocDB often doesn’t support retryable writes

  // Stable server API (Atlas-friendly)
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
} as const;

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  try {
    if (!client) {
      client = new MongoClient(uri as string, clientOptions);
      await client.connect();
    }
    db = client.db();
    // lightweight connectivity check
    await db.command({ ping: 1 });
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // reset so next request can retry a fresh client
    try {
      await client?.close();
    } catch {}
    client = null;
    db = null;
    throw new Error("Database connection failed");
  }
}
