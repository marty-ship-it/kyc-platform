# Deploying KYC Platform to Render.com

This guide explains how to deploy the KYC Platform to Render.com with PostgreSQL database support.

## Prerequisites

1. A Render.com account
2. GitHub repository with the KYC Platform code
3. This repository should be connected to your GitHub account

## Deployment Steps

### 1. Connect Repository to Render

1. Log into your Render.com dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file

### 2. Database Setup

The `render.yaml` file will automatically create:
- A PostgreSQL database named `kyc-platform-db`
- Database user `kyc_user`
- Environment variable `DATABASE_URL` pointing to the database

### 3. Environment Variables

The following environment variables will be automatically set:
- `NODE_ENV=production`
- `NEXTAUTH_SECRET` (auto-generated)
- `NEXTAUTH_URL=https://kyc-platform.onrender.com`
- `DATABASE_URL` (from the database)

### 4. Build Process

The build process will:
1. Install dependencies with `npm install`
2. Copy PostgreSQL schema: `cp prisma/schema-render.prisma prisma/schema.prisma`
3. Generate Prisma client: `prisma generate`
4. Push database schema: `prisma db push`
5. Seed database: `npm run db:seed:render`
6. Build Next.js app: `next build`

### 5. Deployment

1. Click "Create Blueprint" in Render
2. Wait for the build to complete (5-10 minutes)
3. Your app will be available at `https://kyc-platform.onrender.com`

## Database Schema

The app uses a PostgreSQL-compatible schema located in `prisma/schema-render.prisma`. Key differences from the SQLite version:
- Uses `postgresql` provider instead of `sqlite`
- Supports JSON fields natively
- Better performance for production workloads

## Post-Deployment

After successful deployment:

1. **Test Login**: Visit the app and test the login functionality
2. **Verify Database**: Check that entities, cases, and other data are properly seeded
3. **Test Full Workflow**: Navigate through entities → cases → details to ensure everything works

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify PostgreSQL schema is valid

### Database Connection Issues
- Check that `DATABASE_URL` environment variable is set
- Verify PostgreSQL service is running
- Check database logs in Render dashboard

### App Crashes on Startup
- Check application logs
- Verify all required environment variables are set
- Ensure database is accessible and seeded

## Local Development vs Production

- **Local**: Uses SQLite database with `prisma/schema.prisma`
- **Render**: Uses PostgreSQL database with `prisma/schema-render.prisma`
- **Vercel**: Uses mock data (SQLite not supported in serverless)

The app automatically detects the environment and uses the appropriate data source.

## Cost Considerations

Render.com pricing:
- **Web Service**: Free tier available (sleeps after 15min of inactivity)
- **PostgreSQL**: Free tier with 1GB storage
- **Paid tiers**: Start at $7/month for web service, $7/month for database

For production use, consider paid tiers for better performance and uptime.