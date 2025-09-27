"use client";

import React from "react";

export type PortfolioDB = {
  username: string;
  token_name: string;
  ticker: string;
  contract_address: string;
  slogan: string;
  description: string;
  twitter_url: string;
  telegram_url: string;
  website_url: string;
  template: string;               // "modern" | "classic" | "minimal"
  logo_url: string | null;
  banner_url: string | null;
};

export type TemplateDBComponent = (p: PortfolioDB) => React.JSX.Element;

export const TEMPLATES_DB: Record<string, TemplateDBComponent> = {
  modern: ModernTemplate,     // was centered
  classic: ClassicTemplate,   // was side
  minimal: MinimalTemplate,
};

export function renderTemplateDB(p: PortfolioDB) {
  const key = (p.template || "modern").toLowerCase();
  const Comp = TEMPLATES_DB[key] ?? TEMPLATES_DB.modern;
  return <Comp {...p} />;
}

/* ----------------------- Shared helpers (unchanged) ----------------------- */

function BgBlur({ src }: { src: string | null }) {
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          background: src ? `url(${src}) center/cover no-repeat` : "#0f172a",
          filter: "blur(12px)",
          transform: "scale(1.05)",
        }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-black/45" />
    </>
  );
}

function TokenIcon({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div
      className="w-48 h-48 rounded-2xl border-4 border-white/90 shadow-2xl bg-white/10 overflow-hidden"
      style={{
        background: src ? `url(${src}) center/cover no-repeat` : "#0b1220",
      }}
      role="img"
      aria-label={alt}
    />
  );
}

function ContractPill({ ca }: { ca: string }) {
  if (!ca) return null;
  const copy = () => typeof navigator !== "undefined" && navigator.clipboard.writeText(ca);
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-black/60 text-white text-sm font-semibold shadow-md hover:bg-black/70 transition"
      title="Click to copy"
    >
      <span className="max-w-[70vw] md:max-w-[40vw] truncate">{ca}</span>
      <span className="opacity-80">📋</span>
    </button>
  );
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
  );
  return (
    <div className="flex flex-wrap gap-3">
      {p.website_url && <Btn href={p.website_url}>Website</Btn>}
      {p.twitter_url && <Btn href={p.twitter_url}>X.com</Btn>}
      {p.telegram_url && <Btn href={p.telegram_url}>Telegram</Btn>}
    </div>
  );
}

/* ----------------------- Templates ----------------------- */

// Template 1 — Modern (was Centered)
function ModernTemplate(p: PortfolioDB) {
  return (
    <main className="min-h-screen text-white flex items-center justify-center">
      <BgBlur src={p.banner_url} />
      <section className="w-full max-w-3xl mx-auto px-6">
        <div className="flex flex-col items-center text-center gap-5">
          <TokenIcon src={p.logo_url} alt={`${p.token_name} icon`} />
          <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow">
            {p.token_name} {p.ticker && <span className="opacity-90">({p.ticker})</span>}
          </h1>
          {p.slogan && <p className="text-lg text-white/90">{p.slogan}</p>}
          {p.description && <p className="text-base text-white/70">{p.description}</p>}
          <ContractPill ca={p.contract_address} />
          <Ctas p={p} />
        </div>
      </section>
    </main>
  );
}

// Template 2 — Classic (was Side-by-side)
function ClassicTemplate(p: PortfolioDB) {
  return (
    <main className="min-h-screen text-white flex items-center">
      <BgBlur src={p.banner_url} />
      <section className="w-full max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-[220px,1fr] items-center gap-10">
          <div className="justify-self-center md:justify-self-start">
            <TokenIcon src={p.logo_url} alt={`${p.token_name} icon`} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow">
              {p.token_name} {p.ticker && <span className="opacity-90">({p.ticker})</span>}
            </h1>
            {p.slogan && <p className="text-lg text-white/90">{p.slogan}</p>}
            {p.description && <p className="text-base text-white/70">{p.description}</p>}
            <ContractPill ca={p.contract_address} />
            <Ctas p={p} />
          </div>
        </div>
      </section>
    </main>
  );
}

// Template 3 — Minimal
function MinimalTemplate(p: PortfolioDB) {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex items-center">
      <section className="w-full max-w-4xl mx-auto px-6">
        <div className="grid md:grid-cols-[180px,1fr] items-center gap-8">
          <div className="justify-self-center md:justify-self-start">
            <div
              className="w-40 h-40 rounded-xl border border-slate-200 shadow-sm bg-slate-50"
              style={{
                background: p.logo_url ? `url(${p.logo_url}) center/cover no-repeat` : "#e2e8f0",
              }}
            />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold">
              {p.token_name} {p.ticker && <span className="text-slate-500">({p.ticker})</span>}
            </h1>
            {p.slogan && <p className="text-lg text-slate-700">{p.slogan}</p>}
            {p.description && <p className="text-base text-slate-600">{p.description}</p>}
            {p.contract_address && (
              <code className="inline-block px-2 py-1 bg-slate-100 rounded text-sm break-all">
                {p.contract_address}
              </code>
            )}
            <div className="flex flex-wrap gap-2">
              {p.website_url && (
                <a className="px-3 py-1.5 border rounded" href={p.website_url} target="_blank">
                  Website
                </a>
              )}
              {p.twitter_url && (
                <a className="px-3 py-1.5 border rounded" href={p.twitter_url} target="_blank">
                  X.com
                </a>
              )}
              {p.telegram_url && (
                <a className="px-3 py-1.5 border rounded" href={p.telegram_url} target="_blank">
                  Telegram
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
