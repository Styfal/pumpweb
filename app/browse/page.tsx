// app/browse/page.tsx
import { getDb } from "@/lib/mongodb"
import { PortfolioBrowser } from "@/components/portfolio-browser"
// If you export the type from the component, import it; otherwise recreate it here.
type PortfolioPreview = {
  username: string
  token_name: string
  ticker: string
  slogan: string
  logo_url: string
  template: string
  created_at: string
}

type PortfolioDoc = {
  username: string
  token_name: string
  ticker: string
  slogan?: string
  logo_url?: string
  template?: string
  created_at?: Date | string
  is_published?: boolean
}

export default async function BrowsePage() {
  const db = await getDb()

  const raw = await db
    .collection<PortfolioDoc>("portfolios")
    .find(
      { is_published: true },
      {
        projection: {
          _id: 0,
          username: 1,
          token_name: 1,
          ticker: 1,
          slogan: 1,
          logo_url: 1,
          template: 1,
          created_at: 1,
        },
      }
    )
    .sort({ created_at: -1 })
    .toArray()

  // Map to required shape with safe fallbacks
  const portfolios: PortfolioPreview[] = raw.map((p) => ({
    username: p.username,
    token_name: p.token_name,
    ticker: p.ticker,
    slogan: p.slogan ?? "",
    logo_url: p.logo_url ?? "",
    template: p.template ?? "default", // <= ensure it's always a string
    created_at:
      typeof p.created_at === "string"
        ? p.created_at
        : p.created_at
        ? p.created_at.toISOString()
        : new Date().toISOString(),
  }))

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Portfolios</h1>
        <p className="text-muted-foreground">
          Discover amazing token portfolios created by our community
        </p>
      </div>

      <PortfolioBrowser portfolios={portfolios} />
    </div>
  )
}
