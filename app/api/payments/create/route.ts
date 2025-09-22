// app/api/payments/create/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
// (If you don't have this util, remove or inline your own username validator)
import { validateUsername } from "@/lib/portfolio-utils";

type CreatePaymentRequest = {
  portfolioData: {
    username: string;
    token_name: string;
    ticker?: string;
    contract_address?: string;
    slogan?: string;
    description?: string;
    template: string;
    logo_url?: string;
    banner_url?: string;
    twitter_url?: string;
    telegram_url?: string;
    website_url?: string;
  };
  amount: number;
  currency?: string;
};

type HelioChargeResponse = {
  checkoutUrl?: string;
  url?: string;
  id?: string;
  [key: string]: unknown; // fallback for any other fields
};

function envOrThrow(k: string) {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreatePaymentRequest = await req.json();
    const { portfolioData, amount, currency = "USD" } = body;

    if (!portfolioData || !portfolioData.username || !portfolioData.token_name) {
      return NextResponse.json({ error: "Missing portfolioData.username/token_name" }, { status: 400 });
    }
    if (typeof amount !== "number" || !(amount > 0)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (validateUsername && !validateUsername(portfolioData.username)) {
      return NextResponse.json(
        { error: "Username must be 3-30 chars, alphanumeric + hyphens only" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Ensure unique username
    const existing = await db.collection("portfolios").findOne({ username: portfolioData.username });
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    // 1) Create portfolio (unpublished)
    const portfolioRes = await db.collection("portfolios").insertOne({
      ...portfolioData,
      is_published: false,
      created_at: new Date(),
    });
    const portfolioId = portfolioRes.insertedId as ObjectId;

    // 2) Create payment doc (pending)
    const helioPaylinkId = envOrThrow("HELIO_PAYLINK_ID");
    const paymentRes = await db.collection("payments").insertOne({
      portfolio_id: portfolioId,
      amount,
      currency,
      status: "pending",
      helio_paylink_id: helioPaylinkId,
      created_at: new Date(),
    });
    const paymentId = paymentRes.insertedId as ObjectId;

    // 3) Create a Helio charge with additionalJSON
    const HELIO_API_KEY = envOrThrow("HELIO_API_KEY");

    const helioResp = await fetch("https://api.hel.io/v1/paylink/charges", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HELIO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paylinkId: helioPaylinkId,
        amount,
        currency,
        additionalJSON: {
          paymentId: String(paymentId),
          portfolioId: String(portfolioId),
          username: portfolioData.username,
        },
      }),
    });

    if (!helioResp.ok) {
      // rollback to avoid orphan docs
      await db.collection("payments").deleteOne({ _id: paymentId });
      await db.collection("portfolios").deleteOne({ _id: portfolioId });
      const txt = await helioResp.text().catch(() => "");
      return NextResponse.json(
        { error: "Failed to create Helio charge", detail: txt || helioResp.statusText },
        { status: 502 }
      );
    }

    const charge: HelioChargeResponse = await helioResp.json().catch(() => ({}));

    const payment_url =
      charge.checkoutUrl ||
      charge.url ||
      `https://app.hel.io/pay/${helioPaylinkId}`;

    // 4) Respond to client
    return NextResponse.json({
      success: true,
      payment: {
        id: String(paymentId),
        portfolio_id: String(portfolioId),
        username: portfolioData.username,
        payment_url,
        amount,
        currency,
        status: "pending",
      },
    });
  } catch (err) {
    console.error("[payments/create] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
