import { prisma } from '@/lib/prisma'

export interface AuditEventData {
  entityType: string
  entityId: string
  caseId?: string
  action: string
  payloadJson?: Record<string, any>
  userId?: string
  orgId?: string
}

/**
 * Service for creating and managing audit events
 * Provides standardized audit logging across the platform
 */
export class AuditService {
  /**
   * Create an audit event
   */
  static async createEvent(data: AuditEventData): Promise<void> {
    try {
      await prisma.auditEvent.create({
        data: {
          orgId: data.orgId!,
          userId: data.userId || null,
          entityType: data.entityType,
          entityId: data.entityId,
          caseId: data.caseId || null,
          action: data.action,
          payloadJson: data.payloadJson ? JSON.stringify(data.payloadJson) : null
        }
      })
    } catch (error) {
      console.error('Failed to create audit event:', error)
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Create multiple audit events in batch
   */
  static async createBatchEvents(events: AuditEventData[]): Promise<void> {
    try {
      await prisma.auditEvent.createMany({
        data: events.map(event => ({
          orgId: event.orgId!,
          userId: event.userId || null,
          entityType: event.entityType,
          entityId: event.entityId,
          caseId: event.caseId || null,
          action: event.action,
          payloadJson: event.payloadJson ? JSON.stringify(event.payloadJson) : null
        }))
      })
    } catch (error) {
      console.error('Failed to create batch audit events:', error)
      // Don't throw error to avoid breaking main functionality
    }
  }

  // Convenience methods for common audit actions

  /**
   * Log entity creation
   */
  static async logEntityCreated(
    entityType: string,
    entityId: string,
    orgId: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.createEvent({
      entityType,
      entityId,
      action: 'CREATE',
      orgId,
      userId,
      payloadJson: {
        createdAt: new Date().toISOString(),
        ...metadata
      }
    })
  }

  /**
   * Log entity update
   */
  static async logEntityUpdated(
    entityType: string,
    entityId: string,
    orgId: string,
    userId?: string,
    changes?: Record<string, any>
  ): Promise<void> {
    await this.createEvent({
      entityType,
      entityId,
      action: 'UPDATE',
      orgId,
      userId,
      payloadJson: {
        updatedAt: new Date().toISOString(),
        changes: changes || {}
      }
    })
  }

  /**
   * Log case status change
   */
  static async logCaseStatusChange(
    caseId: string,
    entityId: string,
    oldStatus: string,
    newStatus: string,
    orgId: string,
    userId?: string,
    reason?: string
  ): Promise<void> {
    await this.createEvent({
      entityType: 'Case',
      entityId: entityId,
      caseId,
      action: 'CASE_STATUS_CHANGE',
      orgId,
      userId,
      payloadJson: {
        oldStatus,
        newStatus,
        reason,
        changedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log case note addition
   */
  static async logCaseNoteAdded(
    caseId: string,
    entityId: string,
    orgId: string,
    userId?: string,
    notePreview?: string
  ): Promise<void> {
    await this.createEvent({
      entityType: 'Case',
      entityId: entityId,
      caseId,
      action: 'CASE_NOTE_ADDED',
      orgId,
      userId,
      payloadJson: {
        notePreview: notePreview?.substring(0, 100),
        addedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log KYC verification
   */
  static async logKycVerification(
    entityId: string,
    orgId: string,
    userId?: string,
    status?: string,
    provider?: string
  ): Promise<void> {
    await this.createEvent({
      entityType: 'Entity',
      entityId,
      action: 'KYC_CHECK',
      orgId,
      userId,
      payloadJson: {
        status,
        provider,
        checkedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log screening activity
   */
  static async logScreening(
    entityId: string,
    orgId: string,
    userId?: string,
    riskScore?: string,
    triggers?: string[]
  ): Promise<void> {
    await this.createEvent({
      entityType: 'Entity',
      entityId,
      action: 'AUTO_SCREENING',
      orgId,
      userId,
      payloadJson: {
        riskScore,
        triggers: triggers || [],
        screenedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log report generation
   */
  static async logReportGenerated(
    dealId: string,
    caseId: string | null,
    orgId: string,
    userId?: string,
    reportType?: string,
    status?: string
  ): Promise<void> {
    await this.createEvent({
      entityType: 'Deal',
      entityId: dealId,
      caseId: caseId || undefined,
      action: 'REPORT_GENERATE',
      orgId,
      userId,
      payloadJson: {
        reportType,
        status,
        generatedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Get audit events for entity
   */
  static async getEntityAuditTrail(
    entityId: string,
    entityType: string,
    orgId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      return await prisma.auditEvent.findMany({
        where: {
          orgId,
          OR: [
            { entityId, entityType },
            { entityId, entityType: 'Case' }, // Include case events for this entity
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          org: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      })
    } catch (error) {
      console.error('Failed to get entity audit trail:', error)
      return []
    }
  }

  /**
   * Get audit events for case
   */
  static async getCaseAuditTrail(
    caseId: string,
    orgId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      return await prisma.auditEvent.findMany({
        where: {
          orgId,
          caseId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          org: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      })
    } catch (error) {
      console.error('Failed to get case audit trail:', error)
      return []
    }
  }
}