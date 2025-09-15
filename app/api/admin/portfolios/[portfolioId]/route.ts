// app/api/portfolios/[portfolioId]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId, Filter, Document } from "mongodb"

function parseId(portfolioId: string): { $or: Filter<Document>[] } {
  // allow either custom string id or Mongo _id
  const or: Filter<Document>[] = [{ id: portfolioId }]
  if (ObjectId.isValid(portfolioId)) {
    or.push({ _id: new ObjectId(portfolioId) })
  }
  return { $or: or }
}
function isAuthorized(req: NextRequest) {
  const expected = process.env.ADMIN_ACCESS_KEY
  if (!expected) return false
  const headerKey =
    req.headers.get("x-admin-access-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return headerKey === expected
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { portfolioId } = params
    const body = await request.json()

    const db = await getDb()
    const res = await db.collection("portfolios").updateOne(
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { portfolioId } = params
    const db = await getDb()

    const res = await db.collection("portfolios").deleteOne(parseId(portfolioId))

    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Portfolio deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
