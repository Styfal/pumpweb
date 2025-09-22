// app/api/webhooks/helio/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

/**
 * Auth strategy:
 * - Prefer a simple shared secret header to avoid HMAC complexity (which would require raw body).
 * - Accept either:
 *    Authorization: Bearer <HELIO_WEBHOOK_SECRET>
 *  or
 *    x-helio-token: <HELIO_WEBHOOK_SECRET> but for us,we only get that webhook secret. idk why we need x-token
 */
function isAuthorized(req: NextRequest): { ok: boolean; reason?: string } {
  const secret = (process.env.HELIO_WEBHOOK_SECRET ?? "").trim();
  if (!secret) return { ok: false, reason: "env_secret_missing" };

  const auth = (req.headers.get("authorization") ?? "").trim();
  const xToken = (req.headers.get("x-helio-token") ?? "").trim();

  if (auth.toLowerCase().startsWith("bearer ") && auth.slice(7).trim() === secret) {
    return { ok: true };
  }
  if (xToken && xToken === secret) {
    return { ok: true };
  }
  return { ok: false, reason: "no_or_mismatch_token" };
}

type HelioPayload = {
  event?: string; // e.g., "CREATED", etc.
  transactionObject?: {
    id?: string; // helio tx id
    paylinkId?: string;
    meta?: {
      transactionStatus?: string; // "SUCCESS"|"FAILED"|...
      amount?: string;
      [k: string]: unknown;
    };
    additionalJSON?: Record<string, unknown>; // echoed from your create call
    [k: string]: unknown;
  };
  // sometimes Helio includes a stringified JSON under "transaction"
  transaction?: string;
  [k: string]: unknown;
};

function toAppStatus(helioStatus: string): "pending" | "completed" | "failed" {
  const s = (helioStatus || "").toUpperCase();
  if (s === "SUCCESS" || s === "SUCCEEDED") return "completed";
  if (s === "FAILED" || s === "CANCELED" || s === "CANCELLED") return "failed";
  return "pending";
}

function isRec(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

export async function POST(req: NextRequest) {
  // 1) Simple auth
  const auth = isAuthorized(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized", reason: auth.reason }, { status: 401 });
  }

  try {
    // 2) Parse JSON payload
    const body = (await req.json()) as HelioPayload;

    // Helio sometimes duplicates payload under `transaction` (stringified)
    if (!body.transactionObject && body.transaction) {
      try {
        const parsed = JSON.parse(body.transaction);
        if (isRec(parsed)) {
          body.transactionObject = parsed as HelioPayload["transactionObject"];
        }
      } catch { /* ignore parse errors */ }
    }

    const txObj = body.transactionObject || {};
    const helioTxId = typeof txObj.id === "string" ? txObj.id : null;
    const paylinkId = typeof txObj.paylinkId === "string" ? txObj.paylinkId : null;
    const helioStatus =
      (txObj.meta?.transactionStatus && String(txObj.meta.transactionStatus)) || "";
    const mapped = toAppStatus(helioStatus);

    // 3) Prefer updates via additionalJSON (exact mapping)
    const addl = isRec(txObj.additionalJSON) ? (txObj.additionalJSON as Record<string, unknown>) : null;
    const paymentIdStr = addl && typeof addl.paymentId === "string" ? addl.paymentId : null;
    const portfolioIdStr = addl && typeof addl.portfolioId === "string" ? addl.portfolioId : null;

    const db = await getDb();

    // 3a) Update payments by our own paymentId if present
    if (paymentIdStr && ObjectId.isValid(paymentIdStr)) {
      await db.collection("payments").updateOne(
        { _id: new ObjectId(paymentIdStr) },
        { $set: { status: mapped, helio_tx_id: helioTxId, updated_at: new Date() } }
      );
    } else if (paylinkId) {
      // 3b) Fallback (webhook-only flow): find the most recent pending payment for this paylink
      const pending = await db
        .collection("payments")
        .find({ helio_paylink_id: paylinkId, status: "pending" })
        .sort({ created_at: -1 })
        .limit(1)
        .toArray();

      if (pending[0]?._id) {
        await db.collection("payments").updateOne(
          { _id: pending[0]._id },
          { $set: { status: mapped, helio_tx_id: helioTxId, updated_at: new Date() } }
        );
      } else {
        console.warn("[helio webhook] No pending payment found for paylink:", paylinkId);
      }
    }

    // 4) If completed, publish portfolio
    if (mapped === "completed") {
      if (portfolioIdStr && ObjectId.isValid(portfolioIdStr)) {
        await db.collection("portfolios").updateOne(
          { _id: new ObjectId(portfolioIdStr) },
          { $set: { is_published: true, published_at: new Date() } }
        );
      } else if (paymentIdStr && ObjectId.isValid(paymentIdStr)) {
        // derive via payment → portfolio
        const pmt = await db.collection("payments").findOne({ _id: new ObjectId(paymentIdStr) });
        if (pmt?.portfolio_id) {
          await db.collection("portfolios").updateOne(
            { _id: pmt.portfolio_id },
            { $set: { is_published: true, published_at: new Date() } }
          );
        }
      } else if (paylinkId) {
        // derive via most recent completed payment on this paylink (best-effort)
        const pmt = await db
          .collection("payments")
          .find({ helio_paylink_id: paylinkId })
          .sort({ updated_at: -1, created_at: -1 })
          .limit(1)
          .toArray();
        const portfolio_id = pmt[0]?.portfolio_id;
        if (portfolio_id) {
          await db.collection("portfolios").updateOne(
            { _id: portfolio_id },
            { $set: { is_published: true, published_at: new Date() } }
          );
        }
      }
    }

    return NextResponse.json({ ok: true, txId: helioTxId, status: mapped });
  } catch (err) {
    console.error("[helio webhook] 500 error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
