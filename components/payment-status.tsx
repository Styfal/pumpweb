"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentService, type PaymentStatus } from "@/lib/payment-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

interface PaymentStatusProps {
  paymentId: string;
  onComplete?: (portfolioUrl: string) => void;
}

export function PaymentStatusComponent({ paymentId, onComplete }: PaymentStatusProps) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const redirected = useRef(false); // prevent double redirect
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // start polling
  useEffect(() => {
    PaymentService.pollPaymentStatus(paymentId, (newStatus) => {
      setStatus(newStatus);
      setLoading(false);
    });

    // initial fetch (optional safety)
    PaymentService.checkPaymentStatus(paymentId).then((initialStatus) => {
      if (initialStatus) {
        setStatus(initialStatus);
        setLoading(false);
      }
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [paymentId]);

  // handle redirect when completed — build URL from DB username instead of trusting API url
  useEffect(() => {
    if (!status || redirected.current) return;

    const username =
      // prefer top-level portfolio (if your status API returns it there)
      (status as any).portfolio?.username ??
      // or nested on payment (if your service nests it)
      (status as any).payment?.portfolio?.username ??
      null;

    if (status.payment.status === "completed" && username) {
      const url = `/portfolio/${username}`;
      redirected.current = true;

      // optional callback first
      onComplete?.(url);

      // small delay to let "Completed!" show
      timerRef.current = setTimeout(() => {
        router.push(url);
      }, 1500);
    }
  }, [status, onComplete, router]);

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
    );
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
    );
  }

  const { payment } = status as any;
  const fallbackUsername =
    (status as any).portfolio?.username ?? (status as any).payment?.portfolio?.username ?? null;
  const fallbackUrl = fallbackUsername ? `/portfolio/${fallbackUsername}` : null;

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

        {payment.portfolio && (
          <CardDescription>Portfolio for {payment.portfolio.token_name}</CardDescription>
        )}
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
              <span className="font-medium text-xs">
                {new Date(payment.verified_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Fallback button builds URL from username too */}
        {payment.status === "completed" && fallbackUrl && (
          <Button asChild className="w-full">
            <Link href={fallbackUrl} className="flex items-center gap-2">
              View Your Portfolio
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}

        {payment.status === "pending" && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Your payment is being processed...</p>
            <p>This usually takes a minute.</p>
          </div>
        )}

        {payment.status === "failed" && (
          <div className="text-center">
            <p className="text-sm text-red-600 mb-3">
              Payment failed. Please try again or contact support.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">Try Again</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
