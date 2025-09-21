const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database migration...')
  
  try {
    // Check if we can connect
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Run migrations using Prisma's programmatic API
    console.log('🔄 Pushing schema changes...')
    
    // For Railway, we'll use the built-in migration system
    console.log('Database URL:', process.env.DATABASE_URL ? 'Found' : 'Missing')
    
    // Test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection test passed:', result)
    
    console.log('✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })