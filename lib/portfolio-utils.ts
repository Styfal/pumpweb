import type { Portfolio, Template } from "./types"

export function generatePortfolioHtml(portfolio: Portfolio, template: Template): string {
  let html = template.html_template
  const css = template.css_template

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

export function validateUsername(username: string): boolean {
  // Username validation: 3-30 characters, alphanumeric and hyphens only
  const usernameRegex = /^[a-zA-Z0-9-]{3,30}$/
  return usernameRegex.test(username)
}

export function generateUniqueUsername(tokenName: string): string {
  // Generate a URL-friendly username from token name
  const base = tokenName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 20)

  // Add random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}
