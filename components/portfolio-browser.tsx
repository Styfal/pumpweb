"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, ExternalLink } from "lucide-react"
import Link from "next/link"

interface PortfolioPreview {
  username: string
  token_name: string
  ticker?: string
  slogan?: string
  logo_url?: string
  template: string
  created_at: string
}

interface PortfolioBrowserProps {
  portfolios: PortfolioPreview[]
}

export function PortfolioBrowser({ portfolios }: PortfolioBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const filteredPortfolios = portfolios.filter((portfolio) => {
    const matchesSearch =
      portfolio.token_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      portfolio.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (portfolio.ticker && portfolio.ticker.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTemplate = !selectedTemplate || portfolio.template === selectedTemplate

    return matchesSearch && matchesTemplate
  })

  const templates = Array.from(new Set(portfolios.map((p) => p.template)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search portfolios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={selectedTemplate === null ? "default" : "outline"}
            onClick={() => setSelectedTemplate(null)}
            size="sm"
          >
            All
          </Button>
          {templates.map((template) => (
            <Button
              key={template}
              variant={selectedTemplate === template ? "default" : "outline"}
              onClick={() => setSelectedTemplate(template)}
              size="sm"
              className="capitalize"
            >
              {template}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPortfolios.map((portfolio) => (
          <Card key={portfolio.username} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                {portfolio.logo_url && (
                  <img
                    src={portfolio.logo_url || "/placeholder.svg"}
                    alt={`${portfolio.token_name} logo`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <CardTitle className="text-lg">{portfolio.token_name}</CardTitle>
                  <CardDescription>@{portfolio.username}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {portfolio.ticker && <Badge variant="secondary">${portfolio.ticker}</Badge>}
                <Badge variant="outline" className="capitalize">
                  {portfolio.template}
                </Badge>
              </div>

              {portfolio.slogan && <p className="text-sm text-muted-foreground line-clamp-2">{portfolio.slogan}</p>}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Created {new Date(portfolio.created_at).toLocaleDateString()}
                </span>

                <Button asChild size="sm">
                  <Link href={`/portfolio/${portfolio.username}`} className="flex items-center gap-1">
                    View
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPortfolios.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No portfolios found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
