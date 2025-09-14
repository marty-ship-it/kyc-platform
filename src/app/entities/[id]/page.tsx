import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { ScreeningButton } from '@/components/screening-button'
import { IdVerification } from '@/components/id-verification'
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Users, 
  Briefcase, 
  Calendar, 
  MapPin, 
  Shield, 
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { AuditTrail } from '@/components/audit-trail'

interface EntityDetailProps {
  params: {
    id: string
  }
}

async function getEntity(id: string) {
  const entity = await prisma.entity.findUnique({
    where: { id },
    include: {
      organisation: true,
      parties: {
        include: {
          deal: true,
          kycChecks: true,
          screenings: true
        }
      },
      deals: true,
      cases: {
        include: {
          deal: true,
          createdBy: true,
          reports: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      kycs: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      screenings: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })
  
  if (!entity) return null
  
  // Get related transactions through deals
  const transactions = await prisma.transaction.findMany({
    where: {
      deal: {
        parties: {
          some: {
            entityId: id
          }
        }
      }
    },
    include: {
      deal: true
    },
    orderBy: {
      receivedAt: 'desc'
    }
  })
  
  // Get audit events related to this entity
  const auditEvents = await prisma.auditEvent.findMany({
    where: {
      OR: [
        { entityId: id },
        { entityType: 'Entity', entityId: id },
        {
          AND: [
            { entityType: 'Case' },
            {
              caseId: {
                in: entity.cases.map(c => c.id)
              }
            }
          ]
        }
      ]
    },
    include: {
      user: true,
      org: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  return { ...entity, transactions, auditEvents }
}

function getEntityIcon(kind: string) {
  switch (kind) {
    case 'INDIVIDUAL':
      return <User className="w-5 h-5" />
    case 'ORGANISATION':
      return <Building2 className="w-5 h-5" />
    default:
      return <Briefcase className="w-5 h-5" />
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

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'UNDER_REVIEW':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
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

function getCasePriorityColor(priority: string) {
  switch (priority) {
    case 'LOW':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'URGENT':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getKycStatusIcon(status: string) {
  switch (status) {
    case 'PASS':
      return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'FAIL':
      return <XCircle className="w-4 h-4 text-red-600" />
    case 'MANUAL':
      return <Clock className="w-4 h-4 text-yellow-600" />
    default:
      return <AlertCircle className="w-4 h-4 text-gray-600" />
  }
}

export default async function EntityDetailPage({ params }: EntityDetailProps) {
  const entity = await getEntity(params.id)

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
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
            {getEntityIcon(entity.kind)}
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {entity.fullName || entity.legalName}
              </h1>
              <Badge variant="outline" className="text-sm">
                {entity.kind}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-gray-600 mb-3">
              {entity.country && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{entity.country}</span>
                </div>
              )}
              {entity.abnAcn && (
                <div className="flex items-center space-x-1">
                  <Briefcase className="w-4 h-4" />
                  <span>ABN/ACN: {entity.abnAcn}</span>
                </div>
              )}
              {entity.kycs.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Last KYC: {new Date(entity.kycs[0].createdAt).toLocaleDateString('en-AU')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getRiskColor(entity.riskScore)} variant="outline">
                <Shield className="w-3 h-3 mr-1" />
                Risk: {entity.riskScore}
              </Badge>
              {entity.riskRationale && (
                <span className="text-sm text-gray-600" title={entity.riskRationale}>
                  ({entity.riskRationale.length > 60 ? 
                    entity.riskRationale.substring(0, 60) + '...' : 
                    entity.riskRationale})
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Edit Entity</Button>
          <ScreeningButton entityId={entity.id} />
        </div>
      </div>

      <Separator />

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="identity">ID Verification</TabsTrigger>
          <TabsTrigger value="cases">Cases ({entity.cases.length})</TabsTrigger>
          <TabsTrigger value="kyc">KYC History</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entity Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{entity.fullName || entity.legalName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Kind</label>
                  <p className="text-sm text-gray-900">{entity.kind}</p>
                </div>
                {entity.country && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Country</label>
                    <p className="text-sm text-gray-900">{entity.country}</p>
                  </div>
                )}
                {entity.abnAcn && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">ABN/ACN</label>
                    <p className="text-sm text-gray-900">{entity.abnAcn}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-900">{new Date(entity.createdAt).toLocaleDateString('en-AU')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Risk Level</label>
                  <div className="mt-1">
                    <Badge className={getRiskColor(entity.riskScore)} variant="outline">
                      {entity.riskScore}
                    </Badge>
                  </div>
                </div>
                {entity.riskRationale && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Risk Rationale</label>
                    <p className="text-sm text-gray-900">{entity.riskRationale}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Last KYC Review</label>
                  <p className="text-sm text-gray-900">
                    {entity.kycs.length > 0 ? 
                      new Date(entity.kycs[0].createdAt).toLocaleDateString('en-AU') : 
                      'Never'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Screening</label>
                  <p className="text-sm text-gray-900">
                    {entity.screenings.length > 0 ? 
                      new Date(entity.screenings[0].createdAt).toLocaleDateString('en-AU') : 
                      'Never'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Open Cases</span>
                  <span className="text-sm font-medium">
                    {entity.cases.filter(c => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Cases</span>
                  <span className="text-sm font-medium">{entity.cases.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Associated Deals</span>
                  <span className="text-sm font-medium">{entity.deals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Party Roles</span>
                  <span className="text-sm font-medium">{entity.parties.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Transactions</span>
                  <span className="text-sm font-medium">{entity.transactions.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="identity" className="space-y-6">
          <IdVerification entityId={entity.id} />
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          {entity.cases.map((case_) => (
            <Card key={case_.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getCaseStatusIcon(case_.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Case #{case_.id.slice(-8)} - {case_.reason.replace('_', ' ')}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {case_.reason}
                        </Badge>
                      </div>
                      {case_.notes && (
                        <div className="mb-3">
                          {JSON.parse(case_.notes as string).map((note: any, index: number) => (
                            <div key={index} className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">{note.by}</span>: {note.text}
                              <span className="text-gray-400 ml-2">
                                {new Date(note.at).toLocaleDateString('en-AU')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created: {new Date(case_.createdAt).toLocaleDateString('en-AU')}</span>
                        <span>Created by: {case_.createdBy.name}</span>
                        {case_.deal && (
                          <span>Deal: {case_.deal.address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={
                      case_.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      case_.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      case_.status === 'SUBMITTED' ? 'bg-green-100 text-green-800 border-green-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }>
                      {case_.status}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/cases/${case_.id}`}>
                        View Case
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {entity.cases.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases found</h3>
                <p className="text-gray-600">This entity has no associated cases.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="kyc" className="space-y-4">
          {entity.parties.map((party) => (
            <Card key={party.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{party.fullName}</h3>
                    <p className="text-gray-600">Role: {party.type} in {party.deal.address}</p>
                  </div>
                  <Badge variant="outline">
                    {party.type}
                  </Badge>
                </div>
                
                {party.kycCheck && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Document Verification</h4>
                      <div className="flex items-center space-x-2 mb-1">
                        {getKycStatusIcon(party.kycCheck.dvStatus)}
                        <span className="text-sm">{party.kycCheck.dvStatus}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Liveness: {party.kycCheck.liveness ? 'Verified' : 'Not verified'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Completed: {party.kycCheck.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    {party.screening && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Screening Results</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>PEP Status:</span>
                            <span className={party.screening.pep ? 'text-red-600' : 'text-green-600'}>
                              {party.screening.pep ? 'Match Found' : 'Clear'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Sanctions:</span>
                            <span className={party.screening.sanctions ? 'text-red-600' : 'text-green-600'}>
                              {party.screening.sanctions ? 'Match Found' : 'Clear'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Adverse Media:</span>
                            <span className={party.screening.adverseMedia ? 'text-red-600' : 'text-green-600'}>
                              {party.screening.adverseMedia ? 'Found' : 'Clear'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {entity.parties.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No KYC records found</h3>
                <p className="text-gray-600">This entity has no KYC verification history.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {entity.transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.direction === 'IN' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <DollarSign className={`w-4 h-4 ${
                        transaction.direction === 'IN' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {transaction.currency} ${transaction.amount.toLocaleString()}
                        </h3>
                        <Badge variant="outline">
                          {transaction.type}
                        </Badge>
                        {transaction.subtype && (
                          <Badge variant="outline" className="text-xs">
                            {transaction.subtype}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{transaction.purpose}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>From: {transaction.counterparty}</span>
                        <span>Method: {transaction.method}</span>
                        <span>Date: {transaction.receivedAt.toLocaleDateString()}</span>
                        <span>Deal: {transaction.deal.address}</span>
                      </div>
                      {(transaction.isCrossBorder || transaction.isStructured || transaction.isInternal || transaction.flagged) && (
                        <div className="flex items-center space-x-2 mt-2">
                          {transaction.isCrossBorder && (
                            <Badge variant="outline" className="text-xs bg-blue-50">Cross Border</Badge>
                          )}
                          {transaction.isStructured && (
                            <Badge variant="outline" className="text-xs bg-yellow-50">Structured</Badge>
                          )}
                          {transaction.isInternal && (
                            <Badge variant="outline" className="text-xs bg-purple-50">Internal Transfer</Badge>
                          )}
                          {transaction.flagged && (
                            <Badge variant="outline" className="text-xs bg-red-50">Flagged</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {entity.transactions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600">This entity has no transaction history.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditTrail
            events={entity.auditEvents}
            title={`Audit Trail - ${entity.fullName || entity.legalName}`}
            showEntityLinks={false}
            showCaseLinks={true}
          />
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </>
  )
}