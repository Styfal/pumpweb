
// app/api/create-payment/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";



interface PaymentPayload {
  helioChargeId: string;
  portfolioId: string;
  username: string;
  amount: number;
  currency: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/create-payment - Starting request");

    // 1) Parse JSON safely
    const body: Partial<PaymentPayload> = await request.json().catch((err) => {
      console.error("JSON parse error:", err);
      throw new Error("Invalid JSON payload");
  
    });


    console.log("Request body:", body);

    const { helioChargeId, portfolioId, username, amount, currency } = body;

    // 2) Basic validation
    if (!helioChargeId || !portfolioId || !username) {
      console.error("Missing required fields:", {
        helioChargeId,
        portfolioId,
        username,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3) Connect to DB at request-time (not build-time)
    console.log("Connecting to database...");
    const db = await getDb();
    console.log("Database connected successfully");

    const paymentDoc = {
      hel_payment_id: helioChargeId,
      portfolio_id: portfolioId,
      portfolio_username: username,
      amount: amount ?? 0,
      currency: currency ?? "USD",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    console.log("Inserting payment document:", paymentDoc);
    const result = await db.collection("payments").insertOne(paymentDoc);
    console.log("Payment inserted with ID:", result.insertedId);

    return NextResponse.json({ success: true, paymentId: result.insertedId });
  } catch (error) {
    console.error("Error saving pending payment:", error);
    console.error("Error stack:", (error as Error)?.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
