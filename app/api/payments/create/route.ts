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
}

// Helper to safely get env variables
function requireEnv(key: string): string {
  const value = process.env[key]
  if (typeof value !== "string" || !value.trim()) {
    console.error(`Missing required env variable: ${key}`)
    throw new Error(`Missing required env variable: ${key}`)
  }
  return value.trim()
}

export async function POST(request: NextRequest) {
  try {
    // Add more detailed logging
    console.log("POST /api/payments/create - Starting request")
    
    const body: CreatePaymentRequest = await request.json()
    console.log("Request body received:", { ...body, portfolioData: { ...body.portfolioData } })
    
    const { portfolioData, amount, currency = "USD" } = body

    // Validate required fields
    if (
      !portfolioData ||
      !portfolioData.username ||
      !portfolioData.token_name ||
      typeof amount !== "number" ||
      amount <= 0
    ) {
      console.error("Validation failed:", { portfolioData, amount })
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 })
    }

    // Validate username format
    if (!validateUsername(portfolioData.username)) {
      console.error("Username validation failed:", portfolioData.username)
      return NextResponse.json(
        { error: "Username must be 3-30 characters, alphanumeric and hyphens only" },
        { status: 400 }
      )
    }

    console.log("Connecting to database...")
    const db = await getDb()
    console.log("Database connected successfully")

    // Check if username is already taken
    const existingPortfolio = await db.collection("portfolios").findOne({ username: portfolioData.username })
    if (existingPortfolio) {
      console.error("Username already taken:", portfolioData.username)
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }

    // Create portfolio record (unpublished)
    console.log("Creating portfolio...")
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

    // Create payment record
    const paymentInsert = await db.collection("payments").insertOne({
      portfolio_id: portfolio._id,
      amount,
      currency,
      status: "pending",
      created_at: new Date(),
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

    // Check environment variables early
    console.log("Checking environment variables...")
    try {
      const helioPaylinkId = requireEnv("HELIO_PAYLINK_ID")
      const helioPaymentUrl = `https://app.hel.io/pay/${helioPaylinkId}`

      await db.collection("payments").updateOne(
        { _id: payment._id },
        { $set: { payment_url: helioPaymentUrl } }
      )

      console.log("Payment created successfully")
      return NextResponse.json({
        success: true,
        payment: {
          id: payment._id.toString(),
          portfolio_id: portfolio._id.toString(),
          username: portfolio.username,
          payment_url: helioPaymentUrl,
          amount,
          currency,
          status: "pending",
        },
      })
    } catch (envError) {
      console.error("Environment variable error:", envError)
      // Clean up created records
      await db.collection("payments").deleteOne({ _id: payment._id })
      await db.collection("portfolios").deleteOne({ _id: portfolio._id })
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Payment creation error:", error)
    console.error("Error stack:", (error as Error)?.stack)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Dummy function to create web design path (replace with your actual logic)
async function createWebDesignPath(portfolioId: string) {
  const db = await getDb()
  await db.collection("portfolios").updateOne(
    { _id: new ObjectId(portfolioId) },
    { $set: { is_published: true, published_at: new Date() } }
  )
}

export async function PUT(request: NextRequest) {
  try {
    const sharedToken = requireEnv("HELIO_SHARED_TOKEN")
    const helioToken = request.headers.get("x-helio-token")?.trim()
    
    if (!helioToken || helioToken !== sharedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payment_id, status } = await request.json()
    
    if (!payment_id || typeof payment_id !== "string" || !status) {
      return NextResponse.json({ error: "Missing or invalid payment_id or status" }, { status: 400 })
    }

    const db = await getDb()
    let payment;

    try {
      payment = await db.collection("payments").findOneAndUpdate(
        { _id: new ObjectId(payment_id) },
        { $set: { status, updated_at: new Date() } },
        { returnDocument: "after" }
      )
    } catch (err) {
      console.error("[v0] Invalid payment_id format:", err)
      return NextResponse.json({ error: "Invalid payment_id format" }, { status: 400 })
    }

    if (!payment?.value) {
      return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 })
    }

    if (status === "completed") {
      await createWebDesignPath(payment.value.portfolio_id.toString())
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Payment status update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
