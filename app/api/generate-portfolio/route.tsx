import { type NextRequest, NextResponse } from "next/server"


interface PortfolioData {
  tokenName: string
  ticker: string
  contractAddress: string
  slogan: string
  twitter: string
  telegram: string
  template: string
  tokenIcon: string | null
  headerImage: string | null
}

export async function POST(request: NextRequest) {
  try {
    const data: PortfolioData = await request.json()

    const html = generatePortfolioHTML(data)

    return NextResponse.json({ html })
  } catch (error) {
    console.error("Error generating portfolio:", error)
    return NextResponse.json({ error: "Failed to generate portfolio" }, { status: 500 })
  }
}

function generatePortfolioHTML(data: PortfolioData): string {
  const { tokenName, ticker, contractAddress, slogan, twitter, telegram, tokenIcon, headerImage, template } = data

  // Generate social links HTML
  const twitterLink = twitter ? `<a href="${twitter}" target="_blank" class="social-link twitter">Twitter</a>` : ""
  const telegramLink = telegram ? `<a href="${telegram}" target="_blank" class="social-link telegram">Telegram</a>` : ""

  // Get template-specific styles
  const templateStyles = getTemplateStyles(template)

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${tokenName} - Portfolio</title>
      <style>${templateStyles}</style>
    </head>
    <body>
      <div class="container">
        ${headerImage ? `<div class="header-image"><img src="${headerImage}" alt="Header" /></div>` : ""}
        
        <div class="content">
          <div class="token-info">
            ${tokenIcon ? `<div class="token-icon"><img src="${tokenIcon}" alt="${tokenName} Icon" /></div>` : ""}
            <h1 class="token-name">${tokenName}</h1>
            ${ticker ? `<div class="ticker">$${ticker}</div>` : ""}
            ${slogan ? `<p class="slogan">${slogan}</p>` : ""}
            ${contractAddress ? `<div class="contract"><strong>Contract Address:</strong><br><span class="address">${contractAddress}</span></div>` : ""}
          </div>

          ${
            twitterLink || telegramLink
              ? `
            <div class="social-links">
              <h3>Connect With Us</h3>
              <div class="links">
                ${twitterLink}
                ${telegramLink}
              </div>
            </div>
          `
              : ""
          }

          <div class="footer">
            <p>Generated with Portfolio Generator</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function getTemplateStyles(template: string): string {
  const baseStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
      line-height: 1.6; 
      min-height: 100vh;
    }
    .container { max-width: 1000px; margin: 0 auto; min-height: 100vh; }
    .header-image { width: 100%; height: 300px; overflow: hidden; }
    .header-image img { width: 100%; height: 100%; object-fit: cover; }
    .content { padding: 40px 20px; }
    .token-info { text-align: center; margin-bottom: 50px; }
    .token-icon { margin-bottom: 20px; }
    .token-icon img { width: 120px; height: 120px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.2); }
    .token-name { font-size: 3rem; margin-bottom: 15px; font-weight: 700; }
    .ticker { font-size: 1.5rem; margin-bottom: 20px; font-weight: 600; }
    .slogan { font-size: 1.2rem; margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto; }
    .contract { font-size: 1rem; margin-top: 30px; padding: 20px; border-radius: 10px; }
    .address { font-family: 'Courier New', monospace; word-break: break-all; }
    .social-links { text-align: center; margin-bottom: 50px; }
    .social-links h3 { margin-bottom: 25px; font-size: 1.5rem; }
    .links { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .social-link { 
      display: inline-block; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 25px; 
      font-weight: 600; 
      transition: all 0.3s ease;
    }
    .footer { text-align: center; padding: 20px; font-size: 0.9rem; opacity: 0.7; }
    
    @media (max-width: 768px) {
      .token-name { font-size: 2rem; }
      .ticker { font-size: 1.2rem; }
      .content { padding: 20px 15px; }
      .links { flex-direction: column; align-items: center; }
    }
  `

  switch (template) {
    case "modern":
      return (
        baseStyles +
        `
        body { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
        }
        .container { 
          background: rgba(255,255,255,0.1); 
          backdrop-filter: blur(20px); 
          border-radius: 20px; 
          margin: 20px; 
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .token-name { color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .ticker { color: #e0e6ff; }
        .contract { background: rgba(255,255,255,0.1); }
        .social-link { background: rgba(255,255,255,0.2); color: white; }
        .social-link:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
      `
      )
    case "classic":
      return (
        baseStyles +
        `
        body { background: #f8f9fa; color: #333; }
        .container { 
          background: white; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
          border-radius: 15px; 
          margin: 20px; 
        }
        .token-name { color: #2c3e50; }
        .ticker { color: #7f8c8d; }
        .contract { background: #f8f9fa; border: 1px solid #dee2e6; }
        .social-link.twitter { background: #1da1f2; color: white; }
        .social-link.telegram { background: #0088cc; color: white; }
        .social-link:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
      `
      )
    case "minimal":
      return (
        baseStyles +
        `
        body { background: white; color: #333; }
        .container { border: 2px solid #f0f0f0; margin: 20px; }
        .token-name { color: #000; font-weight: 300; }
        .ticker { color: #666; }
        .contract { background: #fafafa; border: 1px solid #eee; }
        .social-link { border: 2px solid #333; color: #333; background: transparent; }
        .social-link:hover { background: #333; color: white; }
      `
      )
    case "crypto":
      return (
        baseStyles +
        `
        body { 
          background: linear-gradient(45deg, #0d1421 0%, #1a2332 100%); 
          color: #00ff88; 
        }
        .container { 
          background: rgba(26,35,50,0.9); 
          border: 2px solid #00ff88; 
          border-radius: 15px; 
          margin: 20px; 
          box-shadow: 0 0 30px rgba(0,255,136,0.3);
        }
        .token-name { 
          color: #00ff88; 
          text-shadow: 0 0 20px #00ff88; 
          animation: glow 2s ease-in-out infinite alternate;
        }
        .ticker { color: #ffd700; text-shadow: 0 0 10px #ffd700; }
        .contract { background: rgba(0,255,136,0.1); border: 1px solid #00ff88; }
        .social-link { 
          background: linear-gradient(45deg, #00ff88, #00cc6a); 
          color: #0d1421; 
          font-weight: bold;
        }
        .social-link:hover { 
          box-shadow: 0 0 20px #00ff88; 
          transform: translateY(-2px);
        }
        
        @keyframes glow {
          from { text-shadow: 0 0 20px #00ff88; }
          to { text-shadow: 0 0 30px #00ff88, 0 0 40px #00ff88; }
        }
      `
      )
    default:
      return baseStyles
  }
}
