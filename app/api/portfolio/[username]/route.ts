// app/api/portfolio/[username]/route.ts
// When payment has been completed (which would have updated the status on MongoDB via the webhook) so that is_published is true and payment status is marked as completed, 
// the page.tsx corresponding to this will redirect the user to a portfolio with their selected template, and uploaded images, texts etc with their username as the file path. 
// the async function below looks for the portfolio created on MongoDB, whichincludes the items mentioned above. and the file itself fetches the data needed which will then be returned on the page.tsx
// That incorporates this file. With ofcourse, with some error handling
// 
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"



interface TemplateDoc {
  _id?: ObjectId
  name: string
  display_name?: string
  html_template?: string
  css_template?: string
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
    const db = await getDb()
    const portfolioRaw = await db.collection("portfolios").findOne(
      { username, is_published: true },
      { projection: { /* keep all fields; you can add an explicit projection if you want */ } }
    )

    if (!portfolioRaw) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    // 2) Resolve the template via either template_id (ObjectId) or template (name)
    let templateDoc: TemplateDoc | null = null

    // If you store a template ObjectId on the portfolio (e.g., portfolioRaw.template_id)
    const templateIdCandidate = portfolioRaw.template_id
    if (templateIdCandidate && ObjectId.isValid(String(templateIdCandidate))) {
      templateDoc = await db.collection("templates").findOne<TemplateDoc>(
        { _id: new ObjectId(String(templateIdCandidate)) },
        { projection: { name: 1, display_name: 1, html_template: 1, css_template: 1 } }
      )
    }

    // Otherwise fall back to `template` string name on the portfolio (e.g., "default")
    if (!templateDoc && portfolioRaw.template) {
      templateDoc = await db.collection("templates").findOne<TemplateDoc>(
        { name: portfolioRaw.template },
        { projection: { name: 1, display_name: 1, html_template: 1, css_template: 1 } }
      )
    }

    // This is where the template panel that gives us a clean and consistent structure for reference on the actual portfolio page.tsx where the portfolio contents are displayed. 
    const portfolio = {
      ...portfolioRaw,
      id: String(portfolioRaw._id),
      _id: undefined, // hide raw _id in response
      templates: templateDoc
        ? {
            name: templateDoc.name,
            display_name: templateDoc.display_name ?? templateDoc.name,
            html_template: templateDoc.html_template ?? "<div>{{content}}</div>",
            css_template: templateDoc.css_template ?? "",
          }
        : undefined,
    }

    return NextResponse.json({ portfolio })
  } catch (error) {
    console.error("Error fetching portfolio:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
