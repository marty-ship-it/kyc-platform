// Automation settings and service for KYC platform
// This service handles automated workflows like auto-screening

export const automationSettings = {
  autoScreenOnEntityCreate: true,
  autoScreenOnEntityUpdate: true, // when key attributes change
  batchScreenTime: null // cron later - could be set to run daily at 2 AM for example
}

export interface AutomationTrigger {
  entityId: string
  triggerType: 'CREATE' | 'UPDATE' | 'BATCH'
  userId?: string
  changes?: string[] // list of changed fields for UPDATE triggers
}

export class AutomationService {
  /**
   * Triggers automated screening based on entity lifecycle events
   */
  static async processEntityTrigger(trigger: AutomationTrigger): Promise<void> {
    try {
      // Check if auto-screening is enabled
      const shouldScreen = (
        (trigger.triggerType === 'CREATE' && automationSettings.autoScreenOnEntityCreate) ||
        (trigger.triggerType === 'UPDATE' && automationSettings.autoScreenOnEntityUpdate) ||
        (trigger.triggerType === 'BATCH' && automationSettings.batchScreenTime !== null)
      )

      if (!shouldScreen) {
        return
      }

      // For UPDATE triggers, only proceed if key attributes changed
      if (trigger.triggerType === 'UPDATE' && trigger.changes) {
        const keyAttributes = ['fullName', 'legalName', 'dob', 'abnAcn', 'country']
        const hasKeyChanges = trigger.changes.some(change => keyAttributes.includes(change))
        
        if (!hasKeyChanges) {
          return
        }
      }

      // Import screening client and run screening
      const { screenEntity } = await import('./services/screeningClient')
      
      console.log(`🤖 Auto-screening triggered for entity ${trigger.entityId} (${trigger.triggerType})`)
      
      // Run the screening
      await screenEntity(trigger.entityId)
      
      // Create audit event for auto-screening
      await this.createAutoScreenAuditEvent(trigger)
      
    } catch (error) {
      console.error('Auto-screening failed:', error)
      
      // Create audit event for failed auto-screening
      await this.createAutoScreenFailedAuditEvent(trigger, error as Error)
    }
  }

  /**
   * Creates audit event for successful auto-screening
   */
  private static async createAutoScreenAuditEvent(trigger: AutomationTrigger): Promise<void> {
    try {
      const { prisma } = await import('./prisma')
      
      // Get entity info for the audit event
      const entity = await prisma.entity.findUnique({
        where: { id: trigger.entityId },
        select: { orgId: true, fullName: true, legalName: true }
      })
      
      if (!entity) return
      
      await prisma.auditEvent.create({
        data: {
          orgId: entity.orgId,
          userId: trigger.userId || null,
          entityType: 'Entity',
          entityId: trigger.entityId,
          action: 'AUTO_SCREEN_TRIGGERED',
          payloadJson: JSON.stringify({
            triggerType: trigger.triggerType,
            entityName: entity.fullName || entity.legalName,
            changes: trigger.changes || [],
            automationSettings: {
              autoScreenOnCreate: automationSettings.autoScreenOnEntityCreate,
              autoScreenOnUpdate: automationSettings.autoScreenOnEntityUpdate
            }
          })
        }
      })
      
    } catch (error) {
      console.error('Failed to create auto-screen audit event:', error)
    }
  }

  /**
   * Creates audit event for failed auto-screening
   */
  private static async createAutoScreenFailedAuditEvent(trigger: AutomationTrigger, error: Error): Promise<void> {
    try {
      const { prisma } = await import('./prisma')
      
      // Get entity info for the audit event  
      const entity = await prisma.entity.findUnique({
        where: { id: trigger.entityId },
        select: { orgId: true, fullName: true, legalName: true }
      })
      
      if (!entity) return
      
      await prisma.auditEvent.create({
        data: {
          orgId: entity.orgId,
          userId: trigger.userId || null,
          entityType: 'Entity', 
          entityId: trigger.entityId,
          action: 'AUTO_SCREEN_FAILED',
          payloadJson: JSON.stringify({
            triggerType: trigger.triggerType,
            entityName: entity.fullName || entity.legalName,
            error: error.message,
            changes: trigger.changes || []
          })
        }
      })
      
    } catch (auditError) {
      console.error('Failed to create auto-screen failure audit event:', auditError)
    }
  }

  /**
   * Batch processing for scheduled screening
   * This could be called by a cron job or similar scheduler
   */
  static async processBatchScreening(): Promise<void> {
    if (!automationSettings.batchScreenTime) {
      return
    }

    try {
      const { prisma } = await import('./prisma')
      
      // Find entities that haven't been screened recently (e.g., 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const entities = await prisma.entity.findMany({
        where: {
          OR: [
            { screenings: { none: {} } }, // Never screened
            { 
              screenings: {
                every: {
                  createdAt: {
                    lt: thirtyDaysAgo
                  }
                }
              }
            }
          ]
        },
        select: { id: true }
      })
      
      console.log(`🔄 Batch screening: Processing ${entities.length} entities`)
      
      // Process each entity
      for (const entity of entities) {
        await this.processEntityTrigger({
          entityId: entity.id,
          triggerType: 'BATCH'
        })
        
        // Add small delay to avoid overwhelming the screening service
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
    } catch (error) {
      console.error('Batch screening failed:', error)
    }
  }

  /**
   * Updates automation settings
   * This could be called from an admin settings API
   */
  static updateSettings(newSettings: Partial<typeof automationSettings>): void {
    Object.assign(automationSettings, newSettings)
    console.log('🔧 Automation settings updated:', automationSettings)
  }

  /**
   * Gets current automation settings
   */
  static getSettings(): typeof automationSettings {
    return { ...automationSettings }
  }
}

// Helper function to trigger entity automation from various parts of the application
export async function triggerEntityAutomation(
  entityId: string, 
  triggerType: 'CREATE' | 'UPDATE',
  userId?: string,
  changes?: string[]
): Promise<void> {
  await AutomationService.processEntityTrigger({
    entityId,
    triggerType,
    userId,
    changes
  })
}