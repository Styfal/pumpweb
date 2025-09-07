import type { PortfolioFormData } from "./types"

export interface PaymentResponse {
  success: boolean
  payment?: {
    id: string
    portfolio_id: string
    username: string
    payment_url: string
    amount: number
    currency: string
    status: string
  }
  error?: string
}

export interface PaymentStatus {
  payment: {
    id: string
    status: "pending" | "completed" | "failed"
    amount: number
    currency: string
    verified_at?: string
    portfolio?: {
      username: string
      token_name: string
      is_published: boolean
      url?: string
    }
  }
}

export class PaymentService {
  static async createPayment(
    portfolioData: PortfolioFormData,
    amount = 50,
    currency = "USD",
  ): Promise<PaymentResponse> {
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          portfolioData,
          amount,
          currency,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to create payment" }
      }

      return data
    } catch (error) {
      console.error("Payment creation error:", error)
      return { success: false, error: "Network error" }
    }
  }

  static async checkPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
    try {
      const response = await fetch(`/api/payments/status/${paymentId}`)

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error("Payment status check error:", error)
      return null
    }
  }

  static async pollPaymentStatus(
    paymentId: string,
    onStatusChange: (status: PaymentStatus) => void,
    maxAttempts = 60,
    intervalMs = 5000,
  ): Promise<void> {
    let attempts = 0

    const poll = async () => {
      const status = await this.checkPaymentStatus(paymentId)

      if (status) {
        onStatusChange(status)

        // Stop polling if payment is completed or failed
        if (status.payment.status === "completed" || status.payment.status === "failed") {
          return
        }
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(poll, intervalMs)
      }
    }

    poll()
  }
}
