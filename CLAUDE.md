# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is Kycira, an **entity-centric** AML/CTF compliance platform for Australian real estate agencies. The architecture centers around **entities** (individuals and organizations) rather than deals, with automated screening, case management, and KYC re-use intelligence.

Key domain concepts:
- **Entities**: Central data model representing individuals or organizations with risk profiles
- **Cases**: Compliance investigations triggered by risk signals (THRESHOLD, RISK_ESCALATION, ADVERSE_MEDIA, MANUAL)
- **KYC Re-use**: Time-based validation (90-day window) allowing verification reuse across deals
- **Auto-screening**: Automated PEP/sanctions/adverse media checks on entity creation/updates
- **RBAC**: Three roles with different permissions (DIRECTOR, COMPLIANCE, AGENT)

## Development Commands

### Setup and Database
```bash
npm install                    # Install dependencies
npm run db:reset              # Reset SQLite database and seed demo data
npm run dev                   # Start dev server on port 4287
```

### Production Build
```bash
npm run build                 # Build with Prisma generation (uses schema.prisma)
npm run build:prod            # Production build (copies schema-render.prisma for PostgreSQL)
npm run build:render          # Render.com build (includes db push + seed)
npm start                     # Start production server on PORT env var (default 3000)
```

### Code Quality
```bash
npm run lint                  # ESLint
npm run typecheck             # TypeScript checks
npm run test:e2e              # Playwright E2E tests
npm run test:e2e:ui           # Playwright UI mode
```

### Database Operations
```bash
npx prisma studio             # Open Prisma Studio
npx prisma db push            # Push schema changes (no migrations)
npx prisma generate           # Generate Prisma Client
npx tsx prisma/seed.ts        # Run seed script manually
```

## Architecture

### Database Schema Strategy

**Two schemas for different environments:**
- `prisma/schema.prisma` - SQLite for local development
- `prisma/schema-render.prisma` - PostgreSQL for production (Railway/Render)

**Production build process** (see Dockerfile.railway:20-24):
```dockerfile
RUN cp prisma/schema-render.prisma prisma/schema.prisma
RUN npx prisma generate && npm run build
```

This allows local SQLite development with seamless PostgreSQL deployment.

### Entity-Centric Data Model

The **Entity** model is the hub connecting all compliance activities:

```
Entity (individual/organization)
  ├── riskScore: LOW | MEDIUM | HIGH
  ├── masterNotes: JSON array of timestamped notes
  ├── aliases: JSON array for AKA tracking
  ├── Relations:
  │   ├── cases (compliance investigations)
  │   ├── kycs (verification history across all deals)
  │   ├── screenings (PEP/sanctions checks)
  │   ├── transactions (financial movements)
  │   ├── deals (many-to-many via entities relation)
  │   └── parties (deal participations)
```

**Key difference from deal-centric**: KYC checks and screenings are linked to entities (via `entityId`) *in addition to* parties, enabling cross-deal intelligence.

### Authentication Architecture

**NextAuth.js with JWT** (stateless):
- `src/lib/auth.ts` - Hardcoded demo users (no database lookup)
- Credentials provider with bcrypt for production user checks
- Role injected into JWT token via callbacks
- Session strategy: JWT (no database session table)
- NEXTAUTH_SECRET and NEXTAUTH_URL configured via env vars

**Demo users:**
- sarah@coastalrealty.com (DIRECTOR)
- priya@coastalrealty.com (COMPLIANCE)
- luca@coastalrealty.com (AGENT)
- Password: `Password123!`

### RBAC System

**Permission-based access control** (`src/lib/rbac.ts`):

```typescript
RBACService.hasPermission(userRole, action, resource)
RBACService.canManageCases(userRole)
RBACService.canSubmitReports(userRole)
```

**Key permissions:**
- AGENT: Read-only + entity screening
- COMPLIANCE: Case management + report generation + automation config
- DIRECTOR: Full access including admin panel

**Route protection:**
Use `canAccessRoute(route, userRole)` in server components or `RoleGuard` component in client components.

### Auto-Screening Service

**Automation triggers** (`src/lib/automation.ts`):

```typescript
AutomationService.processEntityTrigger({
  entityId,
  triggerType: 'CREATE' | 'UPDATE' | 'BATCH',
  userId,
  changes: ['fullName', 'dob', 'country'] // for UPDATE triggers
})
```

**Workflow:**
1. Entity created/updated → automation triggered
2. Calls `screeningClient.ts` (mock PEP/sanctions API)
3. If risk detected → auto-creates Case with reason: RISK_ESCALATION
4. Creates audit event (AUTO_SCREEN_TRIGGERED or AUTO_SCREEN_FAILED)

**Settings** (in-memory, configurable via admin):
- `autoScreenOnEntityCreate: boolean`
- `autoScreenOnEntityUpdate: boolean`
- `batchScreenTime: string | null` (cron schedule)

### KYC Re-use Intelligence

**Service** (`src/lib/services/kyc-reuse.ts`):

```typescript
const status = await KycReuseService.getKycStatus(entityId, currentDealId)

// Returns:
{
  hasValidKyc: boolean,
  daysAgo: number,
  canReuse: boolean,        // <= 90 days
  refreshRequired: boolean, // > 365 days
  kycSource: 'current_deal' | 'previous_deal' | 'entity_profile'
}
```

**Risk-based refresh windows:**
- HIGH risk: 60 days
- MEDIUM risk: 180 days
- LOW risk: 365 days

**Implementation**: Searches entity's parties across all deals, finds most recent PASS KYC check, calculates age.

### Case Management

**Case lifecycle** (enum CaseStatus):
```
OPEN → UNDER_REVIEW → SUBMITTED → CLOSED
```

**Case reasons** (enum CaseReason):
- THRESHOLD - Transaction amount threshold exceeded
- RISK_ESCALATION - Auto-screening detected risk
- ADVERSE_MEDIA - Negative news findings
- MANUAL - Compliance officer discretion

**Signals** (JSON field):
```json
[
  { "type": "OVERSEAS_ACCOUNT" },
  { "type": "AMOUNT_THRESHOLD", "value": 20000 }
]
```

**Notes** (JSON timeline):
```json
[
  {
    "by": "Priya Sharma",
    "at": "2024-09-22T10:30:00Z",
    "text": "Additional due diligence completed"
  }
]
```

### Production Deployment (Railway)

**Container build** (railway.json → Dockerfile.railway):
1. Stage 1 (deps): `npm ci` + copy Prisma schema
2. Stage 2 (builder): `cp schema-render.prisma schema.prisma` → `prisma generate` → `npm run build`
3. Stage 3 (runner): Production image with `nextjs` user

**Database initialization:**
- Railway provides `DATABASE_URL` env var (PostgreSQL connection string)
- First request to `/api/setup-db` seeds demo data (production-only endpoint)
- Health check: `/api/db-test`

**Environment variables:**
- `DATABASE_URL` - PostgreSQL connection (Railway-injected)
- `NEXTAUTH_SECRET` - JWT signing key
- `NEXTAUTH_URL` - App base URL
- `NODE_ENV=production`
- `PORT=3000`

**Key files:**
- `railway.json` - Platform config (builder: DOCKERFILE, restart policy)
- `Dockerfile.railway` - Multi-stage build with PostgreSQL schema
- `next.config.ts` - `output: 'standalone'` for containerization

### API Route Patterns

**Production-only initialization endpoints:**
- `/api/setup-db` - Creates demo data if database empty (production-only guard)
- `/api/db-test` - Health check with connection test
- `/api/railway-setup` - Setup instructions
- `/api/debug-env` - Environment diagnostics

**Server Actions vs API Routes:**
- Use Server Actions (async functions in Server Components) for mutations
- Use API Routes for external integrations, webhooks, initialization
- RBAC checks required in both patterns

### Transaction Handling

**Transaction types:**
- DEPOSIT - Incoming payment
- BALANCE - Settlement payment
- RENTAL - Rental income
- INTERNAL_TRANSFER - Company-to-company (flagged separately)

**Risk flags:**
- `isCrossBorder: boolean` - International transfer
- `isStructured: boolean` - Potential structuring
- `overseasAccount: boolean` - Offshore source
- `flagged: boolean` - Manual review flag

**Subtype** (enum TransactionSubtype):
- PROPERTY_DEPOSIT, BALANCE_PAYMENT, COMMISSION, LEGAL_FEES, etc.

### PDF Generation

**AUSTRAC reports** (`src/lib/services/pdf.ts`):
- Uses `pdf-lib` for PDF generation
- Report types: TTR (Threshold Transaction Report), SMR (Suspicious Matter Report), ANNUAL
- Generated from case context with entity + transaction data

### Mock Integrations

**External services** (src/lib/services/):
- `dvsClient.ts` - Document Verification Service (mock)
- `screeningClient.ts` - PEP/Sanctions/Adverse Media (mock with risk logic)
- `bankFeed.ts` - Transaction import (mock)
- `storage.ts` - File storage (mock S3-style)

All return realistic mock data for demonstration purposes.

## Important Conventions

### Schema Changes

When modifying `prisma/schema.prisma`:
1. Also update `prisma/schema-render.prisma` (replace provider with PostgreSQL, adjust field types)
2. Update seed script `prisma/seed.ts` to include new fields
3. Run `npm run db:reset` locally to test
4. Update production seed endpoint `/api/setup-db/route.ts`

### JSON Fields

Several models use JSON for flexibility (SQLite compatibility):
- Entity.aliases - `string[]`
- Entity.masterNotes - `Array<{id, byUserId, text, createdAt}>`
- Case.signals - `Array<{type, value?}>`
- Case.notes - `Array<{by, at, text}>`

**Pattern**: Store as JSON, parse with `JSON.parse()`, validate with Zod schemas.

### Audit Events

**Always create audit events** for compliance actions:
```typescript
await prisma.auditEvent.create({
  data: {
    orgId: entity.orgId,
    userId: session.user.id,
    entityType: 'Entity',
    entityId: entity.id,
    action: 'ENTITY_SCREENED',
    payloadJson: JSON.stringify({ /* context */ })
  }
})
```

### Server Components

This is a **Next.js App Router** project - components are Server Components by default:
- Use `'use client'` only when needed (forms, interactive UI)
- Fetch data directly in Server Components (no need for getServerSideProps)
- Pass data to Client Components via props (serialize carefully)

## Testing

No comprehensive test suite exists yet. When adding tests:
- Use Playwright for E2E (`tests/` directory exists)
- Consider Vitest for unit tests (services in `src/lib/services/`)
- Mock Prisma client for database tests
- Test RBAC scenarios with different user roles

## Common Tasks

### Adding a new role permission

1. Add permission to `PERMISSIONS` in `src/lib/rbac.ts`
2. Add to appropriate role in `ROLE_PERMISSIONS`
3. Update `ROUTE_ACCESS` if route-level protection needed
4. Update UI components with `RoleGuard` wrapper

### Adding a new case reason

1. Add to `CaseReason` enum in `prisma/schema.prisma` and `schema-render.prisma`
2. Run `npx prisma generate`
3. Update case creation logic in automation or API routes
4. Update UI case filters/badges

### Deploying to Railway

1. Connect GitHub repo to Railway project
2. Add PostgreSQL database service (auto-creates DATABASE_URL)
3. Set environment variables (NEXTAUTH_SECRET, NEXTAUTH_URL)
4. Railway auto-deploys on git push to main
5. Visit `/api/setup-db` on first deploy to seed data

### Debugging production issues

Railway-specific debug endpoints:
- `/api/debug-env` - Shows env var presence/length
- `/api/db-test` - Tests database connection
- Check Railway logs for Prisma connection errors
- Verify schema.prisma matches schema-render.prisma in production build
