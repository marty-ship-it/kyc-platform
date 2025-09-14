import { prisma } from '@/lib/prisma'
import { Entity, Party, KycCheck, Deal } from '@prisma/client'

export interface KycReuseStatus {
  hasValidKyc: boolean
  lastKycDate: Date | null
  daysAgo: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  entityName: string
  entityId: string
  kycSource: 'current_deal' | 'previous_deal' | 'entity_profile'
  dealAddress?: string
  canReuse: boolean
  refreshRequired: boolean
  kycCheckId?: string
}

interface PartyWithKyc extends Party {
  kycChecks: KycCheck[]
  deal: Deal
}

/**
 * Service to determine KYC re-use eligibility for entities
 */
export class KycReuseService {
  private static readonly VALID_DAYS = 90
  private static readonly REVIEW_DAYS = 365

  /**
   * Get KYC status for an entity in the context of a specific deal
   */
  static async getKycStatus(entityId: string, currentDealId?: string): Promise<KycReuseStatus> {
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        parties: {
          include: {
            kycChecks: true,
            deal: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!entity) {
      throw new Error('Entity not found')
    }

    // Find the most recent valid KYC check
    const partiesWithValidKyc = entity.parties.filter(p => 
      p.kycChecks.length > 0 && p.kycChecks.some(kyc => kyc.dvStatus === 'PASS')
    ) as PartyWithKyc[]

    if (partiesWithValidKyc.length === 0) {
      return {
        hasValidKyc: false,
        lastKycDate: null,
        daysAgo: 0,
        riskLevel: entity.riskScore,
        entityName: entity.fullName || entity.legalName || 'Unknown',
        entityId: entity.id,
        kycSource: 'entity_profile',
        canReuse: false,
        refreshRequired: true
      }
    }

    // Get the most recent KYC check
    const mostRecentKyc = partiesWithValidKyc.reduce((latest, current) => {
      const latestKyc = latest.kycChecks.filter(kyc => kyc.dvStatus === 'PASS').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
      const currentKyc = current.kycChecks.filter(kyc => kyc.dvStatus === 'PASS').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
      return currentKyc.createdAt > latestKyc.createdAt ? current : latest
    })

    const kycDate = mostRecentKyc.kycChecks.filter(kyc => kyc.dvStatus === 'PASS').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
    const daysAgo = Math.floor((Date.now() - kycDate.getTime()) / (1000 * 60 * 60 * 24))

    // Determine KYC source
    let kycSource: 'current_deal' | 'previous_deal' | 'entity_profile' = 'entity_profile'
    if (currentDealId && mostRecentKyc.dealId === currentDealId) {
      kycSource = 'current_deal'
    } else if (mostRecentKyc.dealId) {
      kycSource = 'previous_deal'
    }

    const canReuse = daysAgo <= this.VALID_DAYS
    const refreshRequired = daysAgo > this.REVIEW_DAYS

    return {
      hasValidKyc: true,
      lastKycDate: kycDate,
      daysAgo,
      riskLevel: entity.riskScore,
      entityName: entity.fullName || entity.legalName || 'Unknown',
      entityId: entity.id,
      kycSource,
      dealAddress: mostRecentKyc.deal.address,
      canReuse,
      refreshRequired,
      kycCheckId: mostRecentKyc.kycChecks.filter(kyc => kyc.dvStatus === 'PASS').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].id
    }
  }

  /**
   * Get KYC status for all parties in a deal
   */
  static async getDealKycStatus(dealId: string): Promise<{ [entityId: string]: KycReuseStatus }> {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        parties: {
          where: {
            entityId: { not: null }
          },
          include: {
            entity: true
          }
        }
      }
    })

    if (!deal) {
      throw new Error('Deal not found')
    }

    const kycStatuses: { [entityId: string]: KycReuseStatus } = {}

    for (const party of deal.parties) {
      if (party.entityId && party.entity) {
        try {
          kycStatuses[party.entityId] = await this.getKycStatus(party.entityId, dealId)
        } catch (error) {
          console.error(`Error getting KYC status for entity ${party.entityId}:`, error)
        }
      }
    }

    return kycStatuses
  }

  /**
   * Check if entity needs KYC refresh based on risk profile and time elapsed
   */
  static shouldRefreshKyc(kycStatus: KycReuseStatus, entityRisk: 'LOW' | 'MEDIUM' | 'HIGH'): boolean {
    if (!kycStatus.hasValidKyc) return true

    // High risk entities need more frequent refresh
    if (entityRisk === 'HIGH' && kycStatus.daysAgo > 60) return true
    if (entityRisk === 'MEDIUM' && kycStatus.daysAgo > 180) return true
    if (entityRisk === 'LOW' && kycStatus.daysAgo > 365) return true

    return false
  }

  /**
   * Get entities that need KYC refresh
   */
  static async getEntitiesNeedingKycRefresh(): Promise<{
    entity: Entity
    kycStatus: KycReuseStatus
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
  }[]> {
    const entities = await prisma.entity.findMany({})

    const results = []

    for (const entity of entities) {
      try {
        const kycStatus = await this.getKycStatus(entity.id)
        const needsRefresh = this.shouldRefreshKyc(kycStatus, entity.riskScore)

        if (needsRefresh) {
          let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
          
          if (entity.riskScore === 'HIGH' || kycStatus.daysAgo > 365) {
            priority = 'HIGH'
          } else if (entity.riskScore === 'MEDIUM' || kycStatus.daysAgo > 180) {
            priority = 'MEDIUM'
          }

          results.push({
            entity,
            kycStatus,
            priority
          })
        }
      } catch (error) {
        console.error(`Error checking KYC for entity ${entity.id}:`, error)
      }
    }

    // Sort by priority and days since last KYC
    return results.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      return b.kycStatus.daysAgo - a.kycStatus.daysAgo
    })
  }

  /**
   * Mark KYC as reused for audit purposes
   */
  static async recordKycReuse(entityId: string, dealId: string, kycCheckId: string, userId?: string) {
    const entity = await prisma.entity.findUnique({ where: { id: entityId } })
    
    if (entity) {
      await prisma.auditEvent.create({
        data: {
          orgId: entity.orgId,
          userId,
          entityType: 'Entity',
          entityId,
          action: 'KYC_REUSED',
          payloadJson: JSON.stringify({
            dealId,
            originalKycCheckId: kycCheckId,
            reason: 'Valid KYC found and reused'
          })
        }
      })
    }
  }
}