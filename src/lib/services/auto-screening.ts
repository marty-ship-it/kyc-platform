import { prisma } from '@/lib/prisma'
import { Entity, Party, Screening, Case } from '@prisma/client'

export interface ScreeningResult {
  entityId: string
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH'
  pep: boolean
  sanctions: boolean
  adverseMedia: boolean
  dvsVerification: boolean
  newMatches: string[]
  previousMatches: string[]
  requiresReview: boolean
}

export interface AutoScreeningConfig {
  // How often to run auto-screening (in hours)
  intervalHours: number
  // Risk thresholds that trigger case creation
  riskThresholds: {
    pepMatch: boolean
    sanctionsMatch: boolean
    adverseMediaCount: number
    riskScoreChange: boolean
  }
  // Industries that require more frequent screening
  highRiskIndustries: string[]
  // Countries that require enhanced screening
  highRiskJurisdictions: string[]
}

const DEFAULT_CONFIG: AutoScreeningConfig = {
  intervalHours: 24,
  riskThresholds: {
    pepMatch: true,
    sanctionsMatch: true,
    adverseMediaCount: 3,
    riskScoreChange: true
  },
  highRiskIndustries: [
    'Cryptocurrency',
    'Money Services',
    'Precious Metals',
    'Art & Antiquities',
    'Gaming'
  ],
  highRiskJurisdictions: [
    'North Korea',
    'Iran',
    'Syria',
    'Afghanistan',
    'Yemen'
  ]
}

/**
 * Mock screening service - simulates external screening API
 */
class MockScreeningService {
  async screenEntity(entity: Entity): Promise<ScreeningResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))

    // Mock screening logic based on entity characteristics
    const isHighRisk = this.isHighRiskEntity(entity)
    const random = Math.random()

    // Simulate different screening outcomes
    let pep = false
    let sanctions = false
    let adverseMedia = false
    let dvsVerification = false
    let riskScore: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'

    if (isHighRisk) {
      // High risk entities have higher chance of matches
      pep = random < 0.1
      sanctions = random < 0.05
      adverseMedia = random < 0.2
      dvsVerification = random < 0.15 // Higher chance of DVS failure for high risk
      riskScore = random < 0.3 ? 'HIGH' : random < 0.6 ? 'MEDIUM' : 'LOW'
    } else {
      // Standard entities have lower chance
      pep = random < 0.02
      sanctions = random < 0.01
      adverseMedia = random < 0.05
      dvsVerification = random < 0.05 // Lower chance of DVS failure for standard entities
      riskScore = random < 0.1 ? 'MEDIUM' : 'LOW'
    }

    const newMatches: string[] = []
    if (pep) newMatches.push(`PEP Match: ${entity.name} - Government Official`)
    if (sanctions) newMatches.push(`Sanctions Match: ${entity.name} - OFAC List`)
    if (adverseMedia) newMatches.push(`Adverse Media: ${entity.name} - Financial Crime Investigation`)
    if (dvsVerification) newMatches.push(`DVS Verification Failed: ${entity.name} - Document details could not be verified`)

    return {
      entityId: entity.id,
      riskScore,
      pep,
      sanctions,
      adverseMedia,
      dvsVerification,
      newMatches,
      previousMatches: [],
      requiresReview: pep || sanctions || dvsVerification || (adverseMedia && newMatches.length > 2)
    }
  }

  private isHighRiskEntity(entity: Entity): boolean {
    return (
      DEFAULT_CONFIG.highRiskIndustries.includes(entity.industry || '') ||
      DEFAULT_CONFIG.highRiskJurisdictions.includes(entity.jurisdiction || '') ||
      entity.riskProfile === 'HIGH'
    )
  }
}

/**
 * Auto-screening service that runs periodic checks on entities
 */
export class AutoScreeningService {
  private mockService = new MockScreeningService()
  private config: AutoScreeningConfig

  constructor(config: AutoScreeningConfig = DEFAULT_CONFIG) {
    this.config = config
  }

  /**
   * Run screening for all active entities that are due for review
   */
  async runScheduledScreening(): Promise<{
    screened: number
    flagged: number
    casesCreated: number
  }> {
    console.log('Starting auto-screening run...')

    // Get entities that need screening
    const entities = await this.getEntitiesDueForScreening()
    console.log(`Found ${entities.length} entities due for screening`)

    let flaggedCount = 0
    let casesCreated = 0

    for (const entity of entities) {
      try {
        const result = await this.screenEntity(entity)
        
        if (result.requiresReview) {
          flaggedCount++
          
          // Create case if needed
          const caseCreated = await this.handleScreeningAlert(entity, result)
          if (caseCreated) casesCreated++
        }

        // Update entity risk profile if changed
        if (result.riskScore !== entity.riskProfile) {
          await this.updateEntityRiskProfile(entity.id, result.riskScore)
        }

      } catch (error) {
        console.error(`Error screening entity ${entity.id}:`, error)
      }
    }

    console.log(`Auto-screening completed: ${entities.length} screened, ${flaggedCount} flagged, ${casesCreated} cases created`)

    return {
      screened: entities.length,
      flagged: flaggedCount,
      casesCreated
    }
  }

  /**
   * Screen a specific entity
   */
  async screenEntity(entity: Entity): Promise<ScreeningResult> {
    const result = await this.mockService.screenEntity(entity)

    // Get existing parties and their screening results to compare
    const parties = await prisma.party.findMany({
      where: { entityId: entity.id },
      include: { screenings: true }
    })

    // Compare with previous results
    result.previousMatches = this.extractPreviousMatches(parties)

    // Log screening attempt
    await this.logScreeningEvent(entity.id, result)

    return result
  }

  /**
   * Handle screening alerts by creating cases or updating existing ones
   */
  private async handleScreeningAlert(entity: Entity, result: ScreeningResult): Promise<boolean> {
    const { pep, sanctions, adverseMedia } = result

    // Check if there's already an active screening case
    const existingCase = await prisma.case.findFirst({
      where: {
        entityId: entity.id,
        status: { in: ['ACTIVE', 'UNDER_REVIEW'] },
        title: { contains: 'Auto-Screening Alert' }
      }
    })

    const alertDetails = [
      pep && 'PEP match detected',
      sanctions && 'Sanctions list match found',
      adverseMedia && 'Adverse media references identified'
    ].filter(Boolean).join(', ')

    if (existingCase) {
      // Update existing case with new findings
      await prisma.case.update({
        where: { id: existingCase.id },
        data: {
          description: `${existingCase.description}\n\nNew screening results: ${alertDetails}`,
          updatedAt: new Date()
        }
      })
      return false
    } else {
      // Create new case
      const compliance = await prisma.user.findFirst({
        where: { role: 'COMPLIANCE' }
      })

      await prisma.case.create({
        data: {
          entityId: entity.id,
          title: `Auto-Screening Alert - ${entity.name}`,
          description: `Automated screening has flagged this entity for review.\n\nFindings: ${alertDetails}\n\nRisk Score: ${result.riskScore}\n\nReview required to determine appropriate action.`,
          status: 'ACTIVE',
          priority: result.riskScore === 'HIGH' ? 'URGENT' : 'HIGH',
          assignedToUserId: compliance?.id
        }
      })
      return true
    }
  }

  /**
   * Get entities that are due for screening based on configured intervals
   */
  private async getEntitiesDueForScreening(): Promise<Entity[]> {
    const hoursAgo = new Date()
    hoursAgo.setHours(hoursAgo.getHours() - this.config.intervalHours)

    return prisma.entity.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { lastKycAt: { lt: hoursAgo } },
          { lastKycAt: null }
        ]
      },
      orderBy: {
        lastKycAt: 'asc' // Prioritize entities that haven't been screened in longest time
      },
      take: 50 // Limit batch size
    })
  }

  /**
   * Update entity risk profile
   */
  private async updateEntityRiskProfile(entityId: string, newRiskScore: 'LOW' | 'MEDIUM' | 'HIGH') {
    await prisma.entity.update({
      where: { id: entityId },
      data: {
        riskProfile: newRiskScore,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Extract previous screening matches from party records
   */
  private extractPreviousMatches(parties: (Party & { screenings: Screening[] })[]): string[] {
    const matches: string[] = []
    
    parties.forEach(party => {
      party.screenings.forEach(screening => {
        if (screening.pep) matches.push('PEP Match')
        if (screening.sanctions) matches.push('Sanctions Match')
        if (screening.adverseMedia) matches.push('Adverse Media')
      })
    })
    
    return matches
  }

  /**
   * Log screening events for audit trail
   */
  private async logScreeningEvent(entityId: string, result: ScreeningResult) {
    const entity = await prisma.entity.findUnique({ where: { id: entityId } })
    
    await prisma.auditEvent.create({
      data: {
        orgId: entity!.orgId,
        entityType: 'Entity',
        entityId,
        action: 'AUTO_SCREENING',
        payloadJson: JSON.stringify({
          riskScore: result.riskScore,
          pep: result.pep,
          sanctions: result.sanctions,
          adverseMedia: result.adverseMedia,
          newMatches: result.newMatches,
          requiresReview: result.requiresReview
        })
      }
    })
  }
}

/**
 * API endpoint function for manual screening trigger
 */
export async function triggerManualScreening(entityId: string): Promise<ScreeningResult> {
  const entity = await prisma.entity.findUnique({
    where: { id: entityId }
  })

  if (!entity) {
    throw new Error('Entity not found')
  }

  const autoScreening = new AutoScreeningService()
  return autoScreening.screenEntity(entity)
}

/**
 * Utility function to start auto-screening service (for background jobs)
 */
export async function startAutoScreeningScheduler(intervalMinutes: number = 60) {
  const autoScreening = new AutoScreeningService()
  
  console.log(`Starting auto-screening scheduler (every ${intervalMinutes} minutes)`)
  
  // Run immediately on start
  await autoScreening.runScheduledScreening()
  
  // Set up recurring schedule
  setInterval(async () => {
    try {
      await autoScreening.runScheduledScreening()
    } catch (error) {
      console.error('Auto-screening error:', error)
    }
  }, intervalMinutes * 60 * 1000)
}