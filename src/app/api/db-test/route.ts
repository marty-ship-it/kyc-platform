import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Testing database connection...')
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0)
    
    // Force rebuild - timestamp: ${Date.now()}
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('Database connection successful')
    
    // Check if tables exist
    const orgCount = await prisma.organisation.count()
    const userCount = await prisma.user.count()
    const entityCount = await prisma.entity.count()
    
    console.log(`Found: ${orgCount} orgs, ${userCount} users, ${entityCount} entities`)
    
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
      counts: {
        organisations: orgCount,
        users: userCount,
        entities: entityCount
      },
      database_url_exists: !!process.env.DATABASE_URL,
      node_env: process.env.NODE_ENV
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name,
      database_url_exists: !!process.env.DATABASE_URL,
      database_url_length: process.env.DATABASE_URL?.length || 0,
      node_env: process.env.NODE_ENV
    })
  }
}