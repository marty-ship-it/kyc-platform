# Kycira AML/CTF Compliance Platform

A comprehensive entity-centric AML/CTF compliance platform showcasing modern KYC management, automated screening, and case management for Australian real estate agencies.

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: Prisma + SQLite (file-based for easy setup)
- **Authentication**: NextAuth with credential provider
- **UI**: shadcn/ui components with TailwindCSS
- **PDF Generation**: pdf-lib for AUSTRAC reporting
- **Mock Integrations**: DVS, PEP/Sanctions screening, automation services

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Set up database and seed demo data
npm run db:reset

# 3. Start the development server
npm run dev
```

The application will be available at `http://localhost:4287`

## 👥 Demo Users

The system comes pre-seeded with three user accounts representing different roles:

| Role | Name | Email | Password | Access Level |
|------|------|-------|----------|-------------|
| **Director** | Sarah Mitchell | sarah@coastalrealty.com | Password123! | Full system access |
| **Compliance** | Priya Sharma | priya@coastalrealty.com | Password123! | Case management & reporting |
| **Agent** | Luca Romano | luca@coastalrealty.com | Password123! | Entity screening & basic operations |

## 🎯 Demo Script: Entity-Centric Compliance

Follow this walkthrough to see the complete entity-centric compliance process:

### Step 1: Login as Agent (Luca)
1. Navigate to `http://localhost:4287`
2. Login with: `luca@coastalrealty.com` / `Password123!`
3. View the dashboard showing entity and case overview

### Step 2: Explore Entity Management
1. Click "Entities" in the navigation
2. View the entity list showing individuals and organizations
3. Notice James Chen has a MEDIUM risk score with adverse media findings
4. Click "View" to open the entity workspace
5. Explore tabs: Overview, Cases, KYC History, Transactions, Audit Trail

### Step 3: Review Auto-Screening
1. In James Chen's entity profile, check the screening history
2. Notice auto-screening triggered when entity was created
3. Review adverse media findings from offshore investment fund connections
4. See how the system automatically created a RISK_ESCALATION case

### Step 4: Case Management Workflow
1. Click "Cases" in navigation
2. View active compliance cases with reasons (THRESHOLD, RISK_ESCALATION, ADVERSE_MEDIA, MANUAL)
3. Open the case for James Chen (RISK_ESCALATION)
4. Review the case timeline with notes from compliance team
5. Notice linked reports and entity information

### Step 5: KYC Re-use Functionality
1. Go to "Deals" and view the $1.2M property transaction
2. Notice KYC reuse banners showing existing verification status
3. System shows James Chen's KYC is current and can be reused
4. View how time-based validation prevents outdated KYC reuse

### Step 6: Transaction Analysis
1. In the deal or entity view, check transactions
2. See INTERNAL_TRANSFER badges for company-to-company transfers
3. Review cross-border and structured transaction flags
4. Notice automatic threshold detection for large transactions

### Step 7: Switch to Compliance Officer (Priya)
1. Logout and login as: `priya@coastalrealty.com` / `Password123!`
2. Access case management with enhanced permissions
3. Review and progress case statuses: OPEN → UNDER_REVIEW → SUBMITTED → CLOSED
4. Add compliance notes and link reports to cases
5. Generate TTR reports directly from case workflow

### Step 8: Director Overview (Sarah)
1. Logout and login as: `sarah@coastalrealty.com` / `Password123!`
2. Access admin panel with system configuration
3. Configure auto-screening automation settings
4. Review KYC refresh requirements dashboard
5. Monitor system health and user activity
6. Access comprehensive audit trails

## 🌟 Key Features

### Entity-Centric Architecture
- ✅ Unified entity profiles for individuals and organizations
- ✅ Entity risk scoring with rationale tracking
- ✅ Cross-deal entity relationship mapping
- ✅ Comprehensive entity audit trails

### Case Management System
- ✅ Automated case creation based on risk triggers
- ✅ Case reasons: THRESHOLD, RISK_ESCALATION, ADVERSE_MEDIA, MANUAL
- ✅ Timeline-based case notes and documentation
- ✅ Case-linked report generation
- ✅ Status progression workflow (OPEN → UNDER_REVIEW → SUBMITTED → CLOSED)

### Automation & Screening
- ✅ Auto-screening on entity creation and updates
- ✅ Configurable automation triggers and settings
- ✅ Risk-based KYC refresh requirements
- ✅ Threshold-based case escalation

### KYC Re-use Intelligence
- ✅ Time-based KYC validity checking (90-day reuse window)
- ✅ Risk-adjusted refresh requirements
- ✅ Cross-deal KYC status tracking
- ✅ Compliance banners showing reuse eligibility

### Advanced Transaction Handling
- ✅ Internal transfer detection and labeling
- ✅ Cross-border transaction flagging
- ✅ Structured transaction identification
- ✅ Enhanced transaction type support (RENTAL, INTERNAL_TRANSFER)

### Role-Based Access Control (RBAC)
- ✅ Granular permission system
- ✅ Role-based UI component rendering
- ✅ Secure API endpoint protection
- ✅ Feature-level access controls

### Enhanced Reporting & Audit
- ✅ Case-linked report generation
- ✅ Comprehensive audit event tracking
- ✅ Export capabilities for compliance reviews
- ✅ Multi-level audit trail visibility

## 🗂️ Project Structure

```
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── admin/               # Admin panel and settings
│   │   ├── entities/            # Entity-centric workspaces
│   │   ├── cases/               # Case management system
│   │   ├── deals/               # Deal management (legacy compatibility)
│   │   └── api/                 # API routes and integrations
│   ├── components/
│   │   ├── rbac/               # Role-based access components
│   │   ├── audit-trail.tsx     # Enhanced audit visualization
│   │   ├── kyc-reuse-banner.tsx # KYC reuse status display
│   │   └── ui/                 # UI component library
│   └── lib/
│       ├── services/           # Business logic services
│       │   ├── kyc-reuse.ts    # KYC reuse intelligence
│       │   ├── audit.ts        # Audit event management
│       │   └── screeningClient.ts # Enhanced screening
│       ├── automation.ts       # Auto-screening service
│       └── rbac.ts             # Role-based access control
├── prisma/
│   ├── schema.prisma          # Updated entity-centric schema
│   └── seed.ts                # Enhanced demo data
```

## 🔄 Available Scripts

```bash
npm run dev          # Start development server (port 4287)
npm run build        # Build for production with Prisma generation
npm run start        # Start production server (port 3001)
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run db:reset     # Reset database and reseed with new schema
npm run test:e2e     # Run end-to-end tests
npm run test:e2e:ui  # Run tests with Playwright UI
```

## 🧪 Testing

Basic unit tests are included for core services:

```bash
# Run RBAC tests (if Jest is configured)
npm test -- rbac.test.ts

# Run KYC reuse tests
npm test -- kyc-reuse.test.ts
```

## 📊 Role Permissions Matrix

| Permission | Agent | Compliance | Director |
|------------|-------|------------|----------|
| View Entities | ✅ | ✅ | ✅ |
| Create Entities | ❌ | ✅ | ✅ |
| Screen Entities | ✅ | ✅ | ✅ |
| View Cases | ✅ | ✅ | ✅ |
| Create Cases | ❌ | ✅ | ✅ |
| Manage Cases | ❌ | ✅ | ✅ |
| Generate Reports | ❌ | ✅ | ✅ |
| Submit Reports | ❌ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| Automation Config | ❌ | ✅ | ✅ |

## 🔧 Configuration

### Auto-screening Settings
Configure in Admin Panel:
- **Auto-screen on Entity Creation**: Automatically screen new entities
- **Auto-screen on Entity Updates**: Re-screen when key attributes change
- **Batch Screening**: Manual trigger for bulk entity screening

### KYC Refresh Windows
- **Valid Reuse Period**: 90 days (configurable)
- **Review Recommended**: 365 days
- **Risk-based Refresh**: 
  - HIGH risk: 60 days
  - MEDIUM risk: 180 days  
  - LOW risk: 365 days

## 🏃‍♂️ Migration Guide

This version implements significant architectural changes:

### Database Schema Updates
- Entity model enhanced with new fields (fullName, legalName, riskScore, etc.)
- Case model updated with reason enum and timeline notes
- Transaction types expanded (RENTAL, INTERNAL_TRANSFER)
- New audit event types for automation

### Breaking Changes
- Entity `name` field split into `fullName`/`legalName`
- Case `priority` replaced with `reason` enum
- Case `assignedTo` replaced with `createdBy`
- New RBAC permission requirements

## ⚠️ Important Notes

- **Demo Platform**: Mock integrations for demonstration purposes
- **Local Development**: SQLite database for easy setup
- **Australian Compliance**: Focused on AUSTRAC requirements
- **Entity-Centric**: Complete architectural shift from deal-centric model

## 🆕 Recent Updates (MVP v2)

- ✅ Entity-centric architecture implementation
- ✅ Advanced case management with timeline notes
- ✅ Auto-screening automation service
- ✅ KYC re-use intelligence system
- ✅ Enhanced transaction categorization
- ✅ Role-based access control (RBAC)
- ✅ Comprehensive audit trail enhancements
- ✅ Admin panel for system configuration

---

**Kycira Platform** - Modern entity-centric AML/CTF compliance for Australian financial services