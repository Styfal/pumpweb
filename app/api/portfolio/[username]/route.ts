// app/api/portfolio/[username]/route.ts
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

export async function GET(_request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const { username } = params
    const db = await getDb()

    // 1) Find the published portfolio for this username
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

    // 3) Normalize output to mimic your former Supabase shape:
    //    - convert _id to string id
    //    - attach `templates` nested object like Supabase `select("*, templates(...))"`
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
