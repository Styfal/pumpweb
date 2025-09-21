// app/portfolio/[username]/page.tsx

export const runtime = "nodejs"
export const dynamic = "force-dynamic"


import { notFound } from "next/navigation"
import { getDb } from "@/lib/mongodb"
import { PortfolioRenderer } from "@/components/portfolio-renderer"
import type { WithId, ObjectId } from "mongodb"
import type { Portfolio, Template } from "@/lib/types" // <-- use your app's types

interface PortfolioPageProps {
  params: Promise<{ username: string }>
}

// --- Mongo docs as stored ---
type PortfolioDoc = {
  _id: ObjectId
  username: string
  token_name: string
  ticker?: string
  description?: string
  logo_url?: string
  template?: string
  is_published: boolean
  created_at?: Date | string
  updated_at?: Date | string
}

type TemplateDoc = {
  _id: ObjectId
  name: string
  display_name?: string
  html_template?: string
  css_template?: string
  is_active: boolean
  created_at?: Date | string
  updated_at?: Date | string
}

// --- helpers ---
function toISO(d?: Date | string): string {
  if (!d) return new Date().toISOString()
  return typeof d === "string" ? new Date(d).toISOString() : d.toISOString()
}

// Map DB -> UI types expected by PortfolioRendererProps
function mapPortfolio(doc: WithId<PortfolioDoc>): Portfolio {
  return {
    id: doc._id.toString(),
    username: doc.username,
    token_name: doc.token_name,
    ticker: doc.ticker ?? "",
    description: doc.description ?? "",
    logo_url: doc.logo_url ?? "",
    template: doc.template ?? "default",
    created_at: toISO(doc.created_at),
    updated_at: toISO(doc.updated_at ?? doc.created_at),
    is_published: !!doc.is_published, // <-- REQUIRED by your Portfolio type
  }
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  // Await the params
  const { username } = await params
  const db = await getDb()

  // Find published portfolio and its template
  const portfolioDoc = await db.collection("portfolios").findOne<PortfolioDoc>({ 
    username, 
    is_published: true 
  })

  if (!portfolioDoc) {
    notFound()
  }

  // Get template if specified
  let templateDoc: TemplateDoc | null = null
  if (portfolioDoc.template) {
    templateDoc = await db.collection("templates").findOne<TemplateDoc>({
      name: portfolioDoc.template,
      is_active: true
    })
  }

  // Map DB docs to UI types
  const portfolio = mapPortfolio(portfolioDoc)
  const template: Template = templateDoc ? {
    id: templateDoc._id.toString(),
    name: templateDoc.name,
    display_name: templateDoc.display_name ?? templateDoc.name,
    html_template: templateDoc.html_template ?? "<div>{{content}}</div>",
    css_template: templateDoc.css_template ?? "",
    is_active: templateDoc.is_active,
    created_at: toISO(templateDoc.created_at)
  } : {
    id: "default",
    name: "default",
    display_name: "Default Template",
    html_template: "<div>{{content}}</div>",
    css_template: "",
    is_active: true,
    created_at: toISO()
  }

  return <PortfolioRenderer portfolio={portfolio} template={template} />
}