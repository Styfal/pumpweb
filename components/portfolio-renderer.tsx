// /components/portfolio-renderer.tsx

export type Portfolio = {
  token_name: string;
  ticker: string;
  contract_address: string;
  slogan: string;
  logo_url: string;
  banner_url: string;
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

function renderTemplate(htmlTemplate: string, cssTemplate: string, data: Record<string, string>) {
  let html = htmlTemplate;

  // 1) Handle conditional blocks using PLAIN keys, e.g. LOGO_URL
  const blocks = [
    "LOGO_URL",
    "BANNER_URL",
    "TOKEN_NAME",
    "TICKER",
    "SLOGAN",
    "CONTRACT_ADDRESS",
    "TWITTER_URL",
    "TELEGRAM_URL",
    "WEBSITE_URL",
  ];

  for (const key of blocks) {
    const val = (data[key] || "").trim();
    if (val) {
      // keep content, strip the tags
      html = html.replace(new RegExp(`{{#${key}}}`, "g"), "").replace(new RegExp(`{{\\/${key}}}`, "g"), "");
    } else {
      // remove entire block
      html = html.replace(new RegExp(`{{#${key}}}[\\s\\S]*?{{\\/${key}}}`, "g"), "");
    }
  }

  // 2) Replace simple variables like {{LOGO_URL}} from the same plain map
  for (const [k, v] of Object.entries(data)) {
    const token = `{{${k}}}`;
    const re = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    html = html.replace(re, v);
  }

  // 3) Inject CSS and tiny copy handler
  html = `<style>${cssTemplate}</style>` + html;
  html += `<script>
    document.addEventListener('click',function(e){
      var t=e.target.closest('[data-copy]'); if(!t) return;
      var v=t.getAttribute('data-copy'); if(!v) return;
      if(navigator.clipboard) navigator.clipboard.writeText(v);
    });
  </script>`;

  return html;
}

export function PortfolioRenderer({ portfolio, template }: Props) {
  // PLAIN keys (no curly braces)
  const data: Record<string, string> = {
    TOKEN_NAME: portfolio.token_name || "",
    TICKER: portfolio.ticker || "",
    CONTRACT_ADDRESS: portfolio.contract_address || "",
    SLOGAN: portfolio.slogan || "",
    LOGO_URL: portfolio.logo_url || "",
    BANNER_URL: portfolio.banner_url || "",
    TWITTER_URL: portfolio.twitter_url || "",
    TELEGRAM_URL: portfolio.telegram_url || "",
    WEBSITE_URL: portfolio.website_url || "",
  };

  const rendered = renderTemplate(template.html_template, template.css_template, data);
  return <div className="portfolio-container" dangerouslySetInnerHTML={{ __html: rendered }} />;
}
