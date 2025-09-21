import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Filter,
  Clock,
  Shield,
  FileText,
  DollarSign,
  Activity,
  Calendar,
  CheckCircle,
  AlertCircle,
  Search,
  User
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface ActivityPageProps {
  params: {
    id: string
  }
}

type ActivityEvent = {
  id: string
  type: 'KYC' | 'SCREENING' | 'CASE' | 'TRANSACTION' | 'AUDIT'
  title: string
  description: string
  timestamp: Date
  icon: JSX.Element
  color: string
  metadata?: Record<string, any>
}

async function getEntityActivity(entityId: string) {
  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    include: {
      kycs: {
        orderBy: { createdAt: 'desc' }
      },
      screenings: {
        orderBy: { createdAt: 'desc' }
      },
      cases: {
        include: {
          createdBy: true
        },
        orderBy: { createdAt: 'desc' }
      },
      transactions: {
        orderBy: { receivedAt: 'desc' }
      }
    }
  })

  if (!entity) return null

  // Compile all activities into a unified timeline
  const activities: ActivityEvent[] = []

  // Add KYC events
  entity.kycs.forEach(kyc => {
    activities.push({
      id: `kyc-${kyc.id}`,
      type: 'KYC',
      title: 'KYC Verification',
      description: `Document verification completed - ${kyc.dvStatus}`,
      timestamp: kyc.createdAt,
      icon: <Shield className="w-4 h-4" />,
      color: kyc.dvStatus === 'PASS' ? 'text-green-600' : kyc.dvStatus === 'FAIL' ? 'text-red-600' : 'text-yellow-600',
      metadata: {
        status: kyc.dvStatus,
        liveness: kyc.liveness,
        docType: kyc.docType
      }
    })
  })

  // Add Screening events
  entity.screenings.forEach(screening => {
    const hasIssues = screening.pep || screening.sanctions || screening.adverseMedia
    activities.push({
      id: `screening-${screening.id}`,
      type: 'SCREENING',
      title: 'Screening Check',
      description: hasIssues ? 'Issues found during screening' : 'Clear screening results',
      timestamp: screening.createdAt,
      icon: <Search className="w-4 h-4" />,
      color: hasIssues ? 'text-red-600' : 'text-green-600',
      metadata: {
        pep: screening.pep,
        sanctions: screening.sanctions,
        adverseMedia: screening.adverseMedia
      }
    })
  })

  // Add Case events
  entity.cases.forEach(case_ => {
    activities.push({
      id: `case-${case_.id}`,
      type: 'CASE',
      title: `Case ${case_.reason.replace('_', ' ')}`,
      description: `${case_.status} - Created by ${case_.createdBy.name}`,
      timestamp: case_.createdAt,
      icon: <FileText className="w-4 h-4" />,
      color: case_.status === 'CLOSED' ? 'text-gray-600' : 'text-orange-600',
      metadata: {
        status: case_.status,
        reason: case_.reason,
        signals: case_.signals
      }
    })
  })

  // Add Transaction events
  entity.transactions.forEach(txn => {
    activities.push({
      id: `txn-${txn.id}`,
      type: 'TRANSACTION',
      title: `${txn.type} Transaction`,
      description: `${txn.currency} ${txn.amount.toLocaleString()} ${txn.direction}`,
      timestamp: txn.receivedAt,
      icon: <DollarSign className="w-4 h-4" />,
      color: txn.flagged ? 'text-red-600' : 'text-blue-600',
      metadata: {
        amount: txn.amount,
        direction: txn.direction,
        counterparty: txn.counterparty,
        overseasAccount: txn.overseasAccount
      }
    })
  })

  // Sort all activities by timestamp (newest first)
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return {
    entity,
    activities
  }
}

function getEventIcon(type: string) {
  switch (type) {
    case 'KYC':
      return <Shield className="w-5 h-5" />
    case 'SCREENING':
      return <Search className="w-5 h-5" />
    case 'CASE':
      return <FileText className="w-5 h-5" />
    case 'TRANSACTION':
      return <DollarSign className="w-5 h-5" />
    default:
      return <Activity className="w-5 h-5" />
  }
}

export default async function EntityActivityPage({ params }: ActivityPageProps) {
  const { id } = await params
  const data = await getEntityActivity(id)

  if (!data) {
    notFound()
  }

  const { entity, activities } = data

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/entities/${entity.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Entity
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Activity Timeline
              </h1>
              <p className="text-gray-600">
                {entity.fullName || entity.legalName} • {activities.length} activities
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Input 
                type="text" 
                placeholder="Search activities..." 
                className="w-64"
              />
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="kyc">KYC Only</SelectItem>
                  <SelectItem value="screening">Screening Only</SelectItem>
                  <SelectItem value="case">Cases Only</SelectItem>
                  <SelectItem value="transaction">Transactions Only</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="7">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="relative">
                    {index < activities.length - 1 && (
                      <div className="absolute left-6 top-12 h-full w-0.5 bg-gray-200" />
                    )}
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-white border-2 ${
                        activity.type === 'KYC' ? 'border-blue-500' :
                        activity.type === 'SCREENING' ? 'border-purple-500' :
                        activity.type === 'CASE' ? 'border-orange-500' :
                        activity.type === 'TRANSACTION' ? 'border-green-500' :
                        'border-gray-500'
                      }`}>
                        <div className={activity.color}>
                          {activity.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              {activity.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.description}
                            </p>
                            {activity.metadata && (
                              <div className="flex items-center space-x-2 mt-2">
                                {activity.type === 'TRANSACTION' && (
                                  <>
                                    {activity.metadata.overseasAccount && (
                                      <Badge variant="outline" className="text-xs">
                                        Overseas Account
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {activity.metadata.direction}
                                    </Badge>
                                  </>
                                )}
                                {activity.type === 'SCREENING' && (
                                  <>
                                    {activity.metadata.pep && (
                                      <Badge variant="destructive" className="text-xs">
                                        PEP Match
                                      </Badge>
                                    )}
                                    {activity.metadata.sanctions && (
                                      <Badge variant="destructive" className="text-xs">
                                        Sanctions
                                      </Badge>
                                    )}
                                    {activity.metadata.adverseMedia && (
                                      <Badge variant="destructive" className="text-xs">
                                        Adverse Media
                                      </Badge>
                                    )}
                                  </>
                                )}
                                {activity.type === 'CASE' && activity.metadata.signals && (
                                  <>
                                    {(JSON.parse(activity.metadata.signals as string) as any[]).map((signal, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {signal.type}
                                      </Badge>
                                    ))}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {activity.timestamp.toLocaleString('en-AU', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {activities.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities found</h3>
                  <p className="text-gray-600">This entity has no recorded activities yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}