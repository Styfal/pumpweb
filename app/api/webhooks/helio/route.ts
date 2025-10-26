// this file handles incoming webhooks from Helio.io to update payment statuses in our database.
// It verifies the request using a secret token, parses the payload to extract payment information,
// and updates the payment status in Mongo, and publishes the associated portfolio if the payment is completed.
// The specific structure can be seen in Helio Payload which includes the additional JSON to accurately mark completed transactions based on the registered payment ID.
// That happens in line 92 and onwards with additional error handling such as wrong or missing payment IDs and tokens (which happened when there was an issue with Helio)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

function isAuthorized(req: NextRequest): { ok: boolean; reason?: string } {
  const secret = (process.env.HELIO_WEBHOOK_SECRET ?? "").trim();
  if (!secret) return { ok: false, reason: "env_secret_missing" };
  const auth = (req.headers.get("authorization") ?? "").trim();
  if (auth.toLowerCase().startsWith("bearer ") && auth.slice(7).trim() === secret) {
    return { ok: true };
  }
  return { ok: false, reason: "no_or_mismatch_token" };
}

type HelioPayload = {
  event?: string;
  transactionObject?: {
    id?: string;
    paylinkId?: string;
    meta?: { transactionStatus?: string };
    additionalJSON?: string | Record<string, unknown>;
  };
  transaction?: string;
  additionalJSON?: string | Record<string, unknown>;
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
  const auth = isAuthorized(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized", reason: auth.reason }, { status: 401 });
  }

  try {
    const body = (await req.json()) as HelioPayload;

    // Fallback if payload is stringified
    if (!body.transactionObject && body.transaction) {
      try {
        const parsed = JSON.parse(body.transaction);
        if (isRec(parsed)) body.transactionObject = parsed as HelioPayload["transactionObject"];
      } catch {}
    }

    const txObj = body.transactionObject || {};
    const helioTxId = typeof txObj.id === "string" ? txObj.id : null;
    const paylinkId = typeof txObj.paylinkId === "string" ? txObj.paylinkId : null;
    const helioStatus = String(txObj.meta?.transactionStatus ?? "");
    const mapped = toAppStatus(helioStatus);

    // Parse additionalJSON safely
    let addl: Record<string, unknown> | null = null;
    const rawAddl = txObj.additionalJSON ?? body.additionalJSON;
    if (typeof rawAddl === "string") {
      try { addl = JSON.parse(rawAddl); } catch {}
    } else if (isRec(rawAddl)) {
      addl = rawAddl;
    }

    const paymentIdStr = addl && typeof addl.paymentId === "string" ? addl.paymentId : null;
    const portfolioIdStr = addl && typeof addl.portfolioId === "string" ? addl.portfolioId : null;

    const db = await getDb();

    // Update payment
    if (paymentIdStr && ObjectId.isValid(paymentIdStr)) {
      const pid = new ObjectId(paymentIdStr);
      await db.collection("payments").updateOne(
        { _id: pid },
        { $set: { status: mapped, helio_tx_id: helioTxId, updated_at: new Date() } }
      );

      // Publish portfolio if completed
      if (mapped === "completed") {
        const targetPortfolioId = portfolioIdStr && ObjectId.isValid(portfolioIdStr)
          ? new ObjectId(portfolioIdStr)
          : (await db.collection("payments").findOne({ _id: pid }))?.portfolio_id;
        if (targetPortfolioId) {
          await db.collection("portfolios").updateOne(
            { _id: targetPortfolioId },
            { $set: { is_published: true, published_at: new Date() } }
          );
        }
      }
    } else if (paylinkId) {
      // Fallback: update latest pending payment for this paylink
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
        if (mapped === "completed") {
          await db.collection("portfolios").updateOne(
            { _id: pending[0].portfolio_id },
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
