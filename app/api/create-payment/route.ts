// app/api/create-payment/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PaymentPayload {
  helioChargeId: string;
  portfolioId: string;
  username: string;
  amount: number;
  currency: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1) Parse JSON safely
    const body: Partial<PaymentPayload> = await request.json().catch(() => {
      throw new Error("Invalid JSON payload");
    });

    const { helioChargeId, portfolioId, username, amount, currency } = body;

    // 2) Basic validation
    if (!helioChargeId || !portfolioId || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3) Connect to DB at request-time (not build-time)
    const db = await getDb();

    const paymentDoc = {
      hel_payment_id: helioChargeId,
      portfolio_id: portfolioId,
      portfolio_username: username,
      amount: amount ?? 0,
      currency: currency ?? "USD",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    await db.collection("payments").insertOne(paymentDoc);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving pending payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
