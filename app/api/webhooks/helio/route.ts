// app/api/helio-webhook/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"

interface HelioWebhookPayload {
  id: string
  paylink: string
  quantity: number
  createdAt: string
  type: string
  meta: {
    amount: number
    currency: string
    senderPublicKey: string
    recipientPublicKey: string
    customer: {
      country?: string
      address?: string
      email?: string
      fullName?: string
      phoneNumber?: string
      discord?: string
      twitter?: string
    }
    product: {
      id: string
      name: string
      description?: string
    }
    transactionSignature: string
    transactionStatus: "PENDING" | "SUCCESS" | "FAILED"
  }
  submitGeolocation?: string
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const authHeader = headersList.get("authorization")

    const expectedToken = process.env.HELIO_WEBHOOK_SECRET
    if (!expectedToken) {
      console.error("HELIO_WEBHOOK_SECRET not configured")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 })
    }

    const payload: HelioWebhookPayload = await request.json()
    console.log("[v1] Received Helio webhook:", payload.id, payload.meta.transactionStatus)

    const db = await getDb()

    // Step 1: Find matching payment in DB
    const payment = await db.collection("payments").findOne({ hel_payment_id: payload.id })

    if (!payment) {
      console.error("[v1] Payment not found for Helio ID:", payload.id)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Step 2: Update payment status
    let newStatus: "pending" | "completed" | "failed"
    let shouldPublishPortfolio = false

    switch (payload.meta.transactionStatus) {
      case "SUCCESS":
        newStatus = "completed"
        shouldPublishPortfolio = true
        break
      case "FAILED":
        newStatus = "failed"
        break
      default:
        newStatus = "pending"
    }

    await db.collection("payments").updateOne(
      { _id: new ObjectId(payment._id) },
      {
        $set: {
          status: newStatus,
          verified_at: newStatus === "completed" ? new Date().toISOString() : null,
        },
      }
    )

    // Step 3: If payment succeeded, publish matching portfolio
    if (shouldPublishPortfolio) {
      const portfolio = await db.collection("portfolios").findOne({
        payment_id: payment._id.toString(),
      })

      if (portfolio) {
        const result = await db.collection("portfolios").updateOne(
          { _id: portfolio._id },
          {
            $set: {
              is_published: true,
              updated_at: new Date().toISOString(),
            },
          }
        )

        if (result.modifiedCount > 0) {
          console.log("[v1] Portfolio published for payment_id:", payment._id.toString())
        } else {
          console.warn("[v1] Failed to publish portfolio for payment_id:", payment._id.toString())
        }
      } else {
        console.warn("[v1] No portfolio found with payment_id:", payment._id.toString())
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      published: shouldPublishPortfolio,
    })
  } catch (error) {
    console.error("[v1] Webhook processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
