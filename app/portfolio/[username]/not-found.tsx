import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Portfolio Not Found</h1>
          <p className="text-lg text-gray-600">
            The portfolio you're looking for doesn't exist or hasn't been published yet.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">This could happen if:</p>
          <ul className="text-sm text-gray-500 space-y-1 max-w-md mx-auto">
            <li>• The username is incorrect</li>
            <li>• The portfolio hasn't been published</li>
            <li>• The payment hasn't been verified</li>
          </ul>
        </div>

        <div className="pt-4">
          <Button asChild>
            <Link href="/">Create Your Portfolio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
