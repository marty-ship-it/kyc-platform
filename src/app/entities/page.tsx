import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { Search, Plus, Building2, User, Users, Briefcase } from 'lucide-react'
import { prisma } from '@/lib/prisma'

async function getEntities() {
  const entities = await prisma.entity.findMany({
    include: {
      organisation: true,
      parties: {
        include: {
          deal: true
        }
      },
      cases: {
        where: {
          status: {
            in: ['OPEN', 'UNDER_REVIEW']
          }
        }
      },
      kycs: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      },
      screenings: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      },
      deals: true,
      _count: {
        select: {
          cases: true,
          deals: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })
  
  return entities
}

function getEntityIcon(kind: string) {
  switch (kind) {
    case 'INDIVIDUAL':
      return <User className="w-4 h-4" />
    case 'ORGANISATION':
      return <Building2 className="w-4 h-4" />
    default:
      return <Briefcase className="w-4 h-4" />
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


async function EntityList() {
  const entities = await getEntities()

  return (
    <div className="grid gap-4">
      {entities.map((entity) => (
        <Card key={entity.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  {getEntityIcon(entity.kind)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {entity.fullName || entity.legalName}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {entity.kind}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    {entity.country && (
                      <span>Country: {entity.country}</span>
                    )}
                    {entity.abnAcn && (
                      <span>ABN/ACN: {entity.abnAcn}</span>
                    )}
                    {entity.kycs.length > 0 && (
                      <span>Last KYC: {new Date(entity.kycs[0].createdAt).toLocaleDateString('en-AU')}</span>
                    )}
                    {entity.screenings.length > 0 && (
                      <span>Last Screening: {new Date(entity.screenings[0].createdAt).toLocaleDateString('en-AU')}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className={getRiskColor(entity.riskScore)} variant="outline">
                      Risk: {entity.riskScore}
                    </Badge>
                    {entity.riskRationale && (
                      <span className="text-xs text-gray-500" title={entity.riskRationale}>
                        ({entity.riskRationale.length > 50 ? 
                          entity.riskRationale.substring(0, 50) + '...' : 
                          entity.riskRationale})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right text-sm">
                  <div className="text-gray-600">
                    {entity._count.cases} Open Case{entity._count.cases !== 1 ? 's' : ''}
                  </div>
                  <div className="text-gray-600">
                    {entity._count.deals} Deal{entity._count.deals !== 1 ? 's' : ''}
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/entities/${entity.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {entities.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No entities found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first entity.</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Entity
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default async function EntitiesPage() {
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entity Workspace</h1>
          <p className="text-gray-600">Manage and monitor all entities across your organization</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Entity
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search entities..." 
            className="pl-10"
          />
        </div>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="INDIVIDUAL">Individual</SelectItem>
            <SelectItem value="ORGANISATION">Organisation</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="LOW">Low Risk</SelectItem>
            <SelectItem value="MEDIUM">Medium Risk</SelectItem>
            <SelectItem value="HIGH">High Risk</SelectItem>
          </SelectContent>
        </Select>
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
        <EntityList />
      </Suspense>
        </div>
      </div>
    </>
  )
}