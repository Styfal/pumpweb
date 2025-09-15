"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '')
  // Calculate size in bytes (base64 is ~4/3 the size of original)
  const sizeInBytes = (base64Data.length * 3) / 4
  const sizeInMB = sizeInBytes / (1024 * 1024)
  return sizeInMB <= maxSizeMB
}

// Helper function to validate URL format
const isValidUrl = (url: string): boolean => {
  if (!url) return true // Optional field
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Zod schema for portfolio validation
const portfolioSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9-]+$/, "Username can only contain letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  
  token_name: z
    .string()
    .min(1, "Token name is required")
    .max(15, "Token name must be at most 50 characters"),
  
  ticker: z
    .string()
    .max(10, "Ticker symbol must be at most 10 characters")
    .regex(/^[A-Z0-9]*$/, "Ticker should only contain uppercase letters and numbers")
    .optional()
    .or(z.literal("")),
  
  contract_address: z
    .string()
    .regex(/^(0x[a-fA-F0-9]{40})?$/, "Invalid contract address format")
    .optional()
    .or(z.literal("")),
  
  slogan: z
    .string()
    .max(100, "Slogan must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
  
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
  
  website_url: z
    .string()
    .refine(val => isValidUrl(val), "Invalid website URL")
    .optional()
    .or(z.literal("")),
  
  template: z
    .enum(["modern", "classic"], { errorMap: () => ({ message: "Please select a valid template" }) }),
  
  logo_url: z
    .string()
    .refine(val => validateImageSize(val, 5), "Logo image must be smaller than 5MB")
    .nullable()
    .optional(),
  
  banner_url: z
    .string()
    .refine(val => validateImageSize(val, 10), "Banner image must be smaller than 10MB")
    .nullable()
    .optional(),
})

export interface PortfolioData {
  username: string
  token_name: string
  ticker: string
  contract_address: string
  slogan: string
  description: string
  twitter_url: string
  telegram_url: string
  website_url: string
  template: string
  logo_url: string | null
  banner_url: string | null
}

const templates = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
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
    description: "",
    twitter_url: "",
    telegram_url: "",
    website_url: "",
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

  // Validate single field
  const validateField = useCallback((field: keyof PortfolioData, value: PortfolioData[keyof PortfolioData]) => {
    try {
      const fieldSchema = portfolioSchema.shape[field]
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

  // Validate entire form
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
          if (field && !errors[field]) {
            errors[field] = err.message
          }
        })
        setValidationErrors(errors)
        return false
      }
    }
    return false
  }, [formData])

  const handleInputChange = useCallback((field: keyof PortfolioData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
    
    // Validate field after a short delay to avoid excessive validation
    setTimeout(() => {
      validateField(field, value)
    }, 300)
  }, [validateField])

  const handleImageUpload = useCallback((field: "logo_url" | "banner_url", imageData: string) => {
    setFormData((prev) => ({ ...prev, [field]: imageData }))
    validateField(field, imageData)
  }, [validateField])

  const generateUsername = useCallback((tokenName: string) => {
    const base = tokenName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 20)

    const suffix = Math.random().toString(36).substring(2, 6)
    return `${base}-${suffix}`
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validate form before submission
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

      const paymentWindow = window.open(
        response.payment.payment_url,
        "_blank",
        "width=500,height=700,scrollbars=yes,resizable=yes"
      )

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

  const handlePaymentComplete = useCallback(async (url: string) => {
    try {
      const saveResponse = await fetch("/api/save-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
         ...formData,
        payment_id: paymentId, // Include the payment ID
       }),
    })


      if (!saveResponse.ok) {
        throw new Error("Failed to save portfolio after payment.")
      }

      setPortfolioUrl(url)
      setCurrentStep("success")
    } catch (err) {
      console.error("Error saving portfolio:", err)
      setError("Portfolio was paid but failed to save. Please contact support.")
    }
  }, [formData, paymentId])

const isFormValid =
  formData.token_name.trim() !== "" &&
  Object.values(validationErrors).every((v) => !v)
  
  if (currentStep === "payment" && paymentId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Payment Processing</h2>
          <p className="text-muted-foreground">
            Please complete your payment in the popup window. Your portfolio will be ready shortly.
          </p>
        </div>
        <PaymentStatusComponent paymentId={paymentId} onComplete={handlePaymentComplete} />
      </div>
    )
  }

  if (currentStep === "success" && portfolioUrl) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-green-600">Portfolio Created!</h2>
          <p className="text-lg text-muted-foreground">Your portfolio for {formData.token_name} is now live.</p>
        </div>

        <div className="space-y-4">
          <Button asChild size="lg">
            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer">
              View Your Portfolio
            </a>
          </Button>

          <div className="text-sm text-muted-foreground">
            <p>
              Portfolio URL: <code className="bg-muted px-2 py-1 rounded">{window.location.origin}{portfolioUrl}</code>
            </p>
          </div>

          <Button
            variant="outline"
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
                description: "",
                twitter_url: "",
                telegram_url: "",
                website_url: "",
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
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Portfolio Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label>Token Name * (max 50 chars)</Label>
                <Input 
                  value={formData.token_name} 
                  onChange={(e) => handleInputChange("token_name", e.target.value)} 
                  className={validationErrors.token_name ? "border-red-500" : ""}
                  required 
                />
                {validationErrors.token_name && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.token_name}</p>
                )}
              </div>

              <div>
                <Label>Username (3-30 chars, letters/numbers/hyphens only)</Label>
                <Input 
                  value={formData.username} 
                  onChange={(e) => handleInputChange("username", e.target.value)} 
                  className={validationErrors.username ? "border-red-500" : ""}
                  placeholder="Auto-generated if empty"
                />
                {validationErrors.username && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.username}</p>
                )}
              </div>

              <div>
                <Label>Ticker Symbol (max 10 chars, uppercase)</Label>
                <Input 
                  value={formData.ticker} 
                  onChange={(e) => handleInputChange("ticker", e.target.value.toUpperCase())} 
                  className={validationErrors.ticker ? "border-red-500" : ""}
                  placeholder="BTC, ETH, etc."
                />
                {validationErrors.ticker && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.ticker}</p>
                )}
              </div>

              <div>
                <Label>Contract Address (0x format)</Label>
                <Input 
                  value={formData.contract_address} 
                  onChange={(e) => handleInputChange("contract_address", e.target.value)} 
                  className={validationErrors.contract_address ? "border-red-500" : ""}
                  placeholder="0x..."
                />
                {validationErrors.contract_address && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.contract_address}</p>
                )}
              </div>

              <div>
                <Label>Slogan (max 100 chars)</Label>
                <Input 
                  value={formData.slogan} 
                  onChange={(e) => handleInputChange("slogan", e.target.value)} 
                  className={validationErrors.slogan ? "border-red-500" : ""}
                  placeholder="A catchy tagline for your token"
                />
                <div className="flex justify-between mt-1">
                  {validationErrors.slogan && (
                    <p className="text-sm text-red-500">{validationErrors.slogan}</p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">{formData.slogan.length}/100</p>
                </div>
              </div>

              <div>
                <Label>Description (max 500 chars)</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => handleInputChange("description", e.target.value)} 
                  className={validationErrors.description ? "border-red-500" : ""}
                  placeholder="Tell people about your token..."
                  rows={4}
                />
                <div className="flex justify-between mt-1">
                  {validationErrors.description && (
                    <p className="text-sm text-red-500">{validationErrors.description}</p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">{formData.description.length}/500</p>
                </div>
              </div>

              <div>
                <Label>Twitter URL</Label>
                <Input 
                  value={formData.twitter_url} 
                  onChange={(e) => handleInputChange("twitter_url", e.target.value)} 
                  className={validationErrors.twitter_url ? "border-red-500" : ""}
                  placeholder="https://twitter.com/username or https://x.com/username"
                />
                {validationErrors.twitter_url && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.twitter_url}</p>
                )}
              </div>

              <div>
                <Label>Telegram URL</Label>
                <Input 
                  value={formData.telegram_url} 
                  onChange={(e) => handleInputChange("telegram_url", e.target.value)} 
                  className={validationErrors.telegram_url ? "border-red-500" : ""}
                  placeholder="https://t.me/username"
                />
                {validationErrors.telegram_url && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.telegram_url}</p>
                )}
              </div>

              <div>
                <Label>Website URL</Label>
                <Input 
                  value={formData.website_url} 
                  onChange={(e) => handleInputChange("website_url", e.target.value)} 
                  className={validationErrors.website_url ? "border-red-500" : ""}
                  placeholder="https://yourwebsite.com"
                />
                {validationErrors.website_url && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.website_url}</p>
                )}
              </div>

              <div>
                <Label>Template</Label>
                <Select value={formData.template} onValueChange={(val) => handleInputChange("template", val)}>
                  <SelectTrigger className={validationErrors.template ? "border-red-500" : ""}>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.template && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.template}</p>
                )}
              </div>

              <div>
                <ImageUpload 
                  label="Logo Image (max 5MB)" 
                  onImageUpload={(img) => handleImageUpload("logo_url", img)} 
                  currentImage={formData.logo_url} 
                />
                {validationErrors.logo_url && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.logo_url}</p>
                )}
              </div>

              <div>
                <ImageUpload 
                  label="Banner Image (max 10MB)" 
                  onImageUpload={(img) => handleImageUpload("banner_url", img)} 
                  currentImage={formData.banner_url} 
                />
                {validationErrors.banner_url && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.banner_url}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? "Creating Payment..." : <><CreditCard className="mr-2 h-4 w-4" /> Purchase Portfolio ($50)</>}
            </Button>

            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>One-time payment of $50</p>
              <p>• Custom portfolio URL • Professional templates • Instant publishing</p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" /> Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioPreview data={formData} />
        </CardContent>
      </Card>
    </div>
  )
}