-- Execute the portfolio database setup
-- This script ensures all tables are created and populated

-- Create portfolios table to store portfolio data
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  token_name TEXT NOT NULL,
  ticker TEXT,
  contract_address TEXT,
  slogan TEXT,
  description TEXT,
  template TEXT NOT NULL DEFAULT 'modern',
  logo_url TEXT,
  banner_url TEXT,
  twitter_url TEXT,
  telegram_url TEXT,
  website_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table to track hel.io payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  hel_payment_id TEXT UNIQUE,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  payment_url TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create templates table for portfolio templates
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  html_template TEXT NOT NULL,
  css_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clear existing templates and insert fresh ones
DELETE FROM public.templates;

-- Insert default templates
INSERT INTO public.templates (name, display_name, description, html_template, css_template) VALUES
('modern', 'Modern', 'Clean and modern design with gradients', 
'<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TOKEN_NAME}} - {{TICKER}}</title>
    <style>{{CSS}}</style>
</head>
<body>
    <div class="container">
        <header class="hero">
            {{#LOGO_URL}}<img src="{{LOGO_URL}}" alt="{{TOKEN_NAME}} Logo" class="logo">{{/LOGO_URL}}
            <h1>{{TOKEN_NAME}}</h1>
            {{#TICKER}}<p class="ticker">${{TICKER}}</p>{{/TICKER}}
            {{#SLOGAN}}<p class="slogan">{{SLOGAN}}</p>{{/SLOGAN}}
        </header>
        
        {{#BANNER_URL}}<img src="{{BANNER_URL}}" alt="Banner" class="banner">{{/BANNER_URL}}
        
        <main class="content">
            {{#DESCRIPTION}}<div class="description">{{DESCRIPTION}}</div>{{/DESCRIPTION}}
            
            {{#CONTRACT_ADDRESS}}
            <div class="contract">
                <h3>Contract Address</h3>
                <code>{{CONTRACT_ADDRESS}}</code>
            </div>
            {{/CONTRACT_ADDRESS}}
            
            <div class="social-links">
                {{#TWITTER_URL}}<a href="{{TWITTER_URL}}" target="_blank">Twitter</a>{{/TWITTER_URL}}
                {{#TELEGRAM_URL}}<a href="{{TELEGRAM_URL}}" target="_blank">Telegram</a>{{/TELEGRAM_URL}}
                {{#WEBSITE_URL}}<a href="{{WEBSITE_URL}}" target="_blank">Website</a>{{/WEBSITE_URL}}
            </div>
        </main>
    </div>
</body>
</html>',

'body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
.container { max-width: 800px; margin: 0 auto; padding: 20px; }
.hero { text-align: center; color: white; margin-bottom: 40px; }
.logo { width: 100px; height: 100px; border-radius: 50%; margin-bottom: 20px; }
.hero h1 { font-size: 3em; margin: 0; }
.ticker { font-size: 1.5em; opacity: 0.9; }
.slogan { font-size: 1.2em; opacity: 0.8; }
.banner { width: 100%; max-height: 300px; object-fit: cover; border-radius: 10px; margin-bottom: 30px; }
.content { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.description { font-size: 1.1em; line-height: 1.6; margin-bottom: 30px; }
.contract { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
.contract code { background: #e9ecef; padding: 5px 10px; border-radius: 4px; font-family: monospace; }
.social-links { display: flex; gap: 15px; justify-content: center; }
.social-links a { background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 25px; transition: transform 0.2s; }
.social-links a:hover { transform: translateY(-2px); }'
),

('classic', 'Classic', 'Traditional and professional layout',
'<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TOKEN_NAME}} - {{TICKER}}</title>
    <style>{{CSS}}</style>
</head>
<body>
    <div class="container">
        <header class="header">
            {{#LOGO_URL}}<img src="{{LOGO_URL}}" alt="{{TOKEN_NAME}} Logo" class="logo">{{/LOGO_URL}}
            <div class="header-text">
                <h1>{{TOKEN_NAME}}</h1>
                {{#TICKER}}<span class="ticker">${{TICKER}}</span>{{/TICKER}}
            </div>
        </header>
        
        {{#SLOGAN}}<div class="slogan">{{SLOGAN}}</div>{{/SLOGAN}}
        
        {{#BANNER_URL}}<img src="{{BANNER_URL}}" alt="Banner" class="banner">{{/BANNER_URL}}
        
        <main class="main-content">
            {{#DESCRIPTION}}<section class="description">{{DESCRIPTION}}</section>{{/DESCRIPTION}}
            
            {{#CONTRACT_ADDRESS}}
            <section class="contract-section">
                <h2>Contract Information</h2>
                <div class="contract-address">{{CONTRACT_ADDRESS}}</div>
            </section>
            {{/CONTRACT_ADDRESS}}
            
            <footer class="social-footer">
                {{#TWITTER_URL}}<a href="{{TWITTER_URL}}" target="_blank">Twitter</a>{{/TWITTER_URL}}
                {{#TELEGRAM_URL}}<a href="{{TELEGRAM_URL}}" target="_blank">Telegram</a>{{/TELEGRAM_URL}}
                {{#WEBSITE_URL}}<a href="{{WEBSITE_URL}}" target="_blank">Website</a>{{/WEBSITE_URL}}
            </footer>
        </main>
    </div>
</body>
</html>',

'body { font-family: Georgia, serif; margin: 0; padding: 0; background: #f5f5f5; color: #333; }
.container { max-width: 900px; margin: 0 auto; background: white; min-height: 100vh; }
.header { display: flex; align-items: center; padding: 40px; border-bottom: 3px solid #2c3e50; }
.logo { width: 80px; height: 80px; border-radius: 8px; margin-right: 30px; }
.header-text h1 { margin: 0; font-size: 2.5em; color: #2c3e50; }
.ticker { font-size: 1.3em; color: #7f8c8d; }
.slogan { text-align: center; padding: 30px; font-size: 1.4em; font-style: italic; color: #34495e; background: #ecf0f1; }
.banner { width: 100%; max-height: 250px; object-fit: cover; }
.main-content { padding: 40px; }
.description { font-size: 1.1em; line-height: 1.8; margin-bottom: 40px; text-align: justify; }
.contract-section { margin-bottom: 40px; }
.contract-section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
.contract-address { background: #2c3e50; color: white; padding: 15px; font-family: monospace; border-radius: 4px; word-break: break-all; }
.social-footer { text-align: center; padding-top: 30px; border-top: 1px solid #bdc3c7; }
.social-footer a { display: inline-block; margin: 0 15px; padding: 12px 25px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; transition: background 0.3s; }
.social-footer a:hover { background: #2980b9; }'
);

-- Enable RLS on all tables
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "portfolios_public_read" ON public.portfolios;
DROP POLICY IF EXISTS "portfolios_admin_all" ON public.portfolios;
DROP POLICY IF EXISTS "payments_admin_only" ON public.payments;
DROP POLICY IF EXISTS "templates_public_read" ON public.templates;
DROP POLICY IF EXISTS "templates_admin_manage" ON public.templates;

-- RLS policies for portfolios (public read, no auth required for published portfolios)
CREATE POLICY "portfolios_public_read" ON public.portfolios 
  FOR SELECT USING (is_published = true);

CREATE POLICY "portfolios_admin_all" ON public.portfolios 
  FOR ALL USING (false); -- Admin access only, will be updated later

-- RLS policies for payments (admin only)
CREATE POLICY "payments_admin_only" ON public.payments 
  FOR ALL USING (false); -- Admin access only

-- RLS policies for templates (public read)
CREATE POLICY "templates_public_read" ON public.templates 
  FOR SELECT USING (is_active = true);

CREATE POLICY "templates_admin_manage" ON public.templates 
  FOR ALL USING (false); -- Admin access only

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_username ON public.portfolios(username);
CREATE INDEX IF NOT EXISTS idx_portfolios_published ON public.portfolios(is_published);
CREATE INDEX IF NOT EXISTS idx_payments_hel_id ON public.payments(hel_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
