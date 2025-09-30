"use client"

import type React from "react"

export type PortfolioDB = {
  username: string
  token_name: string
  ticker: string
  contract_address: string
  slogan: string
  twitter_url: string
  telegram_url: string
  website_url: string
  template: string // "modern" | "classic" | "minimal"
  logo_url: string | null
  banner_url: string | null
}

export type TemplateDBComponent = (p: PortfolioDB) => React.JSX.Element

export const TEMPLATES_DB: Record<string, TemplateDBComponent> = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
}

export function renderTemplateDB(p: PortfolioDB) {
  const key = (p.template || "modern").toLowerCase()
  const Comp = TEMPLATES_DB[key] ?? TEMPLATES_DB.modern
  return <Comp {...p} />
}

/* ----------------------- Shared helpers ----------------------- */

function BgBlur({ src }: { src: string | null }) {
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-10 w-full h-full"
        style={{
          background: src ? `url(${src}) center/cover no-repeat` : "#0f172a",
          filter: "blur(12px)",
          transform: "scale(1.1)",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-black/45" />
    </>
  )
}

function TokenIcon({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div
      className="w-48 h-48 rounded-2xl border-4 border-white/90 shadow-2xl bg-white/10 overflow-hidden flex-shrink-0"
      style={{
        background: src ? `url(${src}) center/cover no-repeat` : "#0b1220",
      }}
      role="img"
      aria-label={alt}
    />
  )
}

function ContractPill({ ca }: { ca: string }) {
  if (!ca) return null
  const copy = () => typeof navigator !== "undefined" && navigator.clipboard.writeText(ca)
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-black/60 text-white text-sm font-semibold shadow-md hover:bg-black/70 transition"
      title="Click to copy"
    >
      <span className="max-w-[70vw] md:max-w-[40vw] truncate">{ca}</span>
      <span className="opacity-80">📋</span>
    </button>
  )
}

function Ctas({ p }: { p: PortfolioDB }) {
  const Btn = (props: React.PropsWithChildren<{ href: string }>) => (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className="inline-block px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-500 transition"
    >
      {props.children}
    </a>
  )
  return (
    <div className="flex flex-wrap gap-3">
      {p.website_url && <Btn href={p.website_url}>Website</Btn>}
      {p.twitter_url && <Btn href={p.twitter_url}>X.com</Btn>}
      {p.telegram_url && <Btn href={p.telegram_url}>Telegram</Btn>}
    </div>
  )
}

/* ----------------------- Templates ----------------------- */

// Template 1 — Modern (was Centered)
function ModernTemplate(p: PortfolioDB) {
  return (
    <main className="min-h-screen text-white flex items-center justify-center p-6">
      <BgBlur src={p.banner_url} />
      <div className="flex items-center gap-8">
        <div className="flex-shrink-0">
          <div
            className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-white/90 shadow-2xl bg-white/10 overflow-hidden"
            style={{
              background: p.logo_url ? `url(${p.logo_url}) center/cover no-repeat` : "#0b1220",
            }}
            role="img"
            aria-label={`${p.token_name} icon`}
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow">
            {p.token_name} {p.ticker && <span className="opacity-90">({p.ticker})</span>}
          </h1>
          {p.slogan && <p className="text-lg text-white/90">{p.slogan}</p>}
          <div className="space-y-3">
            <ContractPill ca={p.contract_address} />
            <Ctas p={p} />
          </div>
        </div>
      </div>
    </main>
  )
}

// Template 2 — Classic (was Side-by-side)
function ClassicTemplate(p: PortfolioDB) {
  return (
    <main className="min-h-screen text-white flex items-center p-6">
      <BgBlur src={p.banner_url} />
      <section className="w-full max-w-5xl mx-auto">
        <div className="grid md:grid-cols-[200px,1fr] items-center gap-10">
          <div className="flex justify-center md:justify-start">
            <TokenIcon src={p.logo_url} alt={`${p.token_name} icon`} />
          </div>
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow">
              {p.token_name} {p.ticker && <span className="opacity-90">({p.ticker})</span>}
            </h1>
            {p.slogan && <p className="text-lg text-white/90">{p.slogan}</p>}
            <div className="space-y-3">
              <div className="flex justify-center md:justify-start">
                <ContractPill ca={p.contract_address} />
              </div>
              <div className="flex justify-center md:justify-start">
                <Ctas p={p} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

// Template 3 — Minimal
function MinimalTemplate(p: PortfolioDB) {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex items-center p-6">
      <section className="w-full max-w-4xl mx-auto">
        <div className="grid md:grid-cols-[200px,1fr] items-center gap-10">
          <div className="flex justify-center md:justify-start">
            <div
              className="w-48 h-48 rounded-xl border border-slate-200 shadow-sm bg-slate-50 flex-shrink-0"
              style={{
                background: p.logo_url ? `url(${p.logo_url}) center/cover no-repeat` : "#e2e8f0",
              }}
            />
          </div>
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold">
              {p.token_name} {p.ticker && <span className="text-slate-500">({p.ticker})</span>}
            </h1>
            {p.slogan && <p className="text-lg text-slate-700">{p.slogan}</p>}
            {p.contract_address && (
              <div className="flex justify-center md:justify-start">
                <code className="inline-block px-3 py-2 bg-slate-100 rounded text-sm break-all max-w-full">
                  {p.contract_address}
                </code>
              </div>
            )}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {p.website_url && (
                <a
                  className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 transition"
                  href={p.website_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Website
                </a>
              )}
              {p.twitter_url && (
                <a
                  className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 transition"
                  href={p.twitter_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  X.com
                </a>
              )}
              {p.telegram_url && (
                <a
                  className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 transition"
                  href={p.telegram_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Telegram
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
