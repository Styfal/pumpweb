"use client"

import { useEffect, useRef } from "react"

interface PortfolioData {
  username: string
  token_name: string
  ticker: string
  buy_link: string
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

function escapeHtml(s: string | null | undefined) {
  if (!s) return ""
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function PortfolioPreview({ data }: PortfolioPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!iframeRef.current) return

    const {
      token_name,
      ticker,
      contract_address,
      buy_link,
      slogan,
      twitter_url,
      telegram_url,
      website_url,
      logo_url,
      banner_url,
      template,
    } = data

    const safe = {
      token_name: escapeHtml(token_name),
      ticker: escapeHtml(ticker),
      contract_address: escapeHtml(contract_address),
      buy_link: escapeHtml(buy_link),
      slogan: escapeHtml(slogan),
      twitter_url: escapeHtml(twitter_url),
      telegram_url: escapeHtml(telegram_url),
      website_url: escapeHtml(website_url),
      logo_url: escapeHtml(logo_url),
      banner_url: escapeHtml(banner_url),
    }

    const modernHtml = () => {
      return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${safe.token_name || "Preview"}</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden}
          .bg-blur{position:fixed;inset:0;z-index:-2;background:${safe.banner_url ? `url('${safe.banner_url}')` : "#0f172a"};background-size:cover;background-position:center;filter:blur(12px);transform:scale(1.1)}
          .bg-overlay{position:fixed;inset:0;z-index:-1;background:rgba(0,0,0,0.45)}
          .container{display:flex;align-items:center;gap:20px;color:white;max-width:100%}
          .icon{width:120px;height:120px;border-radius:16px;border:4px solid rgba(255,255,255,0.9);box-shadow:0 20px 40px rgba(0,0,0,0.3);flex-shrink:0;background:${safe.logo_url ? `url('${safe.logo_url}')` : "#0b1220"};background-size:cover;background-position:center}
          .content{display:flex;flex-direction:column;gap:12px;min-width:0;flex:1}
          h1{font-size:28px;font-weight:800;text-shadow:0 2px 4px rgba(0,0,0,0.2);word-wrap:break-word}
          .ticker{opacity:0.9}
          .slogan{font-size:14px;color:rgba(255,255,255,0.9)}
          .contract{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;background:rgba(0,0,0,0.6);border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:background 0.2s;max-width:100%}
          .contract:hover{background:rgba(0,0,0,0.7)}
          .contract span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .ctas{display:flex;flex-wrap:wrap;gap:8px}
          .btn{display:inline-block;padding:6px 12px;background:#10b981;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px;box-shadow:0 2px 8px rgba(16,185,129,0.3);transition:background 0.2s}
          .btn:hover{background:#059669}
          @media(max-width:600px){.container{flex-direction:column;text-align:center}.icon{width:128px;height:128px}}
        </style>
      </head>
      <body>
        <div class="bg-blur"></div>
        <div class="bg-overlay"></div>
        <div class="container">
          <div class="icon"></div>
          <div class="content">
            <h1>${safe.token_name} ${safe.ticker ? `<span class="ticker">(${safe.ticker})</span>` : ""}</h1>
            ${safe.slogan ? `<p class="slogan">${safe.slogan}</p>` : ""}
            ${safe.contract_address ? `<div class="contract" onclick="navigator.clipboard&&navigator.clipboard.writeText('${safe.contract_address}')"><span>${safe.contract_address}</span><span>📋</span></div>` : ""}
            <div class="ctas">
              ${safe.buy_link ? `<a class="btn" href="${safe.buy_link}" target="_blank" rel="noreferrer">Buy ${safe.ticker || "Coin"}</a>` : ""}
              ${safe.website_url ? `<a class="btn" href="${safe.website_url}" target="_blank" rel="noreferrer">Website</a>` : ""}
              ${safe.twitter_url ? `<a class="btn" href="${safe.twitter_url}" target="_blank" rel="noreferrer">X.com</a>` : ""}
              ${safe.telegram_url ? `<a class="btn" href="${safe.telegram_url}" target="_blank" rel="noreferrer">Telegram</a>` : ""}
            </div>
          </div>
        </div>
      </body>
      </html>
      `
    }

    const classicHtml = () => {
      return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${safe.token_name || "Preview"}</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;min-height:100vh;display:flex;align-items:center;padding:24px;position:relative;overflow:hidden}
          .bg-blur{position:fixed;inset:0;z-index:-2;background:${safe.banner_url ? `url('${safe.banner_url}')` : "#0f172a"};background-size:cover;background-position:center;filter:blur(12px);transform:scale(1.1)}
          .bg-overlay{position:fixed;inset:0;z-index:-1;background:rgba(0,0,0,0.45)}
          .container{width:100%;max-width:1280px;margin:0 auto;color:white}
          .grid{display:grid;grid-template-columns:200px 1fr;gap:40px;align-items:center}
          .icon-wrapper{display:flex;justify-content:center}
          .icon{width:192px;height:192px;border-radius:16px;border:4px solid rgba(255,255,255,0.9);box-shadow:0 20px 40px rgba(0,0,0,0.3);background:${safe.logo_url ? `url('${safe.logo_url}')` : "#0b1220"};background-size:cover;background-position:center}
          .content{display:flex;flex-direction:column;gap:16px}
          h1{font-size:48px;font-weight:800;text-shadow:0 2px 4px rgba(0,0,0,0.2)}
          .ticker{opacity:0.9}
          .slogan{font-size:18px;color:rgba(255,255,255,0.9)}
          .contract{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(0,0,0,0.6);border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;max-width:fit-content}
          .contract:hover{background:rgba(0,0,0,0.7)}
          .contract span{max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .ctas{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
          .btn{display:inline-block;padding:8px 16px;background:#10b981;color:white;text-decoration:none;border-radius:8px;font-weight:600;box-shadow:0 2px 8px rgba(16,185,129,0.3);transition:background 0.2s}
          .btn:hover{background:#059669}
          @media(max-width:800px){.grid{grid-template-columns:1fr;text-align:center}.icon-wrapper{justify-content:center}.contract{margin:0 auto}}
        </style>
      </head>
      <body>
        <div class="bg-blur"></div>
        <div class="bg-overlay"></div>
        <div class="container">
          <div class="grid">
            <div class="icon-wrapper">
              <div class="icon"></div>
            </div>
            <div class="content">
              <h1>${safe.token_name} ${safe.ticker ? `<span class="ticker">(${safe.ticker})</span>` : ""}</h1>
              ${safe.slogan ? `<p class="slogan">${safe.slogan}</p>` : ""}
              ${safe.contract_address ? `<div class="contract" onclick="navigator.clipboard&&navigator.clipboard.writeText('${safe.contract_address}')"><span>${safe.contract_address}</span><span>📋</span></div>` : ""}
              <div class="ctas">
                ${safe.buy_link ? `<a class="btn" href="${safe.buy_link}" target="_blank" rel="noreferrer">Buy ${safe.ticker || "Coin"}</a>` : ""}
                ${safe.website_url ? `<a class="btn" href="${safe.website_url}" target="_blank" rel="noreferrer">Website</a>` : ""}
                ${safe.twitter_url ? `<a class="btn" href="${safe.twitter_url}" target="_blank" rel="noreferrer">X.com</a>` : ""}
                ${safe.telegram_url ? `<a class="btn" href="${safe.telegram_url}" target="_blank" rel="noreferrer">Telegram</a>` : ""}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
      `
    }

    const minimalHtml = () => {
      return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${safe.token_name || "Preview"}</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;min-height:100vh;background:#ffffff;color:#0f172a;display:flex;align-items:center;padding:24px}
          .container{width:100%;max-width:1024px;margin:0 auto}
          .grid{display:grid;grid-template-columns:200px 1fr;gap:40px;align-items:center}
          .icon-wrapper{display:flex;justify-content:center}
          .icon{width:192px;height:192px;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(15,23,42,0.08);background:${safe.logo_url ? `url('${safe.logo_url}')` : "#f1f5f9"};background-size:cover;background-position:center}
          .content{display:flex;flex-direction:column;gap:16px}
          h1{font-size:48px;font-weight:700}
          .ticker{color:#64748b}
          .slogan{font-size:18px;color:#334155}
          .contract{display:inline-block;padding:8px 12px;background:#f1f5f9;border-radius:6px;font-size:14px;font-family:monospace;word-break:break-all;max-width:100%}
          .ctas{display:flex;flex-wrap:wrap;gap:12px}
          .btn{display:inline-block;padding:8px 16px;border:1px solid #cbd5e1;color:#0f172a;text-decoration:none;border-radius:8px;transition:background 0.2s}
          .btn:hover{background:#f1f5f9}
          @media(max-width:700px){.grid{grid-template-columns:1fr;text-align:center}.icon-wrapper{justify-content:center}}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="grid">
            <div class="icon-wrapper">
              <div class="icon"></div>
            </div>
            <div class="content">
              <h1>${safe.token_name} ${safe.ticker ? `<span class="ticker">(${safe.ticker})</span>` : ""}</h1>
              ${safe.slogan ? `<p class="slogan">${safe.slogan}</p>` : ""}
              ${safe.contract_address ? `<div class="contract">${safe.contract_address}</div>` : ""}
              <div class="ctas">
                ${safe.buy_link ? `<a class="btn" href="${safe.buy_link}" target="_blank" rel="noreferrer">Buy ${safe.ticker || "Coin"}</a>` : ""}
                ${safe.website_url ? `<a class="btn" href="${safe.website_url}" target="_blank" rel="noreferrer">Website</a>` : ""}
                ${safe.twitter_url ? `<a class="btn" href="${safe.twitter_url}" target="_blank" rel="noreferrer">X.com</a>` : ""}
                ${safe.telegram_url ? `<a class="btn" href="${safe.telegram_url}" target="_blank" rel="noreferrer">Telegram</a>` : ""}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
      `
    }

    const html =
      (template || "modern").toLowerCase() === "classic"
        ? classicHtml()
        : (template || "modern").toLowerCase() === "minimal"
          ? minimalHtml()
          : modernHtml()

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document

    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
    }
  }, [data])

  return (
    <div className="w-full h-[500px] border border-border rounded-lg overflow-hidden">
      <iframe ref={iframeRef} className="w-full h-full" title="Portfolio Preview" />
    </div>
  )
}
