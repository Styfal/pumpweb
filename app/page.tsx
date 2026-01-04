import { PortfolioBuilder } from "@/components/portfolio-builder"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">DEXPage </h1>
          <p className="text-muted-foreground text-lg">Create your custom token page in <span className="font-bold">10 seconds</span></p>
          <p className="text-muted-foreground text-lg">Since Oct 2025, created <span className="font-bold">100+</span> pages used across DEXs </p>
        </div>
        <PortfolioBuilder />
      </div>
    </main>
  )
}
