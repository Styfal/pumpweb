// app/api/portfolio/[username]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface TemplateDoc {
  _id?: ObjectId;
  name: string;
  display_name?: string;
  html_template?: string;
  css_template?: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // Await the params
    const { username } = await params;
    const db = await getDb();

    // 1) Find the published portfolio for this username
    const portfolioRaw = await db.collection("portfolios").findOne(
      { username, is_published: true },
      {
        projection: {
          // include all fields, but you can restrict if needed
        },
      }
    );

    if (!portfolioRaw) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // 2) Resolve the template via either template_id (ObjectId) or template (name)
    let templateDoc: TemplateDoc | null = null;

    const templateIdCandidate = portfolioRaw.template_id;
    if (templateIdCandidate && ObjectId.isValid(String(templateIdCandidate))) {
      templateDoc = await db.collection("templates").findOne<TemplateDoc>(
        { _id: new ObjectId(String(templateIdCandidate)) },
        {
          projection: {
            name: 1,
            display_name: 1,
            html_template: 1,
            css_template: 1,
          },
        }
      );
    }

    if (!templateDoc && portfolioRaw.template) {
      templateDoc = await db.collection("templates").findOne<TemplateDoc>(
        { name: portfolioRaw.template },
        {
          projection: {
            name: 1,
            display_name: 1,
            html_template: 1,
            css_template: 1,
          },
        }
      );
    }

    // 3) Normalize field names to match what your frontend/generator expects
    const portfolio = {
      ...portfolioRaw,
      id: String(portfolioRaw._id),
      _id: undefined, // hide raw _id in response

      // normalize naming differences
      tokenName: portfolioRaw.tokenName ?? portfolioRaw.token_name ?? "",
      slogan: portfolioRaw.slogan ?? portfolioRaw.description ?? "",
      tokenIcon: portfolioRaw.tokenIcon ?? portfolioRaw.token_icon ?? null,
      headerImage: portfolioRaw.headerImage ?? portfolioRaw.header_image ?? null,

      templates: templateDoc
        ? {
            name: templateDoc.name,
            display_name: templateDoc.display_name ?? templateDoc.name,
            html_template: templateDoc.html_template ?? "<div>{{content}}</div>",
            css_template: templateDoc.css_template ?? "",
          }
        : undefined,
    };

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
