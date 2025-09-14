import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { KycReuseBanner } from '@/components/kyc-reuse-banner'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Building2, 
  User, 
  DollarSign, 
  Calendar,
  FileText,
  Shield,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { KycReuseService } from '@/lib/services/kyc-reuse'
import { AuditTrail } from '@/components/audit-trail'

interface DealDetailProps {
  params: {
    id: string
  }
}

async function getDeal(id: string) {
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      createdBy: true,
      org: true,
      parties: {
        include: {
          entity: true,
          kycChecks: true,
          screenings: true
        }
      },
      riskAssessment: true,
      transactions: {
        orderBy: {
          receivedAt: 'desc'
        }
      },
      reports: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      cases: {
        include: {
          createdBy: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })
  
  if (!deal) return null

  // Get KYC status for all entities involved
  const kycStatuses = await KycReuseService.getDealKycStatus(id)
  
  // Get audit events related to this deal
  const auditEvents = await prisma.auditEvent.findMany({
    where: {
      OR: [
        { entityType: 'Deal', entityId: id },
        {
          AND: [
            { entityType: 'Case' },
            {
              caseId: {
                in: deal.cases.map(c => c.id)
              }
            }
          ]
        },
        {
          AND: [
            { entityType: 'Entity' },
            {
              entityId: {
                in: deal.parties.map(p => p.entityId).filter(Boolean)
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
  
  return { ...deal, kycStatuses, auditEvents }
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
      return <Clock className="w-4 h-4 text-gray-600" />
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
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default async function DealDetailPage({ params }: DealDetailProps) {
  const deal = await getDeal(params.id)

  if (!deal) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/deals">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deals
          </Link>
        </Button>
      </div>

      {/* Deal Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{deal.address}</h1>
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
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(deal.status)} variant="outline">
                {deal.status}
              </Badge>
              {deal.riskAssessment && (
                <Badge className={getRiskColor(deal.riskAssessment.score)} variant="outline">
                  <Shield className="w-3 h-3 mr-1" />
                  Risk: {deal.riskAssessment.score}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Edit Deal</Button>
        </div>
      </div>

      {/* KYC Reuse Banners */}
      {Object.entries(deal.kycStatuses).map(([entityId, kycStatus]) => (
        <KycReuseBanner
          key={entityId}
          kycStatus={{
            hasValidKyc: kycStatus.hasValidKyc,
            lastKycDate: kycStatus.lastKycDate,
            daysAgo: kycStatus.daysAgo,
            riskLevel: kycStatus.riskLevel,
            entityName: kycStatus.entityName,
            entityId: kycStatus.entityId,
            kycSource: kycStatus.kycSource,
            dealAddress: kycStatus.dealAddress
          }}
          currentDealAddress={deal.address}
        />
      ))}

      <Separator />

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="parties">Parties ({deal.parties.length})</TabsTrigger>
          <TabsTrigger value="transactions">Transactions ({deal.transactions.length})</TabsTrigger>
          <TabsTrigger value="reports">Reports ({deal.reports.length})</TabsTrigger>
          <TabsTrigger value="cases">Cases ({deal.cases.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Deal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-sm text-gray-900">{deal.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Price</label>
                  <p className="text-sm text-gray-900">${deal.price.toLocaleString('en-AU')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(deal.status)} variant="outline">
                      {deal.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-900">{deal.createdAt.toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deal.riskAssessment ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Risk Score</label>
                      <div className="mt-1">
                        <Badge className={getRiskColor(deal.riskAssessment.score)} variant="outline">
                          {deal.riskAssessment.score}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Rationale</label>
                      <p className="text-sm text-gray-900">{deal.riskAssessment.rationale}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No risk assessment completed</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Parties</span>
                  <span className="text-sm font-medium">{deal.parties.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Transactions</span>
                  <span className="text-sm font-medium">{deal.transactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Cases</span>
                  <span className="text-sm font-medium">{deal.cases.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Reports</span>
                  <span className="text-sm font-medium">{deal.reports.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parties" className="space-y-4">
          {deal.parties.map((party) => (
            <Card key={party.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{party.fullName}</h3>
                        <Badge variant="outline">
                          {party.type}
                        </Badge>
                        {party.entity && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/entities/${party.entity.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View Entity
                            </Link>
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        {party.dob && (
                          <div>
                            <span className="font-medium">DOB:</span> {party.dob.toLocaleDateString()}
                          </div>
                        )}
                        {party.country && (
                          <div>
                            <span className="font-medium">Country:</span> {party.country}
                          </div>
                        )}
                        {party.docType && (
                          <div>
                            <span className="font-medium">Doc Type:</span> {party.docType}
                          </div>
                        )}
                        {party.docNumber && (
                          <div>
                            <span className="font-medium">Doc Number:</span> {party.docNumber}
                          </div>
                        )}
                      </div>

                      {party.kycCheck && (
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getKycStatusIcon(party.kycCheck.dvStatus)}
                            <span className="text-sm">KYC: {party.kycCheck.dvStatus}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            Completed: {party.kycCheck.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {deal.transactions.map((transaction) => (
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
                      {transaction.purpose && (
                        <p className="text-gray-600 mb-2">{transaction.purpose}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>From: {transaction.counterparty}</span>
                        <span>Method: {transaction.method}</span>
                        <span>Date: {transaction.receivedAt.toLocaleDateString()}</span>
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
                </div>
              </CardContent>
            </Card>
          ))}
          {deal.transactions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600">No transactions have been recorded for this deal yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {deal.reports.map((report) => {
            // Find which case this report is linked to
            const linkedCase = deal.cases.find(c => c.id === report.caseId)
            
            return (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {report.kind} Report
                          </h3>
                          <Badge 
                            variant="outline"
                            className={report.status === 'FINAL' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {report.status}
                          </Badge>
                          {linkedCase && (
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                              Linked to Case
                            </Badge>
                          )}
                        </div>
                        {linkedCase && (
                          <p className="text-gray-600 mb-2">
                            This report is linked to compliance case: <strong>#{linkedCase.id.slice(-8)} - {linkedCase.reason.replace('_', ' ')}</strong>
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created: {report.createdAt.toLocaleDateString()}</span>
                          {report.submittedAt && (
                            <span>Submitted: {report.submittedAt.toLocaleDateString()}</span>
                          )}
                          {linkedCase && (
                            <span>Case Reason: {linkedCase.reason}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {report.pdfUrl && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      {linkedCase && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/cases/${linkedCase.id}`}>
                            <FileText className="w-4 h-4 mr-2" />
                            View Case
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {deal.reports.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600 mb-4">No reports have been generated for this deal yet. Reports can be generated directly or through compliance case workflows.</p>
                <div className="space-y-2">
                  <Button>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <p className="text-xs text-gray-500">
                    Tip: Reports generated through compliance cases are automatically linked for better tracking.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          {deal.cases.map((case_) => (
            <Card key={case_.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Case #{case_.id.slice(-8)} - {case_.reason.replace('_', ' ')}
                      </h3>
                      <Badge variant="outline">
                        {case_.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {case_.reason}
                      </Badge>
                    </div>
                    {case_.notes && (
                      <div className="mb-3">
                        {JSON.parse(case_.notes as string).slice(0, 1).map((note: any, index: number) => (
                          <p key={index} className="text-gray-600 text-sm">
                            <span className="font-medium">{note.by}</span>: {note.text}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Created: {case_.createdAt.toLocaleDateString()}</span>
                      <span>Created by: {case_.createdBy.name}</span>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/cases/${case_.id}`}>
                      View Case
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {deal.cases.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases found</h3>
                <p className="text-gray-600">No compliance cases have been created for this deal.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditTrail
            events={deal.auditEvents}
            title={`Audit Trail - ${deal.address}`}
            showEntityLinks={true}
            showCaseLinks={true}
          />
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </>
  )
}