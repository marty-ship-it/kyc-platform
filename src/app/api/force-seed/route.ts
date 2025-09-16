import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

// Force seed endpoint - no checks
export async function GET() {
  try {
    console.log('Force seeding database...')
    
    // Create organisation first
    const org = await prisma.organisation.upsert({
      where: { abn: '12 345 678 901' },
      update: {},
      create: {
        name: 'Coastal Realty Pty Ltd',
        abn: '12 345 678 901',
        timezone: 'Australia/Sydney'
      }
    })

    // Create users
    await prisma.user.upsert({
      where: { email: 'luca@coastalrealty.com' },
      update: {},
      create: {
        name: 'Luca Romano',
        email: 'luca@coastalrealty.com',
        role: 'AGENT',
        passwordHash: await bcrypt.hash('Password123!', 10)
      }
    })

    // Create entities
    const james = await prisma.entity.upsert({
      where: { id: 'force-james-id' },
      update: {},
      create: {
        id: 'force-james-id',
        orgId: org.id,
        kind: 'INDIVIDUAL',
        fullName: 'James Chen',
        country: 'Australia',
        riskScore: 'MEDIUM',
        riskRationale: 'Medium risk due to offshore investment fund involvement'
      }
    })

    const entityCount = await prisma.entity.count()
    
    return NextResponse.json({ 
      success: true,
      message: `Database seeded! Found ${entityCount} entities`,
      orgId: org.id,
      jamesId: james.id
    })
  } catch (error) {
    console.error('Force seed error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name
    })
  }
}