// app/api/webhooks/helio/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

function isAuthorized(req: NextRequest): { ok: boolean; reason?: string } {
  const secret = (process.env.HELIO_WEBHOOK_SECRET ?? "").trim();
  if (!secret) return { ok: false, reason: "env_secret_missing" };
  const auth = (req.headers.get("authorization") ?? "").trim();
  const xToken = (req.headers.get("x-helio-token") ?? "").trim();
  if (auth.toLowerCase().startsWith("bearer ") && auth.slice(7).trim() === secret) return { ok: true };
  if (xToken && xToken === secret) return { ok: true };
  return { ok: false, reason: "no_or_mismatch_token" };
}

type HelioPayload = {
  event?: string;
  transactionObject?: {
    id?: string;
    paylinkId?: string;
    meta?: {
      transactionStatus?: string;
      amount?: string;
      [k: string]: unknown;
    };
    additionalJSON?: Record<string, unknown>;
    [k: string]: unknown;
  };
  // sometimes Helio includes stringified JSON
  transaction?: string;
  // sometimes Helio puts this at the top level
  additionalJSON?: Record<string, unknown>;
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
  const auth = isAuthorized(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized", reason: auth.reason }, { status: 401 });

  try {
    // Parse payload
    const body = (await req.json()) as HelioPayload;

    // If Helio duplicated as string: parse it
    if (!body.transactionObject && body.transaction) {
      try {
        const parsed = JSON.parse(body.transaction);
        if (isRec(parsed)) body.transactionObject = parsed as HelioPayload["transactionObject"];
      } catch { /* ignore */ }
    }

    const txObj = body.transactionObject || {};
    const helioTxId = typeof txObj.id === "string" ? txObj.id : null;
    const paylinkId = typeof txObj.paylinkId === "string" ? txObj.paylinkId : null;
    const helioStatus = (txObj.meta?.transactionStatus && String(txObj.meta.transactionStatus)) || "";
    const mapped = toAppStatus(helioStatus);

    // Prefer additionalJSON from any known spot
    const addl =
      (isRec(body.additionalJSON) && body.additionalJSON) ||
      (isRec(txObj.additionalJSON) && txObj.additionalJSON) ||
      null;

    const paymentIdStr = addl && typeof addl.paymentId === "string" ? addl.paymentId : null;
    const portfolioIdStr = addl && typeof addl.portfolioId === "string" ? addl.portfolioId : null;

    const db = await getDb();

    // Update payment (idempotent: only change if status differs)
    let updatedPaymentId: ObjectId | null = null;

    if (paymentIdStr && ObjectId.isValid(paymentIdStr)) {
      const pid = new ObjectId(paymentIdStr);
      const res = await db.collection("payments").findOneAndUpdate(
        { _id: pid, status: { $ne: mapped } },
        { $set: { status: mapped, helio_tx_id: helioTxId, updated_at: new Date() } },
        { returnDocument: "after" }
      );
      updatedPaymentId = pid;
      if (!res || !res.value) {
        // Nothing changed (already that status) — still ensure tx id is saved
        await db.collection("payments").updateOne(
          { _id: pid, helio_tx_id: { $ne: helioTxId } },
          { $set: { helio_tx_id: helioTxId, updated_at: new Date() } }
        );
      }
    } else if (paylinkId) {
      // Fallback: most recent pending payment for this paylink
      const pending = await db
        .collection("payments")
        .find({ helio_paylink_id: paylinkId, status: "pending" })
        .sort({ created_at: -1 })
        .limit(1)
        .toArray();

      if (pending[0]?._id) {
        updatedPaymentId = pending[0]._id as ObjectId;
        await db.collection("payments").updateOne(
          { _id: updatedPaymentId },
          { $set: { status: mapped, helio_tx_id: helioTxId, updated_at: new Date() } }
        );
      } else {
        console.warn("[helio webhook] No pending payment found for paylink:", paylinkId);
      }
    }

    // Publish portfolio on success (avoid re-wrapping ObjectId)
    if (mapped === "completed") {
      if (portfolioIdStr && ObjectId.isValid(portfolioIdStr)) {
        await db.collection("portfolios").updateOne(
          { _id: new ObjectId(portfolioIdStr) },
          { $set: { is_published: true, published_at: new Date() } }
        );
      } else if (updatedPaymentId) {
        const pmt = await db.collection("payments").findOne({ _id: updatedPaymentId });
        const portfolio_id = pmt?.portfolio_id as ObjectId | undefined;
        if (portfolio_id instanceof ObjectId) {
          await db.collection("portfolios").updateOne(
            { _id: portfolio_id },
            { $set: { is_published: true, published_at: new Date() } }
          );
        }
      } else if (paylinkId) {
        // Last resort: derive via latest updated payment on this paylink
        const pmt = await db
          .collection("payments")
          .find({ helio_paylink_id: paylinkId })
          .sort({ updated_at: -1, created_at: -1 })
          .limit(1)
          .toArray();
        const portfolio_id = pmt[0]?.portfolio_id as ObjectId | undefined;
        if (portfolio_id instanceof ObjectId) {
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
