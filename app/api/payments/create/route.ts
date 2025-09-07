import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { type NextRequest, NextResponse } from "next/server"
import { validateUsername } from "@/lib/portfolio-utils"

interface CreatePaymentRequest {
  portfolioData: {
    username: string
    token_name: string
    ticker?: string
    contract_address?: string
    slogan?: string
    description?: string
    template: string
    logo_url?: string
    banner_url?: string
    twitter_url?: string
    telegram_url?: string
    website_url?: string
  }
  amount: number
  currency?: string
  helioChargeId?: string // <--- Added here
}

// Helper to safely get env variables
function requireEnv(key: string): string {
  const value = process.env[key]
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing required env variable: ${key}`)
  return value.trim()
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json()
    const { portfolioData, amount, currency = "USD", helioChargeId } = body

    // Validate required fields
    if (
      !portfolioData ||
      !portfolioData.username ||
      !portfolioData.token_name ||
      typeof amount !== "number" ||
      amount <= 0
    ) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 })
    }

    // Validate username format
    if (!validateUsername(portfolioData.username)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters, alphanumeric and hyphens only" },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Check if username is already taken
    const existingPortfolio = await db.collection("portfolios").findOne({ username: portfolioData.username })
    if (existingPortfolio) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }

    // Create portfolio record (unpublished)
    const portfolioInsert = await db.collection("portfolios").insertOne({
      ...portfolioData,
      is_published: false,
      created_at: new Date(),
    })

    if (!portfolioInsert.insertedId) {
      return NextResponse.json({ error: "Failed to create portfolio" }, { status: 500 })
    }

    const portfolio = await db.collection("portfolios").findOne({ _id: portfolioInsert.insertedId })
    if (!portfolio) {
      return NextResponse.json({ error: "Failed to fetch created portfolio" }, { status: 500 })
    }

    // Create payment record with helioChargeId
    const paymentInsert = await db.collection("payments").insertOne({
      portfolio_id: portfolio._id,
      portfolio_username: portfolio.username,
      hel_payment_id: helioChargeId ?? null,
      amount,
      currency,
      status: "pending",
      created_at: new Date().toISOString(),
    })

    if (!paymentInsert.insertedId) {
      await db.collection("portfolios").deleteOne({ _id: portfolio._id })
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
    }

    const payment = await db.collection("payments").findOne({ _id: paymentInsert.insertedId })
    if (!payment) {
      await db.collection("portfolios").deleteOne({ _id: portfolio._id })
      await db.collection("payments").deleteOne({ _id: paymentInsert.insertedId })
      return NextResponse.json({ error: "Failed to fetch created payment" }, { status: 500 })
    }

    // Generate Helio Pay URL (fallback)
    const helioPaylinkId = requireEnv("HELIO_PAYLINK_ID")
    const helioPaymentUrl = `https://app.hel.io/pay/${helioPaylinkId}`

    await db.collection("payments").updateOne(
      { _id: payment._id },
      { $set: { payment_url: helioPaymentUrl } }
    )

    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id.toString(),
        portfolio_id: portfolio._id.toString(),
        username: portfolio.username,
        hel_payment_id: helioChargeId ?? null,
        payment_url: helioPaymentUrl,
        amount,
        currency,
        status: "pending",
      },
    })
  } catch (error) {
    console.error("[v0] Payment creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
