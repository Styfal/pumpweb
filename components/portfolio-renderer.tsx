// /components/portfolio-renderer.tsx
// Server-safe: no "use client" needed
export type Portfolio = {
  token_name: string;
  ticker: string;
  contract_address: string;
  slogan: string;
  description: string;
  logo_url: string;   // empty string if none
  banner_url: string; // empty string if none
  twitter_url: string;
  telegram_url: string;
  website_url: string;
};

export type Template = {
  name: string;
  display_name: string;
  html_template: string;
  css_template: string;
};

type Props = { portfolio: Portfolio; template: Template };

// Simple mustache-like renderer with {{VAR}} and {{#VAR}}...{{/VAR}}
function renderTemplate(htmlTemplate: string, cssTemplate: string, data: Record<string, string>) {
  let html = htmlTemplate;

  // conditional blocks
  const blocks = [
    "LOGO_URL",
    "BANNER_URL",
    "TOKEN_NAME",
    "TICKER",
    "SLOGAN",
    "DESCRIPTION",
    "CONTRACT_ADDRESS",
    "TWITTER_URL",
    "TELEGRAM_URL",
    "WEBSITE_URL",
  ];

  for (const key of blocks) {
    const val = (data[key] || "").trim();
    const open = new RegExp(`{{#${key}}}`, "g");
    const close = new RegExp(`{{\\/${key}}}`, "g");
    if (val) {
      html = html.replace(open, "").replace(close, "");
    } else {
      // remove entire block content
      const blockRe = new RegExp(`{{#${key}}}[\\s\\S]*?{{\\/${key}}}`, "g");
      html = html.replace(blockRe, "");
    }
  }

  // simple variables
  Object.entries(data).forEach(([k, v]) => {
    const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    html = html.replace(re, v);
  });

  // inject CSS at the top
  html = `<style>${cssTemplate}</style>` + html;

  // add a tiny client-side listener for copy (no framework deps)
  html += `<script>document.addEventListener('click',function(e){var t=e.target.closest('[data-copy]');if(!t) return;var v=t.getAttribute('data-copy');if(!v) return;navigator.clipboard&&navigator.clipboard.writeText(v);});</script>`;

  return html;
}

export function PortfolioRenderer({ portfolio, template }: Props) {
  const data = {
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
  };

  const rendered = renderTemplate(template.html_template, template.css_template, data);

  return <div className="portfolio-container" dangerouslySetInnerHTML={{ __html: rendered }} />;
}
