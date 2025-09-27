// /lib/templates/registry.ts
export type Template = {
  name: string;
  display_name: string;
  html_template: string;
  css_template: string;
};

// Helpers shared by all three templates
const BASE_CSS = `
:root {
  --fg: #fff;
  --fg-dim: rgba(255,255,255,0.85);
  --fg-dimmer: rgba(255,255,255,0.7);
}
* { box-sizing: border-box; }
body, html, .portfolio-container { margin:0; padding:0; }
a { color: inherit; text-decoration: none; }
.btn { display:inline-block; padding:.6rem .9rem; border-radius:.5rem; font-weight:700; }
.btn-primary { background:#10b981; color:#fff; }
.badge { display:inline-flex; gap:.5rem; align-items:center; padding:.25rem .5rem; background:rgba(0,0,0,.5); border-radius:.5rem; }
.container { max-width: 1100px; margin: 0 auto; padding: 24px; }
.icon { width: 160px; height:160px; border:4px solid rgba(255,255,255,.9); border-radius: 1.25rem; background:#0b1220 center/cover no-repeat; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
.copy { cursor:pointer; }
.subtitle { color: var(--fg-dim); margin-top: 8px; }
.desc { color: var(--fg-dimmer); margin-top: 6px; }
.ctas { display:flex; flex-wrap:wrap; gap:.5rem; margin-top: 14px; }
.bg-blur { position:fixed; inset:0; z-index:-2; background:#0f172a center/cover no-repeat; filter: blur(12px); transform: scale(1.05); }
.bg-overlay { position:fixed; inset:0; z-index:-1; background: rgba(0,0,0,.45); }
.main { min-height: 100vh; display:flex; align-items:center; color:var(--fg); }
.contract { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace; }
`;

/* -------------------- MODERN (centered) -------------------- */
const MODERN_HTML = `
{{#BANNER_URL}}<div class="bg-blur" style="background-image:url('{{BANNER_URL}}')"></div>{{/BANNER_URL}}
<div class="bg-overlay"></div>

<main class="main">
  <div class="container" style="text-align:center">
    <div class="icon" style="{{#LOGO_URL}}background-image:url('{{LOGO_URL}}'){{/LOGO_URL}}"></div>
    <h1 style="font-size:42px; margin:18px 0 0 0; font-weight:900">
      {{TOKEN_NAME}} {{#TICKER}}<span style="opacity:.9">({{TICKER}})</span>{{/TICKER}}
    </h1>
    {{#SLOGAN}}<div class="subtitle">{{SLOGAN}}</div>{{/SLOGAN}}
    {{#DESCRIPTION}}<div class="desc">{{DESCRIPTION}}</div>{{/DESCRIPTION}}

    {{#CONTRACT_ADDRESS}}
      <div class="badge contract copy" onclick="navigator.clipboard && navigator.clipboard.writeText('{{CONTRACT_ADDRESS}}')">
        <span>Contract:</span><span>{{CONTRACT_ADDRESS}}</span><span>📋</span>
      </div>
    {{/CONTRACT_ADDRESS}}

    <div class="ctas">
      {{#WEBSITE_URL}}<a class="btn btn-primary" href="{{WEBSITE_URL}}" target="_blank">Website</a>{{/WEBSITE_URL}}
      {{#TWITTER_URL}}<a class="btn btn-primary" href="{{TWITTER_URL}}" target="_blank">X.com</a>{{/TWITTER_URL}}
      {{#TELEGRAM_URL}}<a class="btn btn-primary" href="{{TELEGRAM_URL}}" target="_blank">Telegram</a>{{/TELEGRAM_URL}}
    </div>
  </div>
</main>
`;
const MODERN_CSS = `${BASE_CSS}`;

/* -------------------- CLASSIC (side-by-side) -------------------- */
const CLASSIC_HTML = `
{{#BANNER_URL}}<div class="bg-blur" style="background-image:url('{{BANNER_URL}}')"></div>{{/BANNER_URL}}
<div class="bg-overlay"></div>

<main class="main">
  <div class="container" style="display:grid; grid-template-columns: 220px 1fr; gap: 40px; align-items:center;">
    <div style="justify-self:center">
      <div class="icon" style="{{#LOGO_URL}}background-image:url('{{LOGO_URL}}'){{/LOGO_URL}}"></div>
    </div>
    <div>
      <h1 style="font-size:42px; margin:0; font-weight:900">
        {{TOKEN_NAME}} {{#TICKER}}<span style="opacity:.9">({{TICKER}})</span>{{/TICKER}}
      </h1>
      {{#SLOGAN}}<div class="subtitle">{{SLOGAN}}</div>{{/SLOGAN}}
      {{#DESCRIPTION}}<div class="desc">{{DESCRIPTION}}</div>{{/DESCRIPTION}}

      {{#CONTRACT_ADDRESS}}
        <div class="badge contract copy" onclick="navigator.clipboard && navigator.clipboard.writeText('{{CONTRACT_ADDRESS}}')" style="margin-top:10px">
          <span>Contract:</span><span>{{CONTRACT_ADDRESS}}</span><span>📋</span>
        </div>
      {{/CONTRACT_ADDRESS}}

      <div class="ctas" style="margin-top:14px">
        {{#WEBSITE_URL}}<a class="btn btn-primary" href="{{WEBSITE_URL}}" target="_blank">Website</a>{{/WEBSITE_URL}}
        {{#TWITTER_URL}}<a class="btn btn-primary" href="{{TWITTER_URL}}" target="_blank">X.com</a>{{/TWITTER_URL}}
        {{#TELEGRAM_URL}}<a class="btn btn-primary" href="{{TELEGRAM_URL}}" target="_blank">Telegram</a>{{/TELEGRAM_URL}}
      </div>
    </div>
  </div>
</main>
`;
const CLASSIC_CSS = `${BASE_CSS}`;

/* -------------------- MINIMAL (white) -------------------- */
const MINIMAL_HTML = `
<main style="min-height:100vh; display:flex; align-items:center; color:#111; background:#fff">
  <div class="container" style="max-width:1000px">
    <div style="display:grid; grid-template-columns: 180px 1fr; gap: 28px; align-items:center;">
      <div style="justify-self:center">
        <div style="width:160px; height:160px; border-radius:16px; border:1px solid #e5e7eb; background:#f1f5f9 center/cover no-repeat; {{#LOGO_URL}}background-image:url('{{LOGO_URL}}'){{/LOGO_URL}}"></div>
      </div>
      <div>
        <h1 style="font-size:38px; margin:0 0 4px 0; font-weight:800">
          {{TOKEN_NAME}} {{#TICKER}}<span style="color:#6b7280">({{TICKER}})</span>{{/TICKER}}
        </h1>
        {{#SLOGAN}}<div style="color:#1f2937; font-size:18px; margin:6px 0 0 0">{{SLOGAN}}</div>{{/SLOGAN}}
        {{#DESCRIPTION}}<div style="color:#334155; margin-top:6px">{{DESCRIPTION}}</div>{{/DESCRIPTION}}
        {{#CONTRACT_ADDRESS}}
          <code style="display:inline-block; padding:.25rem .5rem; background:#f3f4f6; border-radius:.375rem; margin-top:10px">{{CONTRACT_ADDRESS}}</code>
        {{/CONTRACT_ADDRESS}}
        <div style="display:flex; flex-wrap:wrap; gap:.5rem; margin-top:12px">
          {{#WEBSITE_URL}}<a class="btn" style="border:1px solid #e5e7eb" href="{{WEBSITE_URL}}" target="_blank">Website</a>{{/WEBSITE_URL}}
          {{#TWITTER_URL}}<a class="btn" style="border:1px solid #e5e7eb" href="{{TWITTER_URL}}" target="_blank">X.com</a>{{/TWITTER_URL}}
          {{#TELEGRAM_URL}}<a class="btn" style="border:1px solid #e5e7eb" href="{{TELEGRAM_URL}}" target="_blank">Telegram</a>{{/TELEGRAM_URL}}
        </div>
      </div>
    </div>
  </div>
</main>
`;
const MINIMAL_CSS = `
*{box-sizing:border-box}body,html,.portfolio-container{margin:0;padding:0}a{text-decoration:none}
.btn{display:inline-block;padding:.5rem .75rem;border-radius:.5rem;color:#111}
`;

export function getTemplateByName(name?: string): Template {
  const key = (name || "modern").toLowerCase();
  if (key === "classic") {
    return { name: "classic", display_name: "Classic", html_template: CLASSIC_HTML, css_template: CLASSIC_CSS };
  }
  if (key === "minimal") {
    return { name: "minimal", display_name: "Minimal", html_template: MINIMAL_HTML, css_template: MINIMAL_CSS };
  }
  return { name: "modern", display_name: "Modern", html_template: MODERN_HTML, css_template: MODERN_CSS };
}
