import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    instructions: [
      "Railway Database Setup Instructions:",
      "",
      "1. Go to https://railway.app/dashboard",
      "2. Click on your 'kyc-platform' project",
      "3. Click the '+ New' button",
      "4. Select 'Database' → 'Add PostgreSQL'",
      "5. This will automatically create a DATABASE_URL variable",
      "6. Your app will redeploy automatically",
      "7. Then visit /api/db-test to verify connection",
      "",
      "Alternative: Manual DATABASE_URL setup:",
      "1. In your project, click on your web service",
      "2. Go to 'Variables' tab",
      "3. Add variable: DATABASE_URL = postgresql://user:pass@host:port/db",
      "",
      "After setup, visit these endpoints in order:",
      "- /api/db-test (test connection)",
      "- /api/simple-seed (create test data)",
      "- /api/setup-db (full demo data)"
    ]
  })
}