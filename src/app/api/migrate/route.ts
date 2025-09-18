import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  // Only allow in production
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ error: 'Only available in production' }, { status: 403 })
  }

  try {
    console.log('Running Prisma migrations...')
    
    // Run prisma db push to create tables
    const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate')
    
    console.log('Migration output:', stdout)
    if (stderr) console.error('Migration stderr:', stderr)
    
    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
      output: stdout
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}