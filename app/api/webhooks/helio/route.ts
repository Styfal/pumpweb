export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

const DEBUG = process.env.HELIO_WEBHOOK_DEBUG === "1";

// ───────────────────────────────────────────────────────────────────────────────
// Types for Helio webhook payloads?
// ───────────────────────────────────────────────────────────────────────────────
type HelioTxMeta = { transactionStatus?: string };
type HelioTxObject = { id: string; paylinkId?: string; meta?: HelioTxMeta };
type HelioShapeA = { event?: string; transactionObject?: HelioTxObject };
type HelioShapeB = { id?: string; paylink?: string; paylinkId?: string; meta?: HelioTxMeta };
type HelioIncoming = HelioShapeA | HelioShapeB;

type ParsedHelio = {
  helioTxId: string;
  paylinkId: string;
  txStatus: string; // uppercased
};

// ───────────────────────────────────────────────────────────────────────────────
// We need to authorize if helio is sending the proper token?
// ───────────────────────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): { ok: boolean; reason: string } {
  const rawSecret = process.env.HELIO_WEBHOOK_SECRET ?? "";
  const secret = rawSecret.trim();

  const authHdr = (req.headers.get("authorization") ?? "").trim();
  const xHelio = (req.headers.get("x-helio-token") ?? "").trim();

  if (DEBUG) {
    const mask = (s: string) => (s ? `${s.slice(0, 4)}…(${s.length})` : "(empty)");
    console.log("[webhook][auth] headers:", {
      authorization_present: !!authHdr,
      x_helio_present: !!xHelio,
      authorization_preview: authHdr ? authHdr.split(" ").slice(0, 2).join(" ") : "(none)",
    });
    console.log("[webhook][auth] env:", {
      secret_set: !!secret,
      secret_preview: mask(secret),
    });
  }

  if (!secret) return { ok: false, reason: "env_secret_missing" };

  if (authHdr.toLowerCase().startsWith("bearer ")) {
    const token = authHdr.slice(7).trim();
    if (token === secret) return { ok: true, reason: "ok_bearer" };
    return { ok: false, reason: "bearer_mismatch" };
  }

  if (xHelio) {
    if (xHelio === secret) return { ok: true, reason: "ok_x_helio_token" };
    return { ok: false, reason: "x_helio_token_mismatch" };
  }

  return { ok: false, reason: "no_auth_header" };
}

// ───────────────────────────────────────────────────────────────────────────────
// Type guards / parser
// ───────────────────────────────────────────────────────────────────────────────
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseHelioPayload(body: unknown): ParsedHelio | null {
  if (!isRecord(body)) return null;

  // Shape A: { transactionObject: { id, paylinkId, meta: { transactionStatus } } }
  if (isRecord(body.transactionObject)) {
    const t = body.transactionObject as Record<string, unknown>;
    const id = typeof t.id === "string" ? t.id : undefined;
    const paylinkId = typeof t.paylinkId === "string" ? t.paylinkId : undefined;
    const status =
      isRecord(t.meta) && typeof t.meta?.transactionStatus === "string"
        ? (t.meta.transactionStatus as string)
        : "";
    if (id && paylinkId) {
      return { helioTxId: id, paylinkId, txStatus: status.toUpperCase() };
    }
  }

  // Shape B: { id, paylink?/paylinkId?, meta: { transactionStatus } }
  const id = typeof body.id === "string" ? body.id : undefined;
  const paylinkId =
    typeof body.paylinkId === "string"
      ? (body.paylinkId as string)
      : typeof body.paylink === "string"
      ? (body.paylink as string)
      : undefined;
  const status =
    isRecord(body.meta) && typeof body.meta?.transactionStatus === "string"
      ? (body.meta.transactionStatus as string)
      : "";

  if (id && paylinkId) {
    return { helioTxId: id, paylinkId, txStatus: status.toUpperCase() };
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Handler
// ───────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Auth (with reasoned logging)
  const auth = isAuthorized(req);
  if (!auth.ok) {
    if (DEBUG) console.error("[webhook] 401 Unauthorized. reason:", auth.reason);
    return NextResponse.json({ error: "Unauthorized", reason: auth.reason }, { status: 401 });
  }
  if (DEBUG) console.log("[webhook] auth ok via:", auth.reason);

  try {
    // Parse body
    let body: HelioIncoming;
    try {
      body = (await req.json()) as HelioIncoming;
    } catch {
      if (DEBUG) console.error("[webhook] 400 invalid_json");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = parseHelioPayload(body);
    if (!parsed) {
      if (DEBUG) console.error("[webhook] 400 invalid_payload_shape:", body);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { helioTxId, paylinkId, txStatus } = parsed;
    if (DEBUG) console.log("[webhook] parsed:", { helioTxId, paylinkId, txStatus });

    // DB updates
    const db = await getDb();
    const payment = await db.collection("payments").findOne({ helio_paylink_id: paylinkId });

    if (!payment) {
      if (DEBUG) console.error("[webhook] payment_not_found for paylinkId:", paylinkId);
      // 200 to prevent infinite retries; you can handle manual replay later
      return NextResponse.json({ ok: false, reason: "payment_not_found" });
    }

    const mapped: "pending" | "completed" | "failed" =
      txStatus === "SUCCESS" ? "completed" : txStatus === "FAILED" ? "failed" : "pending";

    await db.collection("payments").updateOne(
      { _id: new ObjectId(payment._id) },
      { $set: { status: mapped, helio_tx_id: helioTxId, updated_at: new Date() } }
    );

    if (mapped === "completed") {
      await db.collection("portfolios").updateOne(
        { _id: new ObjectId(payment.portfolio_id) },
        { $set: { is_published: true, published_at: new Date() } }
      );
      if (DEBUG) console.log("[webhook] portfolio published for payment:", String(payment._id));
    }

    return NextResponse.json({ ok: true, status: mapped });
  } catch (err) {
    console.error("[webhook] 500 error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
