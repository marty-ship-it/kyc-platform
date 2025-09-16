#!/bin/bash
# Post-deployment script for Render

echo "Starting post-deployment setup..."

# Copy PostgreSQL schema
echo "Copying PostgreSQL schema..."
cp prisma/schema-render.prisma prisma/schema.prisma

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push database schema
echo "Pushing database schema..."
npx prisma db push --skip-seed

# Seed database
echo "Seeding database..."
npx tsx prisma/seed.ts

echo "Post-deployment setup complete!"