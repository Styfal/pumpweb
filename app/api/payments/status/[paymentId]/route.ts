// app/api/payments/status/[paymentId]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

function toISO(d?: Date | string | null) {
  if (!d) return null
  return typeof d === "string" ? new Date(d).toISOString() : d.toISOString()
}

// ---- Typed Mongo schemas ----
type PaymentDoc = {
  _id: ObjectId
  id?: string
  status: string
  amount: number
  currency: string
  verified_at?: Date | string | null
  portfolio_username?: string
  portfolio_id?: string
}

type PortfolioDoc = {
  _id: ObjectId
  username: string
  token_name?: string
  is_published?: boolean
}

// ---- Union for the $or query ----
type PaymentQuery = { id: string } | { _id: ObjectId }

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ paymentId: string }> }
) {
  try {
    // Await the params
    const { paymentId } = await context.params
    const db = await getDb()

    const paymentsCol = db.collection<PaymentDoc>("payments")
    const portfoliosCol = db.collection<PortfolioDoc>("portfolios")

    // Match either custom string id or Mongo _id
    const or: PaymentQuery[] = [{ id: paymentId }]
    if (ObjectId.isValid(paymentId)) {
      or.push({ _id: new ObjectId(paymentId) })
    }

    const payment = await paymentsCol.findOne(
      { $or: or },
      {
        projection: {
          id: 1,
          status: 1,
          amount: 1,
          currency: 1,
          verified_at: 1,
          portfolio_username: 1,
          portfolio_id: 1,
        },
      }
    )

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Narrowed type for the response shape
    let portfolio:
      | { username: string; token_name?: string; is_published?: boolean; url: string | null }
      | null = null

    if (payment.portfolio_username) {
      // Fetch by username
      const p = await portfoliosCol.findOne(
        { username: payment.portfolio_username },
        { projection: { username: 1, token_name: 1, is_published: 1 } }
      )
      if (p) {
        portfolio = {
          username: p.username,
          token_name: p.token_name,
          is_published: p.is_published,
          url: p.is_published ? `/portfolio/${p.username}` : null,
        }
      }
    } else if (payment.portfolio_id && ObjectId.isValid(payment.portfolio_id)) {
      // Or by ObjectId
      const p = await portfoliosCol.findOne(
        { _id: new ObjectId(payment.portfolio_id) },
        { projection: { username: 1, token_name: 1, is_published: 1 } }
      )
      if (p) {
        portfolio = {
          username: p.username,
          token_name: p.token_name,
          is_published: p.is_published,
          url: p.is_published ? `/portfolio/${p.username}` : null,
        }
      }
    }

    return NextResponse.json({
      payment: {
        id: payment.id ?? payment._id.toString(),
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        verified_at: toISO(payment.verified_at ?? null),
        portfolio,
      },
    })
  } catch (error) {
    console.error("[payments] Payment status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}