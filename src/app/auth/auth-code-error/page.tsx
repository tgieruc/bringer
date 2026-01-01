import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCodeError() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            The sign-in link was invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Please return to the login page and try again.
          </p>
          <Link href="/login" className="mt-4 inline-block text-blue-600 hover:underline">
            Go to Login
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
