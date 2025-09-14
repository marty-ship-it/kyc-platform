interface ScreeningResult {
  pep: boolean
  sanctions: boolean
  adverseMedia: boolean
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH'
  details: {
    pepSources: any[]
    sanctionsSources: any[]
    adverseMediaSources: any[]
  }
  lastChecked: string
}

const mockResponses: Record<string, ScreeningResult> = {
  'james_chen': {
    pep: false,
    sanctions: false,
    adverseMedia: true,
    riskScore: 'MEDIUM',
    details: {
      pepSources: [],
      sanctionsSources: [],
      adverseMediaSources: [
        {
          source: 'Australian Financial Review',
          headline: 'Property investor linked to offshore investment fund',
          date: '2023-08-15',
          relevanceScore: 65,
          summary: 'James Chen mentioned in article about foreign investment in Australian property market'
        }
      ]
    },
    lastChecked: '2024-01-15T10:30:00Z'
  },
  'sarah_smith': {
    pep: false,
    sanctions: false,
    adverseMedia: false,
    riskScore: 'LOW',
    details: {
      pepSources: [],
      sanctionsSources: [],
      adverseMediaSources: []
    },
    lastChecked: '2024-01-15T10:30:00Z'
  },
  'default': {
    pep: false,
    sanctions: false,
    adverseMedia: false,
    riskScore: 'LOW',
    details: {
      pepSources: [],
      sanctionsSources: [],
      adverseMediaSources: []
    },
    lastChecked: '2024-01-15T10:30:00Z'
  }
}

export class ScreeningClient {
  static async screenPerson(fullName: string, dateOfBirth?: string): Promise<ScreeningResult> {
    const key = fullName.toLowerCase().replace(/\s+/g, '_')
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return mockResponses[key] || mockResponses.default
  }

  static async screenEntity(entityName: string): Promise<ScreeningResult> {
    return this.screenPerson(entityName)
  }
}

// Helper function to screen an entity by ID and save results to database
export async function screenEntity(entityId: string): Promise<void> {
  const { prisma } = await import('../prisma')
  
  // Get entity details
  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    select: {
      id: true,
      fullName: true,
      legalName: true,
      dob: true,
      kind: true
    }
  })
  
  if (!entity) {
    throw new Error(`Entity ${entityId} not found`)
  }
  
  // Determine name to use for screening
  const screeningName = entity.fullName || entity.legalName || 'Unknown'
  
  // Run screening
  const result = await ScreeningClient.screenEntity(screeningName)
  
  // Save screening result to database
  await prisma.screening.create({
    data: {
      entityId: entityId,
      pep: result.pep,
      sanctions: result.sanctions,
      adverseMedia: result.adverseMedia,
      resultJson: JSON.stringify({
        riskScore: result.riskScore,
        details: result.details,
        screeningName,
        lastChecked: result.lastChecked
      })
    }
  })
  
  console.log(`✅ Entity ${screeningName} screened successfully (Risk: ${result.riskScore})`)
}