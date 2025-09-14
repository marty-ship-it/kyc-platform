'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, Loader2, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface ScreeningButtonProps {
  entityId: string
}

interface ScreeningResult {
  entityId: string
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH'
  pep: boolean
  sanctions: boolean
  adverseMedia: boolean
  dvsVerification: boolean
  newMatches: string[]
  requiresReview: boolean
}

export function ScreeningButton({ entityId }: ScreeningButtonProps) {
  const [isScreening, setIsScreening] = useState(false)
  const [result, setResult] = useState<ScreeningResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  const runScreening = async () => {
    setIsScreening(true)
    
    try {
      const response = await fetch(`/api/entities/${entityId}/screen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to run screening')
      }

      const data = await response.json()
      setResult(data.result)
      setShowResults(true)

    } catch (error) {
      console.error('Screening error:', error)
    } finally {
      setIsScreening(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (hasMatch: boolean) => {
    return hasMatch ? (
      <XCircle className="w-4 h-4 text-red-600" />
    ) : (
      <CheckCircle className="w-4 h-4 text-green-600" />
    )
  }

  return (
    <>
      <Button 
        onClick={runScreening} 
        disabled={isScreening}
        className="bg-[#49e1f3] hover:bg-[#35d4ea] text-black border-[#49e1f3]"
      >
        {isScreening ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Shield className="w-4 h-4 mr-2" />
        )}
        {isScreening ? 'Screening...' : 'Run Auto-Screening'}
      </Button>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Screening Results</span>
            </DialogTitle>
            <DialogDescription>
              Latest screening results for this entity
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-6">
              {/* Risk Score */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Score:</span>
                <Badge className={getRiskColor(result.riskScore)} variant="outline">
                  {result.riskScore}
                </Badge>
              </div>

              {/* Screening Categories */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Screening Categories</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.pep)}
                      <span className="text-sm">Politically Exposed Person (PEP)</span>
                    </div>
                    <span className="text-sm font-medium">
                      {result.pep ? 'Match Found' : 'Clear'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.sanctions)}
                      <span className="text-sm">Sanctions Lists</span>
                    </div>
                    <span className="text-sm font-medium">
                      {result.sanctions ? 'Match Found' : 'Clear'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.adverseMedia)}
                      <span className="text-sm">Adverse Media</span>
                    </div>
                    <span className="text-sm font-medium">
                      {result.adverseMedia ? 'Found' : 'Clear'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.dvsVerification)}
                      <span className="text-sm">DVS Identity Verification</span>
                    </div>
                    <span className="text-sm font-medium">
                      {result.dvsVerification ? 'Failed' : 'Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* New Matches */}
              {result.newMatches.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-700">New Matches Found</h4>
                  <div className="space-y-1">
                    {result.newMatches.map((match, index) => (
                      <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span>{match}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Required */}
              {result.requiresReview && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Manual Review Required
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        This entity has been flagged for compliance review. A case has been created automatically.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!result.requiresReview && result.newMatches.length === 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Screening Complete
                      </p>
                      <p className="text-sm text-green-700">
                        No new risks detected. Entity remains in good standing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setShowResults(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}