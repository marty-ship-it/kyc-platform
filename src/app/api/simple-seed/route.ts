import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Only allow in production
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: 'Only available in production' })
    }

    console.log('Starting simple seed...')
    
    // Check connection first
    await prisma.$queryRaw`SELECT 1`
    
    // Check existing data
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      return NextResponse.json({ 
        message: 'Database already has data',
        userCount 
      })
    }
    
    // Create just one user and entity to test
    const org = await prisma.organisation.create({
      data: {
        name: 'Test Org',
        abn: '123',
        timezone: 'UTC'
      }
    })
    
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'AGENT',
        passwordHash: 'temp'
      }
    })
    
    const entity = await prisma.entity.create({
      data: {
        orgId: org.id,
        kind: 'INDIVIDUAL',
        fullName: 'Test Entity',
        country: 'Australia',
        riskScore: 'LOW'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Simple seed completed',
      created: {
        orgId: org.id,
        userId: user.id,
        entityId: entity.id
      }
    })
    
  } catch (error) {
    console.error('Simple seed error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}