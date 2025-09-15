import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { 
  Search, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Building2,
  Calendar
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { RoleGuard } from '@/components/rbac/RoleGuard'
import { PERMISSIONS } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

async function getCases() {
  // Return empty array in production on Vercel
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    return []
  }
  
  const cases = await prisma.case.findMany({
    include: {
      entity: true,
      deal: true,
      createdBy: true,
      reports: true,
      organisation: true,
      _count: {
        select: {
          reports: true
        }
      }
    },
    orderBy: [
      { status: 'asc' }, // Open cases first
      { updatedAt: 'desc' }
    ]
  })
  
  return cases
}

function getCaseStatusIcon(status: string) {
  switch (status) {
    case 'OPEN':
      return <AlertCircle className="w-4 h-4 text-yellow-600" />
    case 'UNDER_REVIEW':
      return <Clock className="w-4 h-4 text-blue-600" />
    case 'SUBMITTED':
      return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'CLOSED':
      return <XCircle className="w-4 h-4 text-gray-600" />
    default:
      return <AlertCircle className="w-4 h-4 text-gray-600" />
  }
}

function getCaseStatusColor(status: string) {
  switch (status) {
    case 'OPEN':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'UNDER_REVIEW':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'SUBMITTED':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getCaseReasonColor(reason: string) {
  switch (reason) {
    case 'THRESHOLD':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'RISK_ESCALATION':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'ADVERSE_MEDIA':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'MANUAL':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getReasonIcon(reason: string) {
  switch (reason) {
    case 'THRESHOLD':
      return '⚠️'
    case 'RISK_ESCALATION':
      return '🔺'
    case 'ADVERSE_MEDIA':
      return '📰'
    case 'MANUAL':
      return '👤'
    default:
      return '📋'
  }
}

async function CaseList() {
  const cases = await getCases()

  return (
    <div className="grid gap-4">
      {cases.map((case_) => (
        <Card key={case_.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getCaseStatusIcon(case_.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getReasonIcon(case_.reason)}</span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Case #{case_.id.slice(-8)} - {case_.reason.replace('_', ' ')}
                    </h3>
                    <Badge className={getCaseReasonColor(case_.reason)} variant="outline">
                      {case_.reason}
                    </Badge>
                  </div>
                  
                  {case_.notes && (
                    <div className="mb-3">
                      {JSON.parse(case_.notes as string).slice(0, 2).map((note: any, index: number) => (
                        <p key={index} className="text-gray-600 text-sm line-clamp-1">
                          <span className="font-medium">{note.by}</span>: {note.text}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Building2 className="w-4 h-4" />
                      <span>Entity: {case_.entity.fullName || case_.entity.legalName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>Created by: {case_.createdBy.name}</span>
                    </div>
                    {case_.deal && (
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>Deal: {case_.deal.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {case_.createdAt.toLocaleDateString()}</span>
                    </div>
                    <span>Updated: {case_.updatedAt.toLocaleDateString()}</span>
                    {case_.closedAt && (
                      <span>Closed: {case_.closedAt.toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right text-sm">
                  <div className="text-gray-600">
                    {case_._count.reports} Report{case_._count.reports !== 1 ? 's' : ''}
                  </div>
                  <Badge className={getCaseStatusColor(case_.status)} variant="outline">
                    {case_.status}
                  </Badge>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/cases/${case_.id}`}>
                    View Case
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {cases.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first case.</p>
            <RoleGuard permission={PERMISSIONS.CASE_CREATE}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Case
              </Button>
            </RoleGuard>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default async function CasesPage() {
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Management</h1>
          <p className="text-gray-600">Track and manage compliance cases across your organization</p>
        </div>
        <RoleGuard permission={PERMISSIONS.CASE_CREATE}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Case
          </Button>
        </RoleGuard>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search cases..." 
            className="pl-10"
          />
        </div>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            <SelectItem value="THRESHOLD">⚠️ Threshold</SelectItem>
            <SelectItem value="RISK_ESCALATION">🔺 Risk Escalation</SelectItem>
            <SelectItem value="ADVERSE_MEDIA">📰 Adverse Media</SelectItem>
            <SelectItem value="MANUAL">👤 Manual</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Created By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="me">Created by Me</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="text-sm text-gray-600">Open Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-sm text-gray-600">Under Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔴</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">4</p>
                <p className="text-sm text-gray-600">Risk Escalation</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">15</p>
                <p className="text-sm text-gray-600">Closed This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                      <div className="h-4 bg-gray-200 rounded w-64" />
                      <div className="h-3 bg-gray-200 rounded w-96" />
                      <div className="flex space-x-4">
                        <div className="h-3 bg-gray-200 rounded w-32" />
                        <div className="h-3 bg-gray-200 rounded w-32" />
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
        <CaseList />
      </Suspense>
        </div>
      </div>
    </>
  )
}