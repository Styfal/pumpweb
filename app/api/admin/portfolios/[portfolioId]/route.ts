// app/api/admin/portfolios/[portfolioId]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type Document } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseId(portfolioId: string): Filter<Document> {
  // allow either custom string id or Mongo _id
  const or: Filter<Document>[] = [{ id: portfolioId }];
  if (ObjectId.isValid(portfolioId)) {
    or.push({ _id: new ObjectId(portfolioId) });
  }
  return { $or: or };
}

function isAuthorized(req: NextRequest) {
  const expected = process.env.ADMIN_ACCESS_KEY;
  if (!expected) return false;
  const headerKey =
    req.headers.get("x-admin-access-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return headerKey === expected;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { portfolioId } = params;
    const update = await request.json().catch(() => ({} as Record<string, unknown>));
    if (!update || typeof update !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const db = await getDb();
    const res = await db.collection("portfolios").updateOne(parseId(portfolioId), {
      $set: { ...update, updated_at: new Date() },
    });

    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, modified: res.modifiedCount });
  } catch (e) {
    console.error("PATCH /admin/portfolios error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { portfolioId } = params;
    const db = await getDb();
    const res = await db.collection("portfolios").deleteOne(parseId(portfolioId));

    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deleted: res.deletedCount });
  } catch (e) {
    console.error("DELETE /admin/portfolios error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
