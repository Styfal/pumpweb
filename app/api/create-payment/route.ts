// app/api/create-payment/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const db = await getDb()
    const body = await request.json()

    const {
      helioChargeId,
      portfolioId,
      username,
      amount,
      currency,
    }: {
      helioChargeId: string
      portfolioId: string
      username: string
      amount: number
      currency: string
    } = body

    if (!helioChargeId || !portfolioId || !username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const paymentDoc = {
      hel_payment_id: helioChargeId,
      portfolio_id: portfolioId,
      portfolio_username: username,
      amount,
      currency,
      status: "pending",
      created_at: new Date().toISOString(),
    }

    await db.collection("payments").insertOne(paymentDoc)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving pending payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
