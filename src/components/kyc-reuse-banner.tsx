'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertTriangle, Eye, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface KycStatus {
  hasValidKyc: boolean
  lastKycDate: Date | null
  daysAgo: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  entityName: string
  entityId: string
  kycSource: 'current_deal' | 'previous_deal' | 'entity_profile'
  dealAddress?: string
}

interface KycReuseBannerProps {
  kycStatus: KycStatus
  currentDealAddress: string
  onRefreshKyc?: () => void
  showActions?: boolean
}

export function KycReuseBanner({ 
  kycStatus, 
  currentDealAddress, 
  onRefreshKyc,
  showActions = true 
}: KycReuseBannerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshKyc = async () => {
    if (!onRefreshKyc) return
    
    setIsRefreshing(true)
    try {
      await onRefreshKyc()
    } finally {
      setIsRefreshing(false)
    }
  }

  const getKycStatusConfig = () => {
    if (!kycStatus.hasValidKyc) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        variant: 'default' as const,
        bgColor: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-800',
        title: 'KYC Required',
        badgeColor: 'bg-yellow-100 text-yellow-800'
      }
    }

    if (kycStatus.daysAgo <= 90) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        variant: 'default' as const,
        bgColor: 'bg-green-50 border-green-200',
        textColor: 'text-green-800',
        title: 'Valid KYC Found',
        badgeColor: 'bg-green-100 text-green-800'
      }
    } else if (kycStatus.daysAgo <= 365) {
      return {
        icon: <Clock className="w-5 h-5 text-blue-600" />,
        variant: 'default' as const,
        bgColor: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-800',
        title: 'KYC Review Recommended',
        badgeColor: 'bg-blue-100 text-blue-800'
      }
    } else {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
        variant: 'default' as const,
        bgColor: 'bg-orange-50 border-orange-200',
        textColor: 'text-orange-800',
        title: 'KYC Refresh Required',
        badgeColor: 'bg-orange-100 text-orange-800'
      }
    }
  }

  const config = getKycStatusConfig()

  const getRiskBadgeColor = (risk: string) => {
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

  const getSourceDescription = () => {
    switch (kycStatus.kycSource) {
      case 'current_deal':
        return `from current deal (${currentDealAddress})`
      case 'previous_deal':
        return `from previous deal${kycStatus.dealAddress ? ` (${kycStatus.dealAddress})` : ''}`
      case 'entity_profile':
        return 'from entity profile'
      default:
        return ''
    }
  }

  return (
    <Alert className={`${config.bgColor} ${config.textColor} mb-6`}>
      <div className="flex items-start space-x-3">
        {config.icon}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold">{config.title}</h4>
              <Badge variant="outline" className={config.badgeColor}>
                {kycStatus.entityName}
              </Badge>
              <Badge variant="outline" className={getRiskBadgeColor(kycStatus.riskLevel)}>
                Risk: {kycStatus.riskLevel}
              </Badge>
            </div>
          </div>
          
          <AlertDescription className="space-y-2">
            {kycStatus.hasValidKyc ? (
              <>
                <p>
                  KYC verification found {getSourceDescription()}.
                  {kycStatus.lastKycDate && (
                    <span> Completed {kycStatus.daysAgo} days ago on {kycStatus.lastKycDate.toLocaleDateString()}.</span>
                  )}
                </p>
                
                {kycStatus.daysAgo <= 90 ? (
                  <p className="text-sm">
                    ✅ This KYC is current and can be reused for this transaction.
                  </p>
                ) : kycStatus.daysAgo <= 365 ? (
                  <p className="text-sm">
                    ⚠️ KYC is valid but aging. Consider refresh for enhanced due diligence.
                  </p>
                ) : (
                  <p className="text-sm">
                    🔄 KYC has expired. Refresh required before proceeding with transaction.
                  </p>
                )}
              </>
            ) : (
              <p>
                No valid KYC verification found for {kycStatus.entityName}. 
                Complete KYC verification to proceed with this transaction.
              </p>
            )}

            {showActions && (
              <div className="flex items-center space-x-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/entities/${kycStatus.entityId}`}>
                    <Eye className="w-4 h-4 mr-1" />
                    View Entity
                  </Link>
                </Button>
                
                {kycStatus.hasValidKyc && onRefreshKyc && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshKyc}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Refresh KYC
                  </Button>
                )}

                {!kycStatus.hasValidKyc && (
                  <Button size="sm" className="bg-[#49e1f3] hover:bg-[#35d4ea] text-black">
                    Start KYC Process
                  </Button>
                )}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}