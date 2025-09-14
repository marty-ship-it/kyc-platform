import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  User, 
  Building2, 
  FileText, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Eye,
  FolderOpen,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface AuditEvent {
  id: string
  entityType: string
  entityId: string
  caseId?: string
  action: string
  payloadJson?: string
  createdAt: Date
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
  org: {
    id: string
    name: string
  }
}

interface AuditTrailProps {
  events: AuditEvent[]
  showEntityLinks?: boolean
  showCaseLinks?: boolean
  maxEvents?: number
  title?: string
}

export function AuditTrail({ 
  events, 
  showEntityLinks = true, 
  showCaseLinks = true, 
  maxEvents = 50,
  title = "Audit Trail" 
}: AuditTrailProps) {
  const sortedEvents = events
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, maxEvents)

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'UPDATE':
      case 'EDIT':
        return <RefreshCw className="w-4 h-4 text-blue-600" />
      case 'DELETE':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'KYC_CHECK':
      case 'AUTO_SCREENING':
      case 'AUTO_SCREEN_TRIGGERED':
        return <Shield className="w-4 h-4 text-purple-600" />
      case 'AUTO_SCREEN_FAILED':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'KYC_REUSED':
        return <RefreshCw className="w-4 h-4 text-green-600" />
      case 'CLOSE':
        return <CheckCircle className="w-4 h-4 text-gray-600" />
      case 'ASSIGN':
        return <User className="w-4 h-4 text-blue-600" />
      case 'REPORT_GENERATE':
        return <FileText className="w-4 h-4 text-indigo-600" />
      case 'CASE_STATUS_CHANGE':
        return <RefreshCw className="w-4 h-4 text-orange-600" />
      case 'CASE_CREATED':
        return <FolderOpen className="w-4 h-4 text-green-600" />
      case 'CASE_NOTE_ADDED':
        return <FileText className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'Entity':
        return <Building2 className="w-4 h-4 text-blue-600" />
      case 'Case':
        return <FolderOpen className="w-4 h-4 text-purple-600" />
      case 'Deal':
        return <FileText className="w-4 h-4 text-green-600" />
      case 'User':
        return <User className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getActionDescription = (event: AuditEvent) => {
    const payload = event.payloadJson ? JSON.parse(event.payloadJson) : {}
    
    switch (event.action) {
      case 'CREATE':
        return `Created ${event.entityType.toLowerCase()}`
      case 'UPDATE':
        return `Updated ${event.entityType.toLowerCase()}`
      case 'DELETE':
        return `Deleted ${event.entityType.toLowerCase()}`
      case 'KYC_CHECK':
        return `Ran KYC check${payload.status ? ` - ${payload.status}` : ''}`
      case 'AUTO_SCREENING':
        return `Auto-screening completed - Risk: ${payload.riskScore || 'Unknown'}`
      case 'AUTO_SCREEN_TRIGGERED':
        return `Auto-screening triggered (${payload.triggerType || 'Unknown'}) - Entity: ${payload.entityName || 'Unknown'}`
      case 'AUTO_SCREEN_FAILED':
        return `Auto-screening failed: ${payload.error || 'Unknown error'}`
      case 'KYC_REUSED':
        return `KYC verification reused from previous check`
      case 'CLOSE':
        return `Closed ${event.entityType.toLowerCase()}${payload.newStatus ? ` (${payload.newStatus})` : ''}`
      case 'ASSIGN':
        return `Assigned ${event.entityType.toLowerCase()}${payload.assignedTo ? ` to ${payload.assignedTo}` : ''}`
      case 'REPORT_GENERATE':
        return `Generated ${payload.reportType || 'report'}${payload.status ? ` - ${payload.status}` : ''}`
      case 'CASE_STATUS_CHANGE':
        return `Case status changed from ${payload.oldStatus} to ${payload.newStatus}`
      case 'CASE_CREATED':
        return `Created case for ${payload.reason || 'compliance review'}`
      case 'CASE_NOTE_ADDED':
        return `Added note: ${payload.notePreview || 'Case updated'}`
      default:
        return `${event.action} on ${event.entityType.toLowerCase()}`
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'DIRECTOR':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'COMPLIANCE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'AGENT':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>{title}</span>
          <Badge variant="outline" className="ml-2">
            {events.length} Events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No audit events</h3>
            <p className="text-gray-600">No audit events have been recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  {getActionIcon(event.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getEntityTypeIcon(event.entityType)}
                    <p className="text-sm font-medium text-gray-900">
                      {getActionDescription(event)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {event.entityType}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                    <span>{event.createdAt.toLocaleString()}</span>
                    {event.user && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{event.user.name}</span>
                        <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(event.user.role)}`}>
                          {event.user.role.toLowerCase()}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {event.payloadJson && (
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer hover:text-gray-800">
                        View details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(JSON.parse(event.payloadJson), null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                <div className="flex-shrink-0 flex space-x-1">
                  {showEntityLinks && event.entityType === 'Entity' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/entities/${event.entityId}`}>
                        <Eye className="w-3 h-3" />
                      </Link>
                    </Button>
                  )}
                  {showCaseLinks && event.caseId && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/cases/${event.caseId}`}>
                        <FolderOpen className="w-3 h-3" />
                      </Link>
                    </Button>
                  )}
                  {event.entityType === 'Deal' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/deals/${event.entityId}`}>
                        <FileText className="w-3 h-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {events.length > maxEvents && (
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {maxEvents} of {events.length} events
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Load More Events
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}