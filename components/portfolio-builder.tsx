"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { z, ZodTypeAny } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, Eye, CreditCard, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PortfolioPreview } from "./portfolio-preview"
import { ImageUpload } from "./image-upload"
import { PaymentStatusComponent } from "./payment-status"
import { PaymentService } from "@/lib/payment-service"
import type { PortfolioFormData } from "@/lib/types"

// Helper function to validate image size (base64)
const validateImageSize = (base64String: string, maxSizeMB: number = 5): boolean => {
  if (!base64String) return true
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, "")
  const sizeInBytes = (base64Data.length * 3) / 4
  const sizeInMB = sizeInBytes / (1024 * 1024)
  return sizeInMB <= maxSizeMB
}

const isValidUrl = (url: string): boolean => {
  if (!url) return true
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const portfolioSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9-]+$/, "Username can only contain letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  token_name: z.string().min(1, "Token name is required").max(15, "Token name must be at most 50 characters"),
  ticker: z
    .string()
    .max(10, "Ticker symbol must be at most 10 characters")
    .regex(/^[A-Z0-9]*$/, "Ticker should only contain uppercase letters and numbers")
    .optional()
    .or(z.literal("")),
  contract_address: z.string().max(150, "Contract address must be valid").optional().or(z.literal("")),
  slogan: z.string().max(100, "Slogan must be at most 100 characters").optional().or(z.literal("")),
  twitter_url: z
    .string()
    .refine(val => isValidUrl(val), "Invalid Twitter URL")
    .refine(val => !val || val.includes("twitter.com") || val.includes("x.com"), "Must be a valid Twitter/X URL")
    .optional()
    .or(z.literal("")),
  telegram_url: z
    .string()
    .refine(val => isValidUrl(val), "Invalid Telegram URL")
    .refine(val => !val || val.includes("t.me"), "Must be a valid Telegram URL")
    .optional()
    .or(z.literal("")),
  website_url: z.string().refine(val => isValidUrl(val), "Invalid website URL").optional().or(z.literal("")),
  discord_url: z
    .string()
    .refine(val => isValidUrl(val), "Invalid Discord URL")
    .refine(val => !val || val.includes("discord") || val.includes("discord.gg"), "Must be a valid Discord link")
    .optional()
    .or(z.literal("")),
  template: z.enum(["modern", "classic", "minimal"], { errorMap: () => ({ message: "Please select a valid template" }) }),
  logo_url: z.string().refine(val => validateImageSize(val, 5), "Logo image must be smaller than 5MB").nullable().optional(),
  banner_url: z.string().refine(val => validateImageSize(val, 10), "Banner image must be smaller than 10MB").nullable().optional(),
})

export interface PortfolioData {
  username: string
  token_name: string
  ticker: string
  contract_address: string
  slogan: string
  twitter_url: string
  telegram_url: string
  website_url: string
  discord_url?: string
  template: string
  logo_url: string | null
  banner_url: string | null
}

const templates = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
  { value: "minimal", label: "Minimal" },
]

type FormStep = "form" | "payment" | "success"
type ValidationErrors = Partial<Record<keyof PortfolioData, string>>

export function PortfolioBuilder() {
  const [formData, setFormData] = useState<PortfolioData>({
    username: "",
    token_name: "",
    ticker: "",
    contract_address: "",
    slogan: "",
    twitter_url: "",
    telegram_url: "",
    website_url: "",
    discord_url: "",
    template: "modern",
    logo_url: null,
    banner_url: null,
  })

  const [currentStep, setCurrentStep] = useState<FormStep>("form")
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  const validateField = useCallback((field: keyof PortfolioData, value: PortfolioData[keyof PortfolioData]) => {
    try {
      const shape = portfolioSchema.shape as Record<string, ZodTypeAny>
      const fieldSchema = shape[String(field)]
      if (fieldSchema) {
        fieldSchema.parse(value)
        setValidationErrors(prev => ({ ...prev, [field]: undefined }))
        return true
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || "Invalid value"
        setValidationErrors(prev => ({ ...prev, [field]: errorMessage }))
        return false
      }
    }
    return true
  }, [])

  const validateForm = useCallback(() => {
    try {
      portfolioSchema.parse(formData)
      setValidationErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationErrors = {}
        error.errors.forEach(err => {
          const field = err.path[0] as keyof PortfolioData
          if (field && !errors[field]) errors[field] = err.message
        })
        setValidationErrors(errors)
        return false
      }
    }
    return false
  }, [formData])

  const handleInputChange = useCallback(
    (field: keyof PortfolioData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }))
      setError(null)
      setTimeout(() => validateField(field, value), 300)
    },
    [validateField]
  )

  const handleImageUpload = useCallback(
    (field: "logo_url" | "banner_url", imageData: string) => {
      setFormData(prev => ({ ...prev, [field]: imageData }))
      validateField(field, imageData)
    },
    [validateField]
  )

  const generateUsername = useCallback((tokenName: string) => {
    const base = tokenName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 20)
    const suffix = Math.random().toString(36).substring(2, 6)
    return `${base}-${suffix}`
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!validateForm()) {
      setError("Please fix the validation errors before submitting")
      setIsSubmitting(false)
      return
    }

    try {
      const portfolioData: PortfolioFormData = {
        ...formData,
        username: formData.username || generateUsername(formData.token_name),
        logo_url: formData.logo_url ?? undefined,
        banner_url: formData.banner_url ?? undefined,
      }

      const response = await PaymentService.createPayment(portfolioData, 50, "USD")

      if (!response.success || !response.payment) {
        setError(response.error || "Failed to create payment")
        return
      }

      const paymentWindow = window.open(response.payment.payment_url, "_blank", "width=500,height=700,scrollbars=yes,resizable=yes")
      if (!paymentWindow) {
        setError("Please allow popups to proceed with payment")
        return
      }

      setPaymentId(response.payment.id)
      setCurrentStep("payment")
    } catch (error) {
      console.error("Error during submission:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentComplete = useCallback(
    async (url: string) => {
      try {
        const saveResponse = await fetch("/api/save-portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            payment_id: paymentId,
          }),
        })

        if (!saveResponse.ok) throw new Error("Failed to save portfolio after payment.")
        setPortfolioUrl(url)
        setCurrentStep("success")
      } catch (err) {
        console.error("Error saving portfolio:", err)
        setError("Portfolio was paid but failed to save. Please contact support.")
      }
    },
    [formData, paymentId]
  )

  const isFormValid = formData.token_name.trim() !== "" && Object.values(validationErrors).every(v => !v)

  if (currentStep === "payment" && paymentId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-[#e0e0e0]">Payment Processing</h2>
          <p className="text-[#bbb]">Please complete your payment in the popup window. Your portfolio will be ready shortly.</p>
        </div>
        <PaymentStatusComponent paymentId={paymentId} onComplete={handlePaymentComplete} />
      </div>
    )
  }

  if (currentStep === "success" && portfolioUrl) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold" style={{ color: "#2a9e03" }}>
            Portfolio Created!
          </h2>
          <p className="text-lg text-[#bbb]">Your portfolio for {formData.token_name} is now live.</p>
        </div>

        <div className="space-y-4">
          <Button
            asChild
            size="lg"
            className="bg-[#2a9e03] hover:bg-[#248002] text-white border border-transparent rounded-md"
          >
            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer">
              View Your Portfolio
            </a>
          </Button>

          {formData.discord_url ? (
            <div>
              <Button asChild variant="outline" className="mt-2">
                <a href={formData.discord_url} target="_blank" rel="noopener noreferrer">
                  Manage Portfolio
                </a>
              </Button>
            </div>
          ) : null}

          <div className="text-sm text-[#bbb]">
            <p>
              Portfolio URL:{" "}
              <code className="px-2 py-1 rounded" style={{ background: "#1e1e1e", border: "1px solid #444" }}>
                {typeof window !== "undefined" ? `${window.location.origin}${portfolioUrl}` : portfolioUrl}
              </code>
            </p>
          </div>

          <Button
            variant="outline"
            className="border-[#444] text-[#e0e0e0] hover:bg-[#1e1e1e]/70"
            onClick={() => {
              setCurrentStep("form")
              setPaymentId(null)
              setPortfolioUrl(null)
              setValidationErrors({})
              setFormData({
                username: "",
                token_name: "",
                ticker: "",
                contract_address: "",
                slogan: "",
                twitter_url: "",
                telegram_url: "",
                website_url: "",
                discord_url: "",
                template: "modern",
                logo_url: null,
                banner_url: null,
              })
            }}
          >
            Create Another Portfolio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8" style={{ background: "#121212", color: "#e0e0e0" }}>
      <Card className="bg-[#1e1e1e] border-[#444]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Upload className="h-5 w-5" /> Portfolio Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-500/40">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label className="text-[#e0e0e0]">Token Name * (max 50 chars)</Label>
                <Input
                  value={formData.token_name}
                  onChange={e => handleInputChange("token_name", e.target.value)}
                  className={`bg-[#2a2a2a] border ${validationErrors.token_name ? "border-red-500" : "border-[#444]"} text-white placeholder:text-[#888]`}
                  required
                />
                {validationErrors.token_name && <p className="text-sm text-red-500 mt-1">{validationErrors.token_name}</p>}
              </div>

              <div>
                <Label className="text-[#e0e0e0]">Username (3-30 chars, letters/numbers/hyphens only)</Label>
                <Input
                  value={formData.username}
                  onChange={e => handleInputChange("username", e.target.value)}
                  placeholder="Auto-generated if empty"
                  className={`bg-[#2a2a2a] border ${validationErrors.username ? "border-red-500" : "border-[#444]"} text-white placeholder:text-[#888]`}
                />
                {validationErrors.username && <p className="text-sm text-red-500 mt-1">{validationErrors.username}</p>}
              </div>

              <div>
                <Label className="text-[#e0e0e0]">Ticker Symbol (max 10 chars, uppercase)</Label>
                <Input
                  value={formData.ticker}
                  onChange={e => handleInputChange("ticker", e.target.value.toUpperCase())}
                  placeholder="BTC, ETH, etc."
                  className={`bg-[#2a2a2a] border ${validationErrors.ticker ? "border-red-500" : "border-[#444]"} text-white placeholder:text-[#888]`}
                />
                {validationErrors.ticker && <p className="text-sm text-red-500 mt-1">{validationErrors.ticker}</p>}
              </div>

              <div>
                <Label className="text-[#e0e0e0]">Contract Address (0x format)</Label>
                <Input
                  value={formData.contract_address}
                  onChange={e => handleInputChange("contract_address", e.target.value)}
                  placeholder="0x..."
                  className={`bg-[#2a2a2a] border ${validationErrors.contract_address ? "border-red-500" : "border-[#444]"} text-white placeholder:text-[#888]`}
                />
                {validationErrors.contract_address && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.contract_address}</p>
                )}
              </div>

              <div>
                <Label className="text-[#e0e0e0]">Slogan (max 100 chars)</Label>
                <Input
                  value={formData.slogan}
                  onChange={e => handleInputChange("slogan", e.target.value)}
                  placeholder="A catchy tagline for your token"
                  className={`bg-[#2a2a2a] border ${validationErrors.slogan ? "border-red-500" : "border-[#444]"} text-white placeholder:text-[#888]`}
                />
                <div className="flex justify-between mt-1">
                  {validationErrors.slogan && <p className="text-sm text-red-500">{validationErrors.slogan}</p>}
                  <p className="text-sm text-[#888] ml-auto">{formData.slogan.length}/100</p>
                </div>
              </div>

              <div>
                <Label className="text-[#e0e0e0]">Twitter URL</Label>
                <Input
                  value={formData.twitter_url}
                  onChange={e => handleInputChange("twitter_url", e.target.value)}
                  placeholder="https://twitter.com/username or https://x.com/username"
                  className={`bg-[#2a2a2a] border ${validationErrors.twitter_url ? "border-red-500" : "border-[#444]"} text-white placeholder:text-[#888]`}
                />
                {validationErrors.twitter_url && <p className="text-sm text-red-500 mt-1">{validationErrors.twitter_url}</p>}
              </div>

              <div>
                <Label className="text-[#e0e0e0]">Telegram URL</Label>
                <Input
                  value={formData.telegram_url}
                  onChange={e => handleInputChange("telegram_url", e.target.value)}
                  placeholder="https://t.me/username"
                  className={`bg-[#2a2a2a] border ${validationErrors.telegram_url ? "border-red-500" : "border-[#444]"} text-white placeholder:text-[#888]`}
                />
                {validationErrors.telegram_url && <p className="text-sm text-red-500 mt-1">{validationErrors.telegram_url}</p>}
              </div>

              <div>
                <Label className="text-[#e0e0e0]">Website URL</Label>
                <Input
                  value={formData.website_url}
                  onChange={e => handleInputChange("website_url", e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className={`bg-[#2a2a2a] border ${validationErrors.website_url ? "border-red-500" : "border-[#444]"} text-white placeholder:text-[#888]`}
                />
                {validationErrors.website_url && <p className="text-sm text-red-500 mt-1">{validationErrors.website_url}</p>}
              </div>

              <div>
                <Label className="text-[#e0e0e0]">Template</Label>
                <Select value={formData.template} onValueChange={val => handleInputChange("template", val)}>
                  <SelectTrigger className={`bg-[#2a2a2a] border ${validationErrors.template ? "border-red-500" : "border-[#444]"} text-white`}>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e1e] text-white border-[#444]">
                    {templates.map(t => (
                      <SelectItem key={t.value} value={t.value} className="focus:bg-[#2a2a2a]">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.template && <p className="text-sm text-red-500 mt-1">{validationErrors.template}</p>}
              </div>

              <div>
                <ImageUpload
                  label="Logo Image (max 5MB)"
                  onImageUpload={img => handleImageUpload("logo_url", img)}
                  currentImage={formData.logo_url}
                />
                {validationErrors.logo_url && <p className="text-sm text-red-500 mt-1">{validationErrors.logo_url}</p>}
              </div>

              <div>
                <ImageUpload
                  label="Banner Image (max 10MB)"
                  onImageUpload={img => handleImageUpload("banner_url", img)}
                  currentImage={formData.banner_url}
                />
                {validationErrors.banner_url && <p className="text-sm text-red-500 mt-1">{validationErrors.banner_url}</p>}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#2a9e03] hover:bg-[#248002] text-white border border-transparent rounded-md"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "Creating Payment..." : (
                <> 
                  <CreditCard className="mr-2 h-4 w-4" /> Purchase Portfolio ($1)
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-[#444] text-[#e0e0e0] hover:bg-[#2a2a2a]"
              onClick={() => window.open("https://discord.gg/your-invite", "_blank")}
            >
              Manage Portfolio
            </Button>

            <div className="text-center text-sm text-[#bbb] space-y-1">
              <p>One-time payment of $1</p>
              <p>• Custom portfolio URL • Professional templates • Instant publishing</p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#1e1e1e] border-[#444]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Eye className="h-5 w-5" /> Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg p-2" style={{ background: "#555" }}>
            <PortfolioPreview data={formData} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
