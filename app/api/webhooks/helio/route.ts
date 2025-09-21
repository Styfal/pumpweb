export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.HELIO_WEBHOOK_SECRET;

    if (!expectedToken) {
      console.error("HELIO_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 });
    }

    const body = await request.json();
    const transaction = body.transactionObject;
    if (!transaction?.id || !transaction?.paylinkId) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    console.log(
      "[webhook] Received Helio webhook:",
      transaction.id,
      transaction.meta?.transactionStatus
    );

    const db = await getDb();

    // Find matching payment by stored helio_paylink_id
    const payment = await db
      .collection("payments")
      .findOne({ helio_paylink_id: transaction.paylinkId });

    if (!payment) {
      console.error("[webhook] Payment not found for paylinkId:", transaction.paylinkId);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    let newStatus: "pending" | "completed" | "failed" = "pending";
    if (transaction.meta?.transactionStatus === "SUCCESS") {
      newStatus = "completed";
    } else if (transaction.meta?.transactionStatus === "FAILED") {
      newStatus = "failed";
    }

    await db.collection("payments").updateOne(
      { _id: new ObjectId(payment._id) },
      {
        $set: {
          status: newStatus,
          helio_tx_id: transaction.id, // store transaction ID too
          updated_at: new Date(),
        },
      }
    );

    if (newStatus === "completed") {
      await db.collection("portfolios").updateOne(
        { _id: new ObjectId(payment.portfolio_id) },
        { $set: { is_published: true, published_at: new Date() } }
      );
      console.log("[webhook] Portfolio published for payment:", payment._id.toString());
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      published: newStatus === "completed",
    });
  } catch (error) {
    console.error("[webhook] Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
