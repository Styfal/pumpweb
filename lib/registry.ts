// /lib/templates/registry.ts
export type Template = {
  name: string
  display_name: string
  html_template: string
  css_template: string
}

/* -------------------- SHARED -------------------- */
const BASE_CSS = `
:root {
  --fg: #fff;
  --fg-dim: rgba(255,255,255,0.85);
  --fg-dimmer: rgba(255,255,255,0.7);
}
*{box-sizing:border-box}
html,body,.portfolio-container{margin:0;padding:0}
a{color:inherit;text-decoration:none}
.btn{display:inline-block;padding:.6rem .9rem;border-radius:.5rem;font-weight:700}
.btn-primary{background:#10b981;color:#fff}
.badge{display:inline-flex;gap:.5rem;align-items:center;padding:.25rem .5rem;background:rgba(0,0,0,.5);border-radius:.5rem}
.container{max-width:1100px;margin:0 auto;padding:24px}
.icon{width:160px;height:160px;border:4px solid rgba(255,255,255,.9);border-radius:1.25rem;background:#0b1220 center/cover no-repeat;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.copy{cursor:pointer}
.subtitle{color:var(--fg-dim);margin-top:8px}
.ctas{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:14px}
.bg-blur{position:fixed;inset:0;z-index:-2;background:#0f172a center/cover no-repeat;filter:blur(12px);transform:scale(1.05)}
.bg-overlay{position:fixed;inset:0;z-index:-1;background:rgba(0,0,0,.45)}
.main{min-height:100vh;display:flex;align-items:center;color:var(--fg)}
.contract{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
`

/* -------------------- MODERN -------------------- */
const MODERN_HTML = `
{{#BANNER_URL}}<div class="bg-blur" style="background-image:url('{{BANNER_URL}}')"></div>{{/BANNER_URL}}
<div class="bg-overlay"></div>

<main class="main">
  <div class="container modern">
    <div class="icon" style="{{#LOGO_URL}}background-image:url('{{LOGO_URL}}'){{/LOGO_URL}}"></div>
    <div class="content">
      <h1 class="title">
        {{TOKEN_NAME}} {{#TICKER}}<span class="ticker">({{TICKER}})</span>{{/TICKER}}
      </h1>
      {{#SLOGAN}}<div class="subtitle">{{SLOGAN}}</div>{{/SLOGAN}}

      {{#CONTRACT_ADDRESS}}
        <div class="badge contract copy" onclick="navigator.clipboard && navigator.clipboard.writeText('{{CONTRACT_ADDRESS}}')">
          <span>{{CONTRACT_ADDRESS}}</span><span>📋</span>
        </div>
      {{/CONTRACT_ADDRESS}}

      <div class="ctas">
        {{#BUY_LINK}}{{#TICKER}}<a class="btn btn-primary" href="{{BUY_LINK}}" target="_blank">Buy {{TICKER}}</a>{{/TICKER}}{{/BUY_LINK}}
        {{#BUY_LINK}}{{^TICKER}}<a class="btn btn-primary" href="{{BUY_LINK}}" target="_blank">Buy Coin</a>{{/TICKER}}{{/BUY_LINK}}
        {{#WEBSITE_URL}}<a class="btn btn-primary" href="{{WEBSITE_URL}}" target="_blank">Website</a>{{/WEBSITE_URL}}
        {{#TWITTER_URL}}<a class="btn btn-primary" href="{{TWITTER_URL}}" target="_blank">X.com</a>{{/TWITTER_URL}}
        {{#TELEGRAM_URL}}<a class="btn btn-primary" href="{{TELEGRAM_URL}}" target="_blank">Telegram</a>{{/TELEGRAM_URL}}
      </div>
    </div>
  </div>
</main>
`

const MODERN_CSS = `
${BASE_CSS}
/* layout */
.container.modern{display:flex;gap:60px;align-items:center;justify-content:center;max-width:1400px;margin:0 auto}
.container.modern .content{flex:1;min-width:0;max-width:700px}
.container.modern .icon{width:240px;height:240px;flex-shrink:0}
.title{font-size:56px;margin:0;font-weight:900;line-height:1.15}
.ticker{opacity:.9}
/* contract pill */
.badge.contract{margin-top:16px;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;font-size:15px;padding:.4rem .75rem}
/* buttons */
.ctas{align-items:center;margin-top:20px}
.btn{font-size:16px;padding:.75rem 1.25rem}
.subtitle{font-size:20px;margin-top:12px}
/* responsive */
@media (max-width: 820px){
  .container.modern{flex-direction:column;text-align:center}
  .badge.contract{margin-left:auto;margin-right:auto}
  .ctas{justify-content:center}
  .title{font-size:42px}
  .container.modern .icon{width:180px;height:180px}
}
@media (max-width: 640px){
  .badge.contract{white-space:normal;word-break:break-all;overflow-wrap:anywhere;text-overflow:clip}
}
`

/* -------------------- CLASSIC -------------------- */
const CLASSIC_HTML = `
{{#BANNER_URL}}<div class="bg-blur" style="background-image:url('{{BANNER_URL}}')"></div>{{/BANNER_URL}}
<div class="bg-overlay"></div>

<main class="main">
  <div class="container classic">
    <div class="icon" style="margin:0 auto; {{#LOGO_URL}}background-image:url('{{LOGO_URL}}'){{/LOGO_URL}}"></div>
    <h1 class="classic-title">
      {{TOKEN_NAME}} {{#TICKER}}<span class="classic-ticker">({{TICKER}})</span>{{/TICKER}}
    </h1>
    {{#SLOGAN}}<div class="subtitle" style="text-align:center">{{SLOGAN}}</div>{{/SLOGAN}}

    {{#CONTRACT_ADDRESS}}
      <div class="badge contract copy" onclick="navigator.clipboard && navigator.clipboard.writeText('{{CONTRACT_ADDRESS}}')">
        <span>{{CONTRACT_ADDRESS}}</span><span>📋</span>
      </div>
    {{/CONTRACT_ADDRESS}}

    <div class="ctas" style="justify-content:center;margin-top:16px">
      {{#BUY_LINK}}<a class="btn btn-primary" href="{{BUY_LINK}}" target="_blank">Buy {{#TICKER}}{{TICKER}}{{/TICKER}}{{^TICKER}}Coin{{/TICKER}}</a>{{/BUY_LINK}}
      {{#WEBSITE_URL}}<a class="btn btn-primary" href="{{WEBSITE_URL}}" target="_blank">Website</a>{{/WEBSITE_URL}}
      {{#TWITTER_URL}}<a class="btn btn-primary" href="{{TWITTER_URL}}" target="_blank">X.com</a>{{/TWITTER_URL}}
      {{#TELEGRAM_URL}}<a class="btn btn-primary" href="{{TELEGRAM_URL}}" target="_blank">Telegram</a>{{/TELEGRAM_URL}}
    </div>
  </div>
</main>
`

const CLASSIC_CSS = `
${BASE_CSS}
.classic{text-align:center}
.classic .icon{margin:0 auto}
.classic-title{font-size:42px;margin:18px 0 0 0;font-weight:900}
.classic-ticker{opacity:.9}
@media (max-width: 640px){
  .badge.contract{white-space:normal;word-break:break-all;overflow-wrap:anywhere;text-overflow:clip;margin-left:auto;margin-right:auto}
}
`

/* -------------------- MINIMAL (white, modern-like structure) -------------------- */
const MINIMAL_HTML = `
<main class="minimal-main">
  <div class="container minimal">
    <div class="icon minimal-icon" style="{{#LOGO_URL}}background-image:url('{{LOGO_URL}}'){{/LOGO_URL}}"></div>
    <div class="content">
      <h1 class="minimal-title">
        {{TOKEN_NAME}} {{#TICKER}}<span class="minimal-ticker">({{TICKER}})</span>{{/TICKER}}
      </h1>
      {{#SLOGAN}}<div class="minimal-subtitle">{{SLOGAN}}</div>{{/SLOGAN}}

      {{#CONTRACT_ADDRESS}}
        <code class="minimal-contract copy" onclick="navigator.clipboard && navigator.clipboard.writeText('{{CONTRACT_ADDRESS}}')">{{CONTRACT_ADDRESS}}</code>
      {{/CONTRACT_ADDRESS}}

      <div class="ctas">
        {{#BUY_LINK}}<a class="btn minimal-btn" href="{{BUY_LINK}}" target="_blank">Buy {{#TICKER}}{{TICKER}}{{/TICKER}}{{^TICKER}}Coin{{/TICKER}}</a>{{/BUY_LINK}}
        {{#WEBSITE_URL}}<a class="btn minimal-btn" href="{{WEBSITE_URL}}" target="_blank">Website</a>{{/WEBSITE_URL}}
        {{#TWITTER_URL}}<a class="btn minimal-btn" href="{{TWITTER_URL}}" target="_blank">X.com</a>{{/TWITTER_URL}}
        {{#TELEGRAM_URL}}<a class="btn minimal-btn" href="{{TELEGRAM_URL}}" target="_blank">Telegram</a>{{/TELEGRAM_URL}}
      </div>
    </div>
  </div>
</main>
`

const MINIMAL_CSS = `
*{box-sizing:border-box}html,body,.portfolio-container{margin:0;padding:0}
a{text-decoration:none}
.minimal-main{min-height:100vh;display:flex;align-items:center;background:#fff;color:#111}
.btn{display:inline-block;padding:.5rem .75rem;border-radius:.5rem;color:#111}
.minimal-btn{border:1px solid #e5e7eb}
.container.minimal{display:flex;gap:48px;align-items:center;justify-content:center;max-width:1200px;margin:0 auto;padding:24px}
.icon.minimal-icon{width:200px;height:200px;flex-shrink:0;border-radius:16px;border:1px solid #e5e7eb;background:#f1f5f9 center/cover no-repeat}
.container.minimal .content{flex:1;min-width:0;max-width:700px}
.minimal-title{font-size:40px;margin:0;font-weight:800;line-height:1.2}
.minimal-ticker{color:#6b7280}
.minimal-subtitle{color:#1f2937;font-size:18px;margin-top:8px}
.minimal-contract{display:inline-block;margin-top:10px;padding:.25rem .5rem;background:#f3f4f6;border-radius:.375rem;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
/* tablet/phone */
@media (max-width: 820px){
  .container.minimal{flex-direction:column;text-align:center}
  .minimal-contract{margin-left:auto;margin-right:auto}
  .ctas{justify-content:center}
  .icon.minimal-icon{width:160px;height:160px}
  .minimal-title{font-size:32px}
}
/* wrap contract for small screens */
@media (max-width: 640px){
  .minimal-contract{white-space:normal;word-break:break-all;overflow-wrap:anywhere;text-overflow:clip}
}
`

/* -------------------- EXPORT -------------------- */
export function getTemplateByName(name?: string) {
  const key = (name || "modern").toLowerCase()
  if (key === "classic") return { name: "classic", display_name: "Classic", html_template: CLASSIC_HTML, css_template: CLASSIC_CSS }
  if (key === "minimal") return { name: "minimal", display_name: "Minimal", html_template: MINIMAL_HTML, css_template: MINIMAL_CSS }
  return { name: "modern", display_name: "Modern", html_template: MODERN_HTML, css_template: MODERN_CSS }
}