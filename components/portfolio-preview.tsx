"use client"

import { useEffect, useRef } from "react"

interface PortfolioData {
  username: string
  token_name: string
  ticker: string
  contract_address: string
  slogan: string
  twitter_url: string
  telegram_url: string
  website_url: string
  template: string
  logo_url: string | null
  banner_url: string | null
}

interface PortfolioPreviewProps {
  data: PortfolioData
}

export function PortfolioPreview({ data }: PortfolioPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!iframeRef.current) return

    const generatePreviewHTML = () => {
      const {
        token_name,
        ticker,
        contract_address,
        slogan,
        twitter_url,
        telegram_url,
        website_url,
        logo_url,
        banner_url,
        template,
      } = data

      if (!token_name) {
        return '<div style="padding: 20px; text-align: center; color: #666;">Fill in the form to see preview</div>'
      }

      const twitterLink = twitter_url
        ? `<a href="${twitter_url}" target="_blank" style="color: #1da1f2; text-decoration: none; margin-right: 15px;">Twitter</a>`
        : ""
      const telegramLink = telegram_url
        ? `<a href="${telegram_url}" target="_blank" style="color: #0088cc; text-decoration: none; margin-right: 15px;">Telegram</a>`
        : ""
      const websiteLink = website_url
        ? `<a href="${website_url}" target="_blank" style="color: #007bff; text-decoration: none;">Website</a>`
        : ""

      // Template-specific styles
      const templateStyles = getTemplateStyles(template)

      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${token_name}</title>
          <style>${templateStyles}</style>
        </head>
        <body>
          <div class="container">
            ${banner_url ? `<div class="header-image"><img src="${banner_url}" alt="Header" /></div>` : ""}
            
            <div class="content">
              <div class="token-info">
                ${logo_url ? `<div class="token-icon"><img src="${logo_url}" alt="${token_name} Icon" /></div>` : ""}
                <h1 class="token-name">${token_name}</h1>
                ${ticker ? `<div class="ticker">$${ticker}</div>` : ""}
                ${slogan ? `<p class="slogan">${slogan}</p>` : ""}
                ${contract_address ? `<div class="contract"><strong>Contract:</strong> ${contract_address}</div>` : ""}
              </div>

              ${
                twitterLink || telegramLink || websiteLink
                  ? `
                <div class="social-links">
                  <h3>Follow Us</h3>
                  ${twitterLink}
                  ${telegramLink}
                  ${websiteLink}
                </div>
              `
                  : ""
              }
            </div>
          </div>
        </body>
        </html>
      `
    }

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document

    if (doc) {
      doc.open()
      doc.write(generatePreviewHTML())
      doc.close()
    }
  }, [data])

  const getTemplateStyles = (template: string): string => {
    const baseStyles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
      .container { max-width: 800px; margin: 0 auto; }
      .header-image img { width: 100%; height: 200px; object-fit: cover; }
      .content { padding: 20px; }
      .token-info { text-align: center; margin-bottom: 30px; }
      .token-icon img { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; }
      .token-name { font-size: 2.5rem; margin-bottom: 10px; }
      .ticker { font-size: 1.2rem; color: #666; margin-bottom: 15px; }
      .slogan { font-size: 1.1rem; margin-bottom: 15px; font-style: italic; }
      .contract { font-size: 0.9rem; color: #888; word-break: break-all; margin-bottom: 20px; }
      .social-links { text-align: center; }
      .social-links h3 { margin-bottom: 15px; }
    `

    switch (template) {
      case "modern":
        return (
          baseStyles +
          `
          body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; }
          .container { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; margin: 20px; }
          .token-name { color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
          .content { background: white; color: #333; border-radius: 15px; }
          .social-links a { background: #667eea; color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; margin: 0 5px; display: inline-block; }
        `
        )
      case "classic":
        return (
          baseStyles +
          `
          body { background: #f5f5f5; color: #333; }
          .container { background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 20px; }
          .token-name { color: #2c3e50; font-family: Georgia, serif; }
          .content { border-top: 3px solid #2c3e50; }
          .social-links a { color: #3498db; text-decoration: none; padding: 8px 16px; border: 1px solid #3498db; margin: 0 5px; display: inline-block; }
        `
        )
      default:
        return baseStyles
    }
  }

  return (
    <div className="w-full h-[500px] border border-border rounded-lg overflow-hidden">
      <iframe ref={iframeRef} className="w-full h-full" title="Portfolio Preview" />
    </div>
  )
}
