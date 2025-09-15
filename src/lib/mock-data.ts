// Mock data for Vercel deployment where SQLite doesn't work
export const mockEntities = [
  {
    id: '1',
    orgId: '1',
    kind: 'INDIVIDUAL',
    fullName: 'James Chen',
    legalName: null,
    dob: new Date('1985-03-15'),
    country: 'Australia',
    abnAcn: null,
    riskScore: 'MEDIUM',
    riskRationale: 'Medium risk due to offshore investment fund involvement',
    lastKycId: null,
    lastScreeningId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    organisation: {
      id: '1',
      name: 'Coastal Realty Pty Ltd',
      abn: '12 345 678 901',
      timezone: 'Australia/Sydney'
    },
    kycs: [],
    screenings: [],
    _count: {
      cases: 1,
      deals: 1
    }
  },
  {
    id: '2',
    orgId: '1',
    kind: 'INDIVIDUAL',
    fullName: 'Margaret Wilson',
    legalName: null,
    dob: new Date('1958-07-22'),
    country: 'Australia',
    abnAcn: null,
    riskScore: 'LOW',
    riskRationale: 'Standard domestic client with clean profile',
    lastKycId: null,
    lastScreeningId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    organisation: {
      id: '1',
      name: 'Coastal Realty Pty Ltd',
      abn: '12 345 678 901',
      timezone: 'Australia/Sydney'
    },
    kycs: [],
    screenings: [],
    _count: {
      cases: 0,
      deals: 1
    }
  },
  {
    id: '3',
    orgId: '1',
    kind: 'ORGANISATION',
    fullName: 'Oceanic Investments Pty Ltd',
    legalName: 'Oceanic Investments Pty Ltd',
    dob: null,
    country: 'Australia',
    abnAcn: '123 456 789',
    riskScore: 'LOW',
    riskRationale: 'Established property investment company with clean compliance history',
    lastKycId: null,
    lastScreeningId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    organisation: {
      id: '1',
      name: 'Coastal Realty Pty Ltd',
      abn: '12 345 678 901',
      timezone: 'Australia/Sydney'
    },
    kycs: [],
    screenings: [],
    _count: {
      cases: 0,
      deals: 0
    }
  }
]

export const mockDeals = [
  {
    id: '1',
    address: '12 Seaview Rd, Bondi NSW',
    price: 1200000,
    status: 'ACTIVE',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdByUserId: '2',
    orgId: '1',
    createdBy: {
      id: '2',
      name: 'Luca Romano',
      email: 'luca@coastalrealty.com',
      role: 'AGENT'
    },
    parties: [
      {
        id: '1',
        dealId: '1',
        entityId: '1',
        type: 'BUYER',
        fullName: 'James Chen',
        entity: mockEntities[0],
        kycChecks: [],
        screenings: []
      },
      {
        id: '2',
        dealId: '1',
        entityId: '2',
        type: 'SELLER',
        fullName: 'Margaret Wilson',
        entity: mockEntities[1],
        kycChecks: [],
        screenings: []
      }
    ],
    _count: {
      parties: 2,
      transactions: 4,
      reports: 0
    }
  }
]

export const mockCases = [
  {
    id: '1',
    orgId: '1',
    entityId: '1',
    dealId: '1',
    reason: 'RISK_ESCALATION',
    status: 'UNDER_REVIEW',
    notes: JSON.stringify([{
      by: 'Luca Romano',
      at: new Date('2024-01-16T09:30:00Z').toISOString(),
      text: 'Client showing medium risk indicators due to offshore investment fund connections. Requires additional due diligence.'
    }]),
    createdById: '2',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    entity: mockEntities[0],
    deal: mockDeals[0],
    createdBy: {
      id: '2',
      name: 'Luca Romano',
      email: 'luca@coastalrealty.com',
      role: 'AGENT'
    },
    reports: [],
    organisation: {
      id: '1',
      name: 'Coastal Realty Pty Ltd',
      abn: '12 345 678 901',
      timezone: 'Australia/Sydney'
    },
    _count: {
      reports: 0
    }
  }
]