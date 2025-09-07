"use client"

import { useEffect, useState } from "react"
import { PaymentService, type PaymentStatus } from "@/lib/payment-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"

interface PaymentStatusProps {
  paymentId: string
  onComplete?: (portfolioUrl: string) => void
}

export function PaymentStatusComponent({ paymentId, onComplete }: PaymentStatusProps) {
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Start polling payment status
    PaymentService.pollPaymentStatus(paymentId, (newStatus) => {
      setStatus(newStatus)
      setLoading(false)

      // Call onComplete when portfolio is published
      if (newStatus.payment.status === "completed" && newStatus.payment.portfolio?.url && onComplete) {
        onComplete(newStatus.payment.portfolio.url)
      }
    })

    // Initial status check
    PaymentService.checkPaymentStatus(paymentId).then((initialStatus) => {
      if (initialStatus) {
        setStatus(initialStatus)
        setLoading(false)
      }
    })
  }, [paymentId, onComplete])

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            Checking Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please wait while we verify your payment...</p>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Payment Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to find payment information.</p>
        </CardContent>
      </Card>
    )
  }

  const { payment } = status

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {payment.status === "completed" && <CheckCircle className="h-5 w-5 text-green-600" />}
          {payment.status === "failed" && <XCircle className="h-5 w-5 text-red-600" />}
          {payment.status === "pending" && <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />}

          {payment.status === "completed" && "Payment Completed!"}
          {payment.status === "failed" && "Payment Failed"}
          {payment.status === "pending" && "Payment Pending"}
        </CardTitle>

        {payment.portfolio && <CardDescription>Portfolio for {payment.portfolio.token_name}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">
              ${payment.amount} {payment.currency}
            </span>
          </div>

          {payment.portfolio && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-medium">@{payment.portfolio.username}</span>
            </div>
          )}

          {payment.verified_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verified:</span>
              <span className="font-medium text-xs">{new Date(payment.verified_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        {payment.status === "completed" && payment.portfolio?.url && (
          <Button asChild className="w-full">
            <Link href={payment.portfolio.url} className="flex items-center gap-2">
              View Your Portfolio
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}

        {payment.status === "pending" && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Your payment is being processed...</p>
            <p>This usually takes 1-2 minutes.</p>
          </div>
        )}

        {payment.status === "failed" && (
          <div className="text-center">
            <p className="text-sm text-red-600 mb-3">Payment failed. Please try again or contact support.</p>
            <Button variant="outline" asChild>
              <Link href="/">Try Again</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
