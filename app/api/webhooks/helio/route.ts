export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

// Accept both ways Helio may auth: Authorization: Bearer <token> OR x-helio-token: <token>
function isAuthorized(req: NextRequest): boolean {
  const bearer = req.headers.get("authorization");
  const xHelio = req.headers.get("x-helio-token");
  const secret = process.env.HELIO_WEBHOOK_SECRET || process.env.HELIO_SHARED_TOKEN; // support either env

  if (!secret) {
    console.error("[webhook] Missing HELIO_WEBHOOK_SECRET or HELIO_SHARED_TOKEN env");
    return false;
  }

  if (bearer?.startsWith("Bearer ")) {
    return bearer.substring(7).trim() === secret;
  }
  if (xHelio?.trim()) {
    return xHelio.trim() === secret;
  }
  return false;
}

// Extract a normalized object from the two payload shapes we've seen
function parseHelioPayload(body: any) {
  // Shape A (from your earlier log):
  // { event: 'CREATED' | '...', transactionObject: { id, paylinkId, meta: { transactionStatus } }, ... }
  if (body?.transactionObject?.id && body?.transactionObject?.paylinkId) {
    return {
      helioTxId: String(body.transactionObject.id),
      paylinkId: String(body.transactionObject.paylinkId),
      txStatus: String(body.transactionObject?.meta?.transactionStatus || "").toUpperCase(),
      raw: body,
    };
  }

  // Shape B (your original TS interface-like):
  // { id, paylink, meta: { transactionStatus }, ... }
  if (body?.id && (body?.paylink || body?.paylinkId)) {
    return {
      helioTxId: String(body.id),
      paylinkId: String(body.paylinkId || body.paylink),
      txStatus: String(body?.meta?.transactionStatus || "").toUpperCase(),
      raw: body,
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = parseHelioPayload(body);
    if (!parsed) {
      console.error("[webhook] Invalid Helio payload shape:", body);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { helioTxId, paylinkId, txStatus } = parsed;
    console.log("[webhook] Received:", { helioTxId, paylinkId, txStatus });

    const db = await getDb();

    // Find payment by the PAYLINK ID we stored during creation
    const payment = await db.collection("payments").findOne({ helio_paylink_id: paylinkId });
    if (!payment) {
      console.error("[webhook] Payment not found for paylinkId:", paylinkId);
      // Return 200 so Helio doesn't hammer retries forever; we logged it server-side.
      return NextResponse.json({ ok: false, reason: "Payment not found" });
    }

    // Map status
    let newStatus: "pending" | "completed" | "failed" = "pending";
    if (txStatus === "SUCCESS") newStatus = "completed";
    else if (txStatus === "FAILED") newStatus = "failed";

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
  } catch (err) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
