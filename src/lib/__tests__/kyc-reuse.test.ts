import { KycReuseService } from '../services/kyc-reuse'

describe('KycReuseService', () => {
  describe('shouldRefreshKyc', () => {
    const createMockKycStatus = (daysAgo: number, hasValidKyc: boolean = true) => ({
      hasValidKyc,
      lastKycDate: new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000)),
      daysAgo,
      riskLevel: 'MEDIUM' as const,
      entityName: 'Test Entity',
      entityId: 'test-id',
      kycSource: 'previous_deal' as const,
      canReuse: daysAgo <= 90,
      refreshRequired: daysAgo > 365
    })

    it('should require refresh if no valid KYC exists', () => {
      const kycStatus = createMockKycStatus(0, false)
      expect(KycReuseService.shouldRefreshKyc(kycStatus, 'LOW')).toBe(true)
    })

    it('should require refresh for HIGH risk entities after 60 days', () => {
      const kycStatus = createMockKycStatus(61)
      expect(KycReuseService.shouldRefreshKyc(kycStatus, 'HIGH')).toBe(true)
      
      const recentKyc = createMockKycStatus(59)
      expect(KycReuseService.shouldRefreshKyc(recentKyc, 'HIGH')).toBe(false)
    })

    it('should require refresh for MEDIUM risk entities after 180 days', () => {
      const kycStatus = createMockKycStatus(181)
      expect(KycReuseService.shouldRefreshKyc(kycStatus, 'MEDIUM')).toBe(true)
      
      const recentKyc = createMockKycStatus(179)
      expect(KycReuseService.shouldRefreshKyc(recentKyc, 'MEDIUM')).toBe(false)
    })

    it('should require refresh for LOW risk entities after 365 days', () => {
      const kycStatus = createMockKycStatus(366)
      expect(KycReuseService.shouldRefreshKyc(kycStatus, 'LOW')).toBe(true)
      
      const recentKyc = createMockKycStatus(364)
      expect(KycReuseService.shouldRefreshKyc(recentKyc, 'LOW')).toBe(false)
    })
  })
})