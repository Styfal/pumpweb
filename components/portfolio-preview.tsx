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
      const linkCount = [safe.buy_link, safe.website_url, safe.twitter_url, safe.telegram_url].filter(link => link && link.trim()).length
      const isThreeOrLess = linkCount <= 3
      
      return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${safe.token_name || "Preview"}</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:${safe.banner_url ? `url('${safe.banner_url}')` : "linear-gradient(135deg,#667eea 0%,#764ba2 100%)"};background-size:cover;background-position:center;position:relative}
          body::before{content:'';position:absolute;inset:0;background:${safe.banner_url ? "rgba(0,0,0,0.3)" : "transparent"};z-index:1}
          .container{display:flex;align-items:center;gap:12px;color:white;max-width:400px;width:100%;z-index:2;position:relative}
          .icon{width:140px;height:140px;border-radius:14px;border:3px solid rgba(255,255,255,0.9);box-shadow:0 6px 18px rgba(0,0,0,0.25);flex-shrink:0;background:${safe.logo_url ? `url('${safe.logo_url}')` : "#1e293b"};background-size:cover;background-position:center}
          .content{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
          h1{font-size:${isThreeOrLess ? '22px' : '20px'};font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.3);line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .ticker{opacity:0.9;font-weight:600}
          .slogan{font-size:${isThreeOrLess ? '12px' : '11px'};color:rgba(255,255,255,0.9);line-height:1.3;margin-top:1px;word-wrap:break-word;overflow-wrap:break-word;max-width:180px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
          .contract{display:inline-flex;align-items:center;gap:4px;padding:${isThreeOrLess ? '5px 9px' : '4px 8px'};background:rgba(0,0,0,0.35);border-radius:5px;font-size:${isThreeOrLess ? '11px' : '10px'};font-weight:500;cursor:pointer;transition:background 0.2s;max-width:fit-content;margin-top:2px}
          .contract:hover{background:rgba(0,0,0,0.45)}
          .contract span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px}
          .ctas{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
          .btn{display:inline-block;padding:${isThreeOrLess ? '6px 13px' : '5px 11px'};background:#10b981;color:white;text-decoration:none;border-radius:6px;font-weight:600;font-size:${isThreeOrLess ? '11px' : '10px'};border:1px solid #059669;transition:all 0.2s;box-shadow:0 2px 4px rgba(16,185,129,0.2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80px}
          .btn:hover{background:#059669;transform:translateY(-1px);box-shadow:0 3px 8px rgba(16,185,129,0.3)}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon"></div>
          <div class="content">
            <h1>${safe.token_name} ${safe.ticker ? `<span class="ticker">(${safe.ticker})</span>` : ""}</h1>
            ${safe.slogan ? `<p class="slogan">${safe.slogan}</p>` : ""}
            ${safe.contract_address ? `<div class="contract" onclick="navigator.clipboard&&navigator.clipboard.writeText('${safe.contract_address}')"><span>${safe.contract_address}</span><span>📋</span></div>` : ""}
            <div class="ctas">
              ${safe.buy_link ? `<a class="btn" href="${safe.buy_link}" target="_blank" rel="noreferrer" title="Buy ${safe.ticker || ""}">Buy ${safe.ticker || ""}</a>` : ""}
              ${safe.website_url ? `<a class="btn" href="${safe.website_url}" target="_blank" rel="noreferrer" title="Website">Website</a>` : ""}
              ${safe.twitter_url ? `<a class="btn" href="${safe.twitter_url}" target="_blank" rel="noreferrer" title="X.com">X.com</a>` : ""}
              ${safe.telegram_url ? `<a class="btn" href="${safe.telegram_url}" target="_blank" rel="noreferrer" title="Telegram">Telegram</a>` : ""}
            </div>
          </div>
        </div>
      </body>
      </html>
      `
    }

    const classicHtml = () => {
      const linkCount = [safe.buy_link, safe.website_url, safe.twitter_url, safe.telegram_url].filter(link => link && link.trim()).length
      const isThreeOrLess = linkCount <= 3
      
      return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${safe.token_name || "Preview"}</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:${safe.banner_url ? `url('${safe.banner_url}')` : "linear-gradient(to bottom,#1e3a8a,#1e40af)"};background-size:cover;background-position:center;position:relative}
          body::before{content:'';position:absolute;inset:0;background:rgba(0,0,0,0.4);z-index:1}
          .container{display:flex;flex-direction:column;align-items:center;text-align:center;color:white;z-index:2;position:relative;gap:8px;max-width:380px}
          .icon{width:${isThreeOrLess ? '140px' : '140px'};height:${isThreeOrLess ? '140px' : '140px'};border-radius:${isThreeOrLess ? '20px' : '16px'};border:${isThreeOrLess ? '4px' : '3px'} solid rgba(255,255,255,0.9);box-shadow:0 6px 24px rgba(0,0,0,0.4);background:${safe.logo_url ? `url('${safe.logo_url}')` : "#1e293b"};background-size:cover;background-position:center;margin-bottom:4px}
          h1{font-size:${isThreeOrLess ? '30px' : '25px'};font-weight:800;text-shadow:0 2px 4px rgba(0,0,0,0.6);line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
          .ticker{opacity:0.95;font-weight:700}
          .slogan{font-size:${isThreeOrLess ? '13px' : '12px'};color:rgba(255,255,255,0.95);max-width:300px;line-height:1.3;margin-top:2px;word-wrap:break-word;overflow-wrap:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
          .contract{display:inline-flex;align-items:center;gap:5px;padding:${isThreeOrLess ? '6px 12px' : '6px 12px'};background:rgba(0,0,0,0.6);border-radius:7px;font-size:${isThreeOrLess ? '11px' : '10px'};font-weight:500;cursor:pointer;transition:background 0.2s;max-width:fit-content;margin:4px 0;backdrop-filter:blur(10px)}
          .contract:hover{background:rgba(0,0,0,0.7)}
          .contract span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px}
          .ctas{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:4px}
          .btn{display:inline-block;padding:${isThreeOrLess ? '8px 18px' : '8px 16px'};background:#10b981;color:white;text-decoration:none;border-radius:8px;font-weight:700;font-size:${isThreeOrLess ? '13px' : '12px'};border:1.5px solid #059669;transition:all 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.3);backdrop-filter:blur(10px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px}
          .btn:hover{background:#059669;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.4)}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon"></div>
          <h1>${safe.token_name} ${safe.ticker ? `<span class="ticker">(${safe.ticker})</span>` : ""}</h1>
          ${safe.slogan ? `<p class="slogan">${safe.slogan}</p>` : ""}
          ${safe.contract_address ? `<div class="contract" onclick="navigator.clipboard&&navigator.clipboard.writeText('${safe.contract_address}')"><span>${safe.contract_address}</span><span>📋</span></div>` : ""}
          <div class="ctas">
            ${safe.buy_link ? `<a class="btn" href="${safe.buy_link}" target="_blank" rel="noreferrer" title="Buy ${safe.ticker || "Token"}">Buy ${safe.ticker || "Token"}</a>` : ""}
            ${safe.website_url ? `<a class="btn" href="${safe.website_url}" target="_blank" rel="noreferrer" title="Website">Website</a>` : ""}
            ${safe.twitter_url ? `<a class="btn" href="${safe.twitter_url}" target="_blank" rel="noreferrer" title="X.com">X.com</a>` : ""}
            ${safe.telegram_url ? `<a class="btn" href="${safe.telegram_url}" target="_blank" rel="noreferrer" title="Telegram">Telegram</a>` : ""}
          </div>
        </div>
      </body>
      </html>
      `
    }

    const minimalHtml = () => {
      const linkCount = [safe.buy_link, safe.website_url, safe.twitter_url, safe.telegram_url].filter(link => link && link.trim()).length
      const isThreeOrLess = linkCount <= 3
      
      return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${safe.token_name || "Preview"}</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;min-height:100vh;background:#ffffff;color:#0f172a;display:flex;align-items:center;justify-content:center;padding:32px}
          .container{display:flex;flex-direction:column;align-items:center;text-align:center;max-width:350px;gap:8px}
          .icon{width:${isThreeOrLess ? '140px' : '140px'};height:${isThreeOrLess ? '140px' : '140px'};border-radius:${isThreeOrLess ? '16px' : '12px'};border:${isThreeOrLess ? '2px' : '1.5px'} solid #e2e8f0;box-shadow:0 2px 8px rgba(15,23,42,0.08);background:${safe.logo_url ? `url('${safe.logo_url}')` : "#f8fafc"};background-size:cover;background-position:center;margin-bottom:4px}
          h1{font-size:${isThreeOrLess ? '25px' : '20px'};font-weight:700;line-height:1.2;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
          .ticker{color:#64748b;font-weight:600}
          .slogan{font-size:${isThreeOrLess ? '12px' : '11px'};color:#475569;max-width:280px;line-height:1.3;margin-top:2px;word-wrap:break-word;overflow-wrap:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
          .contract{display:inline-block;padding:${isThreeOrLess ? '7px 13px' : '6px 12px'};background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;font-size:${isThreeOrLess ? '11px' : '11px'};font-family:monospace;color:#475569;word-break:break-all;max-width:100%;margin:4px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .ctas{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:4px}
          .btn{display:inline-block;padding:${isThreeOrLess ? '7px 15px' : '6px 14px'};background:#10b981;color:white;text-decoration:none;border-radius:6px;font-size:${isThreeOrLess ? '13px' : '12px'};font-weight:600;transition:all 0.2s;border:1px solid #059669;box-shadow:0 1px 3px rgba(16,185,129,0.2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:90px}
          .btn:hover{background:#059669;transform:translateY(-1px);box-shadow:0 2px 6px rgba(16,185,129,0.3)}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon"></div>
          <h1>${safe.token_name} ${safe.ticker ? `<span class="ticker">(${safe.ticker})</span>` : ""}</h1>
          ${safe.slogan ? `<p class="slogan">${safe.slogan}</p>` : ""}
          ${safe.contract_address ? `<div class="contract" title="${safe.contract_address}">${safe.contract_address}</div>` : ""}
          <div class="ctas">
            ${safe.buy_link ? `<a class="btn" href="${safe.buy_link}" target="_blank" rel="noreferrer" title="Buy ${safe.ticker || ""}">Buy ${safe.ticker || ""}</a>` : ""}
            ${safe.website_url ? `<a class="btn" href="${safe.website_url}" target="_blank" rel="noreferrer" title="Website">Website</a>` : ""}
            ${safe.twitter_url ? `<a class="btn" href="${safe.twitter_url}" target="_blank" rel="noreferrer" title="Twitter">Twitter</a>` : ""}
            ${safe.telegram_url ? `<a class="btn" href="${safe.telegram_url}" target="_blank" rel="noreferrer" title="Telegram">Telegram</a>` : ""}
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