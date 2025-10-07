// app/api/payments/status/[paymentId]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type PaymentDoc = {
  _id: ObjectId;
  status: "pending" | "completed" | "failed" | string;
  amount: number;
  currency: string;
  portfolio_id: ObjectId;
  helio_paylink_id?: string;
  helio_tx_id?: string;
  verified_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
};

type PortfolioDoc = {
  _id: ObjectId;
  username: string;
  token_name?: string;
  is_published?: boolean;
  created_at?: Date;
  published_at?: Date;
};

export async function GET(req: NextRequest) {
  try {
    // Extract the last path segment as paymentId
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const paymentId = segments[segments.length - 1];

    if (!paymentId || !ObjectId.isValid(paymentId)) {
      return NextResponse.json({ error: "Invalid payment id" }, { status: 400 });
    }

    const db = await getDb();
    const paymentsCol = db.collection<PaymentDoc>("payments");
    const portfoliosCol = db.collection<PortfolioDoc>("portfolios");

    const payment = await paymentsCol.findOne({ _id: new ObjectId(paymentId) });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const portfolio = await portfoliosCol.findOne(
      { _id: payment.portfolio_id },
      { projection: { username: 1, token_name: 1, is_published: 1 } }
    );

    const url =
      portfolio && portfolio.is_published ? `/${portfolio.username}` : null;

    // Always JSON; client (PaymentStatusComponent) handles redirect
    return NextResponse.json({
      payment: {
        id: payment._id.toString(),
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        helio_tx_id: payment.helio_tx_id ?? null,
        verified_at: payment.verified_at ? new Date(payment.verified_at).toISOString() : null,
        updated_at: payment.updated_at ? new Date(payment.updated_at).toISOString() : null,
        created_at: payment.created_at ? new Date(payment.created_at).toISOString() : null,
      },
      portfolio: portfolio
        ? {
            username: portfolio.username,
            token_name: portfolio.token_name ?? null,
            is_published: !!portfolio.is_published,
            url,
          }
        : null,
    });
  } catch (error) {
    console.error("[payments/status] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
