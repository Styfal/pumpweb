export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";

function envOrThrowTrim(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env ${key}`);
  return v.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolioData, amount, currency = "USD" } = body;

    if (!portfolioData?.username || !portfolioData?.token_name) {
      return NextResponse.json({ error: "Missing portfolio data" }, { status: 400 });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const db = await getDb();

    // Ensure unique username
    const existing = await db.collection("portfolios").findOne({ username: portfolioData.username });
    if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

    // 1) Create portfolio (unpublished)
    const portfolioRes = await db.collection("portfolios").insertOne({
      ...portfolioData,
      is_published: false,
      created_at: new Date(),
    });
    const portfolioId = portfolioRes.insertedId as ObjectId;

    // 2) Create payment (pending)
    const HELIO_PAYLINK_ID = envOrThrowTrim("HELIO_PAYLINK_ID");
    const paymentRes = await db.collection("payments").insertOne({
      portfolio_id: portfolioId,
      amount,
      currency,
      status: "pending",
      helio_paylink_id: HELIO_PAYLINK_ID,
      created_at: new Date(),
    });
    const paymentId = paymentRes.insertedId as ObjectId;

    // 3) Create Helio charge (mirrors your Postman request)
    const HELIO_SECRET = envOrThrowTrim("HELIO_API_KEY_SECRET"); // Bearer
    const HELIO_PUBLIC = envOrThrowTrim("HELIO_API_KEY_PUBLIC"); // Query param

    const helioResp = await fetch(
      `https://api.hel.io/v1/charge/api-key?apiKey=${HELIO_PUBLIC}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HELIO_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentRequestId: HELIO_PAYLINK_ID,
          prepareRequestBody: {
            customerDetails: {
              additionalJSON: JSON.stringify({
                paymentId: String(paymentId),
                portfolioId: String(portfolioId),
                username: portfolioData.username,
              }),
            },
          },
        }),
      }
    );

    if (!helioResp.ok) {
      const txt = await helioResp.text().catch(() => "");
      console.error("[helio error]", helioResp.status, txt);

      // rollback to avoid orphan docs
      await db.collection("payments").deleteOne({ _id: paymentId });
      await db.collection("portfolios").deleteOne({ _id: portfolioId });

      return NextResponse.json(
        { error: "Failed to create Helio charge", detail: txt || helioResp.statusText },
        { status: 502 }
      );
    }

    const charge = await helioResp.json().catch(() => ({}));
    const payment_url = charge.pageUrl || `https://app.hel.io/pay/${HELIO_PAYLINK_ID}`;

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
