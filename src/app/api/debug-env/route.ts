import { NextResponse } from 'next/server'

export async function GET() {
  // Get all env vars that start with DATABASE or RAILWAY or POSTGRES
  const relevantEnvVars = Object.keys(process.env)
    .filter(key => 
      key.includes('DATABASE') || 
      key.includes('RAILWAY') || 
      key.includes('POSTGRES') ||
      key === 'NODE_ENV'
    )
    .reduce((acc, key) => {
      acc[key] = process.env[key] ? 
        (key.includes('DATABASE') || key.includes('PRIVATE') ? 
          `[HIDDEN - ${process.env[key].length} chars]` : 
          process.env[key]
        ) : 'undefined'
      return acc
    }, {} as Record<string, string>)

  // Check if we can read the prisma schema
  let schemaInfo = {}
  try {
    const fs = require('fs')
    const path = require('path')
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
    const schemaExists = fs.existsSync(schemaPath)
    schemaInfo = { 
      schemaExists,
      schemaPath,
      cwd: process.cwd()
    }
  } catch (e) {
    schemaInfo = { error: 'Could not check schema file' }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
      DATABASE_URL_starts_with: process.env.DATABASE_URL?.substring(0, 20) || 'empty',
    },
    relevantEnvVars,
    schemaInfo,
    processInfo: {
      cwd: process.cwd(),
      version: process.version,
    }
  })
}