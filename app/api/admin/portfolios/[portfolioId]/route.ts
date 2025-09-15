// app/api/portfolios/[portfolioId]/route.ts
import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId, type Filter } from "mongodb"

// ---- Typed Mongo schema for this collection ----
type PortfolioDoc = {
  _id: ObjectId
  id?: string                 // if you also keep a custom string id
  username: string
  token_name?: string
  is_published?: boolean
  updated_at?: Date
  // add any other fields you actually store...
}

// Helper: build a typed $or filter for id or _id
function parseId(portfolioId: string): Filter<PortfolioDoc> {
  const or: Filter<PortfolioDoc>[] = [{ id: portfolioId }]
  if (ObjectId.isValid(portfolioId)) {
    or.push({ _id: new ObjectId(portfolioId) })
  }
  return { $or: or }
}

function isAuthorized(req: Request) {
  const expected = process.env.ADMIN_ACCESS_KEY
  if (!expected) return false
  const authHeader = req.headers.get("authorization")
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "")
  const headerKey = req.headers.get("x-admin-access-key") ?? bearerToken
  return headerKey === expected
}

// Updated RouteContext with Promise<params>
type RouteContext = { params: Promise<{ portfolioId: string }> }

// PATCH /api/portfolios/[portfolioId]
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Await the params
    const { portfolioId } = await params
    const body = (await request.json()) as Partial<PortfolioDoc>

    const db = await getDb()
    const portfolios = db.collection<PortfolioDoc>("portfolios")

    const res = await portfolios.updateOne(
      parseId(portfolioId),
      {
        $set: {
          ...body,
          updated_at: new Date(), // store as Date; format to ISO in UI if needed
        },
      }
    )

    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Portfolio update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/portfolios/[portfolioId]
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Await the params
    const { portfolioId } = await params
    const db = await getDb()
    const portfolios = db.collection<PortfolioDoc>("portfolios")

    const res = await portfolios.deleteOne(parseId(portfolioId))

    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Portfolio deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}