import type { Portfolio, Template } from "@/lib/types"

interface PortfolioRendererProps {
  portfolio: Portfolio
  template: Template
}

export function PortfolioRenderer({ portfolio, template }: PortfolioRendererProps) {
  // Template replacement function
  const renderTemplate = (htmlTemplate: string, cssTemplate: string) => {
    let html = htmlTemplate
    const css = cssTemplate

    // Replace template variables
    const replacements = {
      "{{TOKEN_NAME}}": portfolio.token_name || "",
      "{{TICKER}}": portfolio.ticker || "",
      "{{CONTRACT_ADDRESS}}": portfolio.contract_address || "",
      "{{SLOGAN}}": portfolio.slogan || "",
      "{{DESCRIPTION}}": portfolio.description || "",
      "{{LOGO_URL}}": portfolio.logo_url || "",
      "{{BANNER_URL}}": portfolio.banner_url || "",
      "{{TWITTER_URL}}": portfolio.twitter_url || "",
      "{{TELEGRAM_URL}}": portfolio.telegram_url || "",
      "{{WEBSITE_URL}}": portfolio.website_url || "",
      "{{CSS}}": css,
    }

    // Handle conditional blocks (Mustache-like syntax)
    const conditionalBlocks = [
      "LOGO_URL",
      "TICKER",
      "SLOGAN",
      "BANNER_URL",
      "DESCRIPTION",
      "CONTRACT_ADDRESS",
      "TWITTER_URL",
      "TELEGRAM_URL",
      "WEBSITE_URL",
    ]

    conditionalBlocks.forEach((block) => {
      const value = portfolio[block.toLowerCase() as keyof Portfolio] as string
      const openTag = `{{#${block}}}`
      const closeTag = `{{/${block}}}`

      if (value && value.trim()) {
        // Remove conditional tags, keep content
        html = html.replace(new RegExp(`${openTag}([\\s\\S]*?)${closeTag}`, "g"), "$1")
      } else {
        // Remove entire conditional block
        html = html.replace(new RegExp(`${openTag}[\\s\\S]*?${closeTag}`, "g"), "")
      }
    })

    // Replace remaining variables
    Object.entries(replacements).forEach(([key, value]) => {
      html = html.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), value)
    })

    return html
  }

  const renderedHtml = renderTemplate(template.html_template, template.css_template)

  return (
    <div className="portfolio-container">
      <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
    </div>
  )
}
