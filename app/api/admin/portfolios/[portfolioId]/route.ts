// app/api/admin/portfolios/[portfolioId]/route.ts
import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId, type Filter } from "mongodb"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ---- Collection schema (adjust as needed) ----
type PortfolioDoc = {
  _id: ObjectId
  id?: string                // optional custom string id
  username?: string
  token_name?: string
  is_published?: boolean
  updated_at?: Date
  // ...add any other fields you store
}

// Updated RouteContext with Promise params
type RouteContext = { params: Promise<{ portfolioId: string }> }

// Build a typed $or filter for id or _id
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
  const headerKey =
    req.headers.get("x-admin-access-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return headerKey === expected
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Await the params
    const { portfolioId } = await params
    const update = (await request.json().catch(() => ({}))) as Partial<PortfolioDoc>
    if (!update || typeof update !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const db = await getDb()
    const col = db.collection<PortfolioDoc>("portfolios")

    const res = await col.updateOne(parseId(portfolioId), {
      $set: { ...update, updated_at: new Date() },
    })

    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, modified: res.modifiedCount })
  } catch (e) {
    console.error("PATCH /admin/portfolios error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Await the params
    const { portfolioId } = await params
    const db = await getDb()
    const col = db.collection<PortfolioDoc>("portfolios")

    const res = await col.deleteOne(parseId(portfolioId))

    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, deleted: res.deletedCount })
  } catch (e) {
    console.error("DELETE /admin/portfolios error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}