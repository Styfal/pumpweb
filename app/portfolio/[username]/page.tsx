// app/portfolio/[username]/page.tsx
import { notFound } from "next/navigation"
import { getDb } from "@/lib/mongodb"
import { PortfolioRenderer } from "@/components/portfolio-renderer"
import type { WithId, ObjectId } from "mongodb"
import type { Portfolio, Template } from "@/lib/types" // <-- use your app's types

interface PortfolioPageProps {
  params: { username: string }
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
