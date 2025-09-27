// app/portfolio/[username]/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getDb } from "@/lib/mongodb";
import type { ObjectId } from "mongodb";
import { renderTemplateDB } from "@/lib/template" // <-- registry with centered/side/minimal

// Matches your Mongo schema exactly
type PortfolioDoc = {
  _id: ObjectId;
  username: string;
  token_name: string;
  ticker: string;
  contract_address: string;
  slogan: string;
  description: string;
  twitter_url: string;
  telegram_url: string;
  website_url: string;
  template: string;            // "centered" | "side" | "minimal"
  logo_url: string | null;     // token icon
  banner_url: string | null;   // blurred background
  is_published: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
  published_at?: Date | string;
};

// Fix the type definition to match Next.js App Router expectations
interface PageProps {
  params: { username: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function PortfolioPage({ params }: PageProps) {
  const db = await getDb();

  const doc = await db.collection<PortfolioDoc>("portfolios").findOne(
    { username: params.username, is_published: true },
    {
      projection: {
        // return only what you use
        username: 1,
        token_name: 1,
        ticker: 1,
        contract_address: 1,
        slogan: 1,
        description: 1,
        twitter_url: 1,
        telegram_url: 1,
        website_url: 1,
        template: 1,
        logo_url: 1,
        banner_url: 1,
        is_published: 1,
      },
    }
  );

  if (!doc) return notFound();

  // Render by template name using the DB fields directly
  return renderTemplateDB({
    username: doc.username,
    token_name: doc.token_name,
    ticker: doc.ticker ?? "",
    contract_address: doc.contract_address ?? "",
    slogan: doc.slogan ?? "",
    description: doc.description ?? "",
    twitter_url: doc.twitter_url ?? "",
    telegram_url: doc.telegram_url ?? "",
    website_url: doc.website_url ?? "",
    template: (doc.template || "centered").toLowerCase(),
    logo_url: doc.logo_url,       // Use property name that matches PortfolioDB
    banner_url: doc.banner_url,   // Use property name that matches PortfolioDB
  });
}
