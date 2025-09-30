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
      slogan: escapeHtml(slogan),
      twitter_url: escapeHtml(twitter_url),
      telegram_url: escapeHtml(telegram_url),
      website_url: escapeHtml(website_url),
      logo_url: escapeHtml(logo_url),
      banner_url: escapeHtml(banner_url),
    }

    const socialLinksHtml = [
      safe.twitter_url ? `<a class="btn" href="${safe.twitter_url}" target="_blank" rel="noreferrer">X.com</a>` : "",
      safe.telegram_url ? `<a class="btn" href="${safe.telegram_url}" target="_blank" rel="noreferrer">Telegram</a>` : "",
      safe.website_url ? `<a class="btn" href="${safe.website_url}" target="_blank" rel="noreferrer">Website</a>` : "",
    ].join(" ")

    const modernHtml = () => {
      return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${safe.token_name || "Preview"}</title>
        <style>
          :root{--bg:#0f172a;--glass:rgba(0,0,0,0.45);--accent:#10b981}
          *{box-sizing:border-box}
          html,body{height:100%;margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
          body{background:var(--bg);color:#fff;display:flex;align-items:center;justify-content:center;padding:24px}
          .wrap{width:100%;max-width:900px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.6)}
          .hero{position:relative;padding:48px 36px;text-align:center}
          .blur{position:absolute;inset:0;background:${safe.banner_url ? `url('${safe.banner_url}') center/cover no-repeat` : "#0f172a"};filter:blur(12px) scale(1.05);opacity:0.7}
          .overlay{position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.45))}
          .content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:18px}
          .icon{width:120px;height:120px;border-radius:18px;border:4px solid rgba(255,255,255,0.9);background:${safe.logo_url ? `url('${safe.logo_url}') center/cover no-repeat` : "#071025"}}
          h1{font-size:34px;margin:0}
          .ticker{opacity:0.9}
          .slogan{color:rgba(255,255,255,0.9);font-size:16px;margin:0}
          .contract{margin-top:8px;background:rgba(0,0,0,0.6);display:inline-block;padding:8px 12px;border-radius:10px;font-size:13px}
          .ctas{margin-top:12px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
          .btn{display:inline-block;padding:8px 14px;border-radius:8px;background:var(--accent);color:#fff;text-decoration:none;font-weight:600}
          @media (max-width:600px){.icon{width:84px;height:84px}.hero{padding:28px}}
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="hero">
            <div class="blur"></div>
            <div class="overlay"></div>
            <div class="content">
              <div class="icon" role="img" aria-label="${safe.token_name} icon"></div>
              <h1>${safe.token_name} ${safe.ticker ? `<span class="ticker">(${safe.ticker})</span>` : ""}</h1>
              ${safe.slogan ? `<p class="slogan">${safe.slogan}</p>` : ""}
              ${safe.contract_address ? `<div class="contract">${safe.contract_address}</div>` : ""}
              <div class="ctas">${socialLinksHtml}</div>
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
          *{box-sizing:border-box}
          body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:#081225;color:#fff;display:flex;align-items:center;justify-content:center;padding:20px}
          .wrap{width:100%;max-width:1100px;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.6)}
          .hero{display:grid;grid-template-columns:220px 1fr;gap:30px;align-items:center;padding:28px;background:${safe.banner_url ? `url('${safe.banner_url}') center/cover no-repeat` : "#081225"};background-size:cover}
          .left{display:flex;justify-content:center}
          .icon{width:160px;height:160px;border-radius:16px;border:4px solid rgba(255,255,255,0.9);background:${safe.logo_url ? `url('${safe.logo_url}') center/cover no-repeat` : "#071025"}}
          .right h1{margin:0;font-size:32px}
          .slogan{color:rgba(255,255,255,0.9);margin-top:6px}
          .contract{margin-top:8px;background:rgba(0,0,0,0.5);display:inline-block;padding:8px 12px;border-radius:10px;font-size:13px}
          .ctas{margin-top:12px;display:flex;gap:10px;flex-wrap:wrap}
          .btn{display:inline-block;padding:8px 14px;border-radius:8px;background:#10b981;color:#fff;text-decoration:none;font-weight:600}
          @media (max-width:800px){.hero{grid-template-columns:1fr; text-align:center}.left{order:0}}
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="hero">
            <div class="left"><div class="icon" role="img" aria-label="${safe.token_name} icon"></div></div>
            <div class="right">
              <h1>${safe.token_name} ${safe.ticker ? `<span class="ticker">(${safe.ticker})</span>` : ""}</h1>
              ${safe.slogan ? `<p class="slogan">${safe.slogan}</p>` : ""}
              ${safe.contract_address ? `<div class="contract">${safe.contract_address}</div>` : ""}
              <div class="ctas">${socialLinksHtml}</div>
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
          *{box-sizing:border-box}
          body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:#fff;color:#0f172a;display:flex;align-items:center;justify-content:center;padding:20px}
          .wrap{width:100%;max-width:900px;border-radius:8px;overflow:hidden;box-shadow:0 6px 18px rgba(2,6,23,0.08);background:#fff}
          .content{display:grid;grid-template-columns:180px 1fr;gap:24px;padding:28px;align-items:center}
          .icon{width:140px;height:140px;border-radius:12px;background:${safe.logo_url ? `url('${safe.logo_url}') center/cover no-repeat` : "#f1f5f9"};background-size:cover;border:1px solid #e6e6e6}
          .right h1{margin:0;font-size:28px;color:#0f172a}
          .slogan{color:#334155;margin-top:6px}
          .contract{margin-top:10px;color:#475569;font-size:13px;word-break:break-all}
          .ctas{margin-top:12px}
          .btn{display:inline-block;padding:6px 12px;border-radius:8px;border:1px solid #cbd5e1;color:#0f172a;text-decoration:none;margin-right:8px}
          @media (max-width:700px){.content{grid-template-columns:1fr; text-align:center}}
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="content">
            <div class="icon" role="img" aria-label="${safe.token_name} icon"></div>
            <div class="right">
              <h1>${safe.token_name} ${safe.ticker ? `<span class="ticker">(${safe.ticker})</span>` : ""}</h1>
              ${safe.slogan ? `<p class="slogan">${safe.slogan}</p>` : ""}
              ${safe.contract_address ? `<div class="contract">${safe.contract_address}</div>` : ""}
              <div class="ctas">${socialLinksHtml}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
      `
    }

    const html = (template || "modern").toLowerCase() === "classic"
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
