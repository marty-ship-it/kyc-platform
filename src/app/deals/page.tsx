import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Navbar from '@/components/layout/Navbar'
import { 
  FileText, 
  Plus, 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar,
  User,
  Building2
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getDeals() {
  // Return empty array in production on Vercel
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    return []
  }
  
  const deals = await prisma.deal.findMany({
    include: {
      createdBy: true,
      parties: {
        include: {
          entity: true,
          kycChecks: true,
          screenings: true
        }
      },
      riskAssessment: true,
      transactions: true,
      reports: true,
      cases: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  return deals
}

function getRiskColor(risk?: string) {
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

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

async function DealsList() {
  const deals = await getDeals()

  return (
    <div className="grid gap-6">
      {deals.map((deal) => (
        <Card key={deal.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{deal.address}</h3>
                    <Badge className={getStatusColor(deal.status)} variant="outline">
                      {deal.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>${deal.price.toLocaleString('en-AU')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{deal.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>Created by {deal.createdBy.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{deal.parties.length} Parties</span>
                    <span>{deal.transactions.length} Transactions</span>
                    <span>{deal.cases.length} Cases</span>
                    <span>{deal.reports.length} Reports</span>
                  </div>
                  
                  {deal.riskAssessment && (
                    <div className="mt-2">
                      <Badge className={getRiskColor(deal.riskAssessment.score)} variant="outline">
                        Risk: {deal.riskAssessment.score}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/deals/${deal.id}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {deals.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first property deal.</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Deal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default async function DealsPage() {
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Deals</h1>
          <p className="text-gray-600">Manage and track all property transactions and compliance workflows</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Deal
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search deals..." 
            className="pl-10"
          />
        </div>
      </div>

      <Suspense fallback={
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-48" />
                      <div className="h-3 bg-gray-200 rounded w-32" />
                      <div className="flex space-x-2">
                        <div className="h-6 bg-gray-200 rounded w-16" />
                        <div className="h-6 bg-gray-200 rounded w-16" />
                      </div>
                    </div>
                  </div>
                  <div className="w-24 h-8 bg-gray-200 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        <DealsList />
      </Suspense>
        </div>
      </div>
    </>
  )
}