// /app/[username]/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getDb } from "@/lib/mongodb";
import type { ObjectId } from "mongodb";
import { PortfolioRenderer } from "@/components/portfolio-renderer";
import { getTemplateByName } from "@/lib/registry";
import { isValidUsername } from "@/lib/username-validation";

type PortfolioDoc = {
  _id: ObjectId;
  username: string;
  token_name: string;
  ticker: string;
  buy_link: string;
  contract_address: string;
  slogan: string;
  twitter_url: string;
  telegram_url: string;
  website_url: string;
  template: string;          // "modern" | "classic" | "minimal"
  logo_url: string | null;
  banner_url: string | null;
  is_published: boolean;
};

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  
  // Validate username for security
  if (!isValidUsername(username)) {
    return notFound();
  }
  
  const db = await getDb();

  const doc = await db.collection<PortfolioDoc>("portfolios").findOne(
    { username, is_published: true },
    {
      projection: {
        username: 1, token_name: 1, ticker: 1, contract_address: 1, slogan: 1,
        twitter_url: 1, telegram_url: 1, website_url: 1,
        template: 1, logo_url: 1, banner_url: 1, buy_link: 1,
      },
    }
  );

  if (!doc) return notFound();

  const portfolio = {
    token_name: doc.token_name ?? "",
    ticker: doc.ticker ?? "",
    buy_link: doc.buy_link ?? "",
    contract_address: doc.contract_address ?? "",
    slogan: doc.slogan ?? "",
    logo_url: doc.logo_url ?? "",
    banner_url: doc.banner_url ?? "",
    twitter_url: doc.twitter_url ?? "",
    telegram_url: doc.telegram_url ?? "",
    website_url: doc.website_url ?? "",
  };

  const template = getTemplateByName(doc.template); // defaults handled in registry

  return <PortfolioRenderer portfolio={portfolio} template={template} />;
}