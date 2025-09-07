export interface Portfolio {
  id: string
  username: string
  token_name: string
  ticker?: string
  contract_address?: string
  slogan?: string
  description?: string
  template: string
  logo_url?: string
  banner_url?: string
  twitter_url?: string
  telegram_url?: string
  website_url?: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  portfolio_id: string
  hel_payment_id?: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed"
  payment_url?: string
  verified_at?: string
  created_at: string
}

export interface Template {
  id: string
  name: string
  display_name: string
  description?: string
  preview_url?: string
  html_template: string
  css_template: string
  is_active: boolean
  created_at: string
}

export interface PortfolioFormData {
  username: string
  token_name: string
  ticker?: string
  contract_address?: string
  slogan?: string
  description?: string
  template: string
  logo_url?: string
  banner_url?: string
  twitter_url?: string
  telegram_url?: string
  website_url?: string
}
