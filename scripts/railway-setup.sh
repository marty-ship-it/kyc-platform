#!/bin/bash
# Railway initial setup script

echo "🚅 Setting up Railway deployment..."

# Copy PostgreSQL schema
echo "📋 Copying PostgreSQL schema..."
cp prisma/schema-render.prisma prisma/schema.prisma

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Creating database schema..."
npx prisma db push

# Seed database
echo "🌱 Seeding database with demo data..."
npx tsx prisma/seed.ts

echo "✅ Railway setup complete!"