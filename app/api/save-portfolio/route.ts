import { NextResponse, type NextRequest } from "next/server"
import { getDb } from "@/lib/mongodb"
import { z } from "zod"

// Zod schema for validation
const portfolioSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9-]+$/),
  token_name: z.string().min(1).max(50),
  ticker: z.string().max(10).optional(),
  contract_address: z.string().optional(),
  slogan: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  twitter_url: z.string().url().optional(),
  telegram_url: z.string().url().optional(),
  website_url: z.string().url().optional(),
  template: z.enum(["modern", "classic"]),
  logo_url: z.string().nullable().optional(),
  banner_url: z.string().nullable().optional(),
  payment_id: z.string().optional(), // Will be used for webhook matching
})

export async function POST(request: NextRequest) {
  try {
    const db = await getDb()
    const body = await request.json()

    // Validate with Zod
    const parsed = portfolioSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid portfolio data", issues: parsed.error.format() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check for existing username
    const existing = await db.collection("portfolios").findOne({ username: data.username })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 409 }
      )
    }

    // Construct portfolio object
    const portfolio = {
      ...data,
      is_published: false, // Will be set true after webhook verification
      created_at: new Date(),
    }

    // Insert into MongoDB
    const result = await db.collection("portfolios").insertOne(portfolio)

    return NextResponse.json({
      success: true,
      portfolioId: result.insertedId.toString(),
      username: data.username,
    })
  } catch (error) {
    console.error("Error saving portfolio:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save portfolio" },
      { status: 500 }
    )
  }
}
