import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { ArrowLeft, Building2, User, Shield } from 'lucide-react'
import { mockEntities } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

interface EntityDetailProps {
  params: {
    id: string
  }
}

function getEntityIcon(kind: string) {
  switch (kind) {
    case 'INDIVIDUAL':
      return <User className="w-8 h-8 text-gray-600" />
    case 'ORGANISATION':
      return <Building2 className="w-8 h-8 text-gray-600" />
    default:
      return <User className="w-8 h-8 text-gray-600" />
  }
}

function getRiskColor(risk: string) {
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

export default async function EntityDetailPage({ params }: EntityDetailProps) {
  // For production, use mock data
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    const entity = mockEntities.find(e => e.id === params.id)
    
    if (!entity) {
      notFound()
    }

    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/entities">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Entities
                </Link>
              </Button>
            </div>

            {/* Entity Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                    {getEntityIcon(entity.kind)}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {entity.fullName || entity.legalName}
                    </h1>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span>{entity.kind}</span>
                      {entity.country && <span>Country: {entity.country}</span>}
                      {entity.abnAcn && <span>ABN/ACN: {entity.abnAcn}</span>}
                    </div>
                    <div className="mt-4">
                      <Badge className={getRiskColor(entity.riskScore)} variant="outline">
                        <Shield className="w-3 h-3 mr-1" />
                        Risk: {entity.riskScore}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Rationale */}
            {entity.riskRationale && (
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{entity.riskRationale}</p>
                </CardContent>
              </Card>
            )}

            {/* Demo Notice */}
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">
                  This is a demo version with limited functionality. In a production environment, 
                  this page would show complete KYC history, screening results, related deals, and cases.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  // For development, show not found
  notFound()
}