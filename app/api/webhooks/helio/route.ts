export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

// ───────────────────────────────────────────────────────────────────────────────
// Types for Helio webhook payloads
// Helio sometimes sends one of two shapes. We support both.
// ───────────────────────────────────────────────────────────────────────────────
type HelioTxMeta = {
  transactionStatus?: string;
};

type HelioTxObject = {
  id: string;
  paylinkId?: string;
  meta?: HelioTxMeta;
};

type HelioShapeA = {
  event?: string;
  transactionObject?: HelioTxObject;
};

type HelioShapeB = {
  id: string;
  paylink?: string;
  paylinkId?: string;
  meta?: HelioTxMeta;
};

type HelioIncoming = HelioShapeA | HelioShapeB;

type ParsedHelio = {
  helioTxId: string;
  paylinkId: string;
  txStatus: string; // already uppercased
};

// ───────────────────────────────────────────────────────────────────────────────
// Auth helper: Authorization: Bearer <HELIO_WEBHOOK_SECRET>
// Optionally also accept x-helio-token if you want.
// ───────────────────────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.HELIO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] Missing HELIO_WEBHOOK_SECRET env");
    return false;
  }

  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim() === secret;
  }

  // Optional fallback if you also configured x-helio-token in Helio
  const xHelio = req.headers.get("x-helio-token");
  if (xHelio?.trim()) {
    return xHelio.trim() === secret;
  }

  return false;
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
  const maybeTxObj = isRecord(body.transactionObject) ? body.transactionObject : null;
  const aId = typeof maybeTxObj?.id === "string" ? maybeTxObj.id : undefined;
  const aPaylinkId =
    typeof maybeTxObj?.paylinkId === "string" ? maybeTxObj.paylinkId : undefined;
  const aStatusRaw =
    isRecord(maybeTxObj?.meta) && typeof maybeTxObj?.meta?.transactionStatus === "string"
      ? maybeTxObj.meta.transactionStatus
      : undefined;

  if (aId && aPaylinkId) {
    return {
      helioTxId: aId,
      paylinkId: aPaylinkId,
      txStatus: (aStatusRaw || "").toUpperCase(),
    };
  }

  // Shape B: { id, paylink?/paylinkId?, meta: { transactionStatus } }
  const bId = typeof body.id === "string" ? body.id : undefined;
  const bPaylink =
    typeof body.paylinkId === "string"
      ? (body.paylinkId as string)
      : typeof body.paylink === "string"
      ? (body.paylink as string)
      : undefined;
  const bStatusRaw =
    isRecord(body.meta) && typeof body.meta?.transactionStatus === "string"
      ? (body.meta.transactionStatus as string)
      : undefined;

  if (bId && bPaylink) {
    return {
      helioTxId: bId,
      paylinkId: bPaylink,
      txStatus: (bStatusRaw || "").toUpperCase(),
    };
  }

  return null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Handler
// ───────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as HelioIncoming;
    const parsed = parseHelioPayload(body);

    if (!parsed) {
      console.error("[webhook] Invalid Helio payload shape:", body);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { helioTxId, paylinkId, txStatus } = parsed;
    console.log("[webhook] Received:", { helioTxId, paylinkId, txStatus });

    const db = await getDb();

    // Find the payment created by /api/payments/create using stored helio_paylink_id
    const payment = await db.collection("payments").findOne({ helio_paylink_id: paylinkId });
    if (!payment) {
      console.error("[webhook] Payment not found for paylinkId:", paylinkId);
      // 200 to avoid endless retries; you can manually replay from Helio later
      return NextResponse.json({ ok: false, reason: "payment_not_found" });
    }

    // Map Helio status → our status
    const newStatus: "pending" | "completed" | "failed" =
      txStatus === "SUCCESS" ? "completed" : txStatus === "FAILED" ? "failed" : "pending";

    await db.collection("payments").updateOne(
      { _id: new ObjectId(payment._id) },
      { $set: { status: newStatus, helio_tx_id: helioTxId, updated_at: new Date() } }
    );

    if (newStatus === "completed") {
      await db.collection("portfolios").updateOne(
        { _id: new ObjectId(payment.portfolio_id) },
        { $set: { is_published: true, published_at: new Date() } }
      );
      console.log("[webhook] Published portfolio for payment:", String(payment._id));
    }

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err: unknown) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
