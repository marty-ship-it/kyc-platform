'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runSetup = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/setup-db')
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Setup failed')
      }
    } catch (err) {
      setError('Failed to connect to setup endpoint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Click the button below to seed the database with demo data.
          </p>
          
          <Button 
            onClick={runSetup} 
            disabled={loading || result?.success}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {result?.success ? 'Setup Complete' : 'Run Database Setup'}
          </Button>

          {result?.success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="font-semibold text-green-900">Success!</p>
              </div>
              <p className="text-sm text-green-800 mb-2">{result.message}</p>
              <div className="text-sm text-green-700">
                <p>Created:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>{result.stats.users} users</li>
                  <li>{result.stats.entities} entities</li>
                  <li>{result.stats.deals} deal</li>
                  <li>{result.stats.cases} case</li>
                </ul>
              </div>
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm font-semibold text-green-900 mb-1">Login Credentials:</p>
                <p className="text-xs text-green-800">luca@coastalrealty.com / Password123!</p>
                <p className="text-xs text-green-800">sarah@coastalrealty.com / Password123!</p>
                <p className="text-xs text-green-800">priya@coastalrealty.com / Password123!</p>
              </div>
              <a 
                href="/login" 
                className="block mt-4 text-center text-sm text-green-600 hover:text-green-700 underline"
              >
                Go to Login →
              </a>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {result && !result.success && result.message === 'Database already seeded' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                Database is already set up. You can login with the demo credentials.
              </p>
              <a 
                href="/login" 
                className="block mt-2 text-center text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Go to Login →
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}