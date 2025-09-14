import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Building2,
  Calendar,
  MessageSquare,
  Upload,
  Download,
  Eye,
  Edit,
  X
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { AuditTrail } from '@/components/audit-trail'

interface CaseDetailProps {
  params: {
    id: string
  }
}

async function getCase(id: string) {
  const case_ = await prisma.case.findUnique({
    where: { id },
    include: {
      entity: true,
      deal: true,
      createdBy: true,
      organisation: true,
      reports: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })
  
  if (!case_) return null
  
  // Get audit events related to this case and its entity
  const auditEvents = await prisma.auditEvent.findMany({
    where: {
      OR: [
        { caseId: id },
        { entityType: 'Case', entityId: id },
        { entityId: case_.entityId, entityType: 'Entity' }
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
  
  return { ...case_, auditEvents }
}

function getCaseStatusIcon(status: string) {
  switch (status) {
    case 'OPEN':
      return <AlertCircle className="w-5 h-5 text-yellow-600" />
    case 'UNDER_REVIEW':
      return <Clock className="w-5 h-5 text-blue-600" />
    case 'SUBMITTED':
      return <CheckCircle className="w-5 h-5 text-green-600" />
    case 'CLOSED':
      return <XCircle className="w-5 h-5 text-gray-600" />
    default:
      return <AlertCircle className="w-5 h-5 text-gray-600" />
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

export default async function CaseDetailPage({ params }: CaseDetailProps) {
  const case_ = await getCase(params.id)

  if (!case_) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/cases">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Link>
        </Button>
      </div>

      {/* Case Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 mt-1">
            {getCaseStatusIcon(case_.status)}
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{getReasonIcon(case_.reason)}</span>
              <h1 className="text-3xl font-bold text-gray-900">
                Case #{case_.id.slice(-8)} - {case_.reason.replace('_', ' ')}
              </h1>
            </div>
            <div className="flex items-center space-x-4 text-gray-600 mb-3">
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
            <div className="flex items-center space-x-2">
              <Badge className={getCaseReasonColor(case_.reason)} variant="outline">
                {case_.reason}
              </Badge>
              <Badge className={getCaseStatusColor(case_.status)} variant="outline">
                {case_.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Case
          </Button>
          <Select defaultValue={case_.status}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Tabs Content */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details">Case Details</TabsTrigger>
          <TabsTrigger value="entity">Entity Info</TabsTrigger>
          <TabsTrigger value="reports">Reports ({case_.reports.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Case Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {case_.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Case Notes Timeline</label>
                    <div className="mt-2 space-y-3">
                      {JSON.parse(case_.notes as string).map((note: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{note.by}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(note.at).toLocaleString('en-AU')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm text-gray-900">{case_.createdAt.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-sm text-gray-900">{case_.updatedAt.toLocaleString()}</p>
                  </div>
                  {case_.closedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Closed</label>
                      <p className="text-sm text-gray-900">{case_.closedAt.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Case Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Case Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <Badge className={getCaseStatusColor(case_.status)} variant="outline" className="text-xs">
                      {case_.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reason:</span>
                    <Badge className={getCaseReasonColor(case_.reason)} variant="outline" className="text-xs">
                      {case_.reason}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reports:</span>
                    <span className="font-medium">{case_.reports.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Created By:</span>
                    <span className="font-medium">{case_.createdBy.name}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Note Section */}
          <Card>
            <CardHeader>
              <CardTitle>Add Case Note</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Add a note about this case..."
                  className="min-h-[100px]"
                />
                <div className="flex space-x-2">
                  <Button>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Save Note
                  </Button>
                  <Button variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Entity Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{case_.entity.fullName || case_.entity.legalName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Kind</label>
                  <p className="text-sm text-gray-900">{case_.entity.kind}</p>
                </div>
                {case_.entity.country && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Country</label>
                    <p className="text-sm text-gray-900">{case_.entity.country}</p>
                  </div>
                )}
                {case_.entity.abnAcn && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">ABN/ACN</label>
                    <p className="text-sm text-gray-900">{case_.entity.abnAcn}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Risk Score</label>
                  <div className="mt-1">
                    <Badge 
                      variant="outline" 
                      className={
                        case_.entity.riskScore === 'HIGH' ? 'bg-red-100 text-red-800' :
                        case_.entity.riskScore === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }
                    >
                      {case_.entity.riskScore}
                    </Badge>
                  </div>
                </div>
                {case_.entity.riskRationale && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Risk Rationale</label>
                    <p className="text-sm text-gray-900">{case_.entity.riskRationale}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-900">
                    {new Date(case_.entity.createdAt).toLocaleDateString('en-AU')}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/entities/${case_.entity.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Entity
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {case_.reports.map((report) => (
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
                        <Badge variant="outline" className="text-xs">
                          Case-Linked
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">
                        This report was generated as part of the compliance case workflow and is directly linked to case findings.
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created: {report.createdAt.toLocaleDateString()}</span>
                        {report.submittedAt && (
                          <span>Submitted: {report.submittedAt.toLocaleDateString()}</span>
                        )}
                        {case_.deal && (
                          <span>Deal: {case_.deal.address}</span>
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
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      View Deal Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {case_.reports.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600 mb-4">No reports have been generated for this case yet. Generate a report to document case findings and compliance status.</p>
                <div className="space-y-2">
                  <Button>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate TTR Report
                  </Button>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate SMR Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditTrail
            events={case_.auditEvents}
            title={`Audit Trail - Case #${case_.id.slice(-8)}`}
            showEntityLinks={true}
            showCaseLinks={false}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents</h3>
              <p className="text-gray-600 mb-4">No documents have been uploaded for this case yet.</p>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </>
  )
}