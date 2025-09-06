# AML/CTF Compliance Platform

A comprehensive demo web application showcasing how an SMB real estate agency can achieve AML/CTF compliance for high-value property sales in Australia.

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: Prisma + SQLite (file-based for easy setup)
- **Authentication**: NextAuth with credential provider
- **UI**: shadcn/ui components with TailwindCSS
- **PDF Generation**: pdf-lib for AUSTRAC reporting
- **Mock Integrations**: DVS, PEP/Sanctions screening, bank feeds

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

The application will be available at `http://localhost:3001`

## 👥 Demo Users

The system comes pre-seeded with three user accounts representing different roles:

| Role | Name | Email | Password |
|------|------|-------|----------|
| **Director** | Sarah Mitchell | sarah@coastalrealty.com | Password123! |
| **Agent** | Luca Romano | luca@coastalrealty.com | Password123! |
| **Compliance Officer** | Priya Sharma | priya@coastalrealty.com | Password123! |

## 🎯 Demo Script: $1.2M Property Sale

Follow this walkthrough to see the complete AML/CTF compliance process:

### Step 1: Login as Agent (Luca)
1. Navigate to `http://localhost:3001`
2. Login with: `luca@coastalrealty.com` / `Password123!`
3. View the dashboard showing compliance overview

### Step 2: Access the Demo Deal
1. Click "Deals" in the navigation
2. Find "12 Seaview Rd, Bondi NSW - $1,200,000"
3. Click "View" to open the deal workspace
4. Notice the deal tabs: Overview, Parties, KYC, Screening, Risk, Transactions, Reports

### Step 3: Complete KYC Process
1. Click the "KYC" tab
2. View buyer information (James Chen)
3. Click "Run KYC Check" 
4. Mock DVS verification will show PASS status
5. Upload mock documents (passport, proof of address)
6. Toggle liveness check to "Pass"

### Step 4: Run Screening
1. Click the "Screening" tab
2. Click "Run Screening" for James Chen
3. Review results showing:
   - PEP: No
   - Sanctions: No
   - Adverse Media: Yes (Medium risk - offshore investment fund)

### Step 5: Risk Assessment
1. Click "Risk" tab
2. Complete the risk questionnaire:
   - Transaction amount: $1.2M
   - Source of funds: Investment proceeds
   - Customer risk: Medium (due to adverse media)
3. System calculates overall risk score: MEDIUM
4. Add rationale notes

### Step 6: Transaction Monitoring
1. Click "Transactions" tab
2. Click "Ingest Bank Feed"
3. System imports mock transactions including $1.2M deposit
4. Notice threshold alert (>$10K) triggered
5. Review transaction details and counterparties

### Step 7: Generate Reports
1. Click "Reports" tab
2. Notice TTR (Threshold Transaction Report) required
3. Click "Generate AUSTRAC Pack"
4. Complete TTR wizard with transaction details
5. Generate PDF report with JSON appendix

### Step 8: Switch to Compliance Officer (Priya)
1. Logout and login as: `priya@coastalrealty.com` / `Password123!`
2. Navigate back to the deal
3. Review and approve the TTR report
4. Mark deal as compliance complete

### Step 9: Director Overview (Sarah)
1. Logout and login as: `sarah@coastalrealty.com` / `Password123!`
2. View dashboard compliance summary
3. Check training status and policy compliance
4. Review audit logs and system health

## 📋 Key Features Demonstrated

### Compliance Workflow
- ✅ Customer Due Diligence (CDD) with document verification
- ✅ PEP, sanctions, and adverse media screening
- ✅ Risk assessment and scoring
- ✅ Transaction monitoring and threshold detection
- ✅ Automated reporting (TTR/SMR)
- ✅ Evidence collection and retention
- ✅ Audit trail and logging

### Role-Based Access
- **Agents**: Create deals, onboard clients, collect documents
- **Compliance Officers**: Review flags, approve reports, manage policies
- **Directors**: Oversight dashboard, approve final reports, manage staff

### Regulatory Features
- **AUSTRAC Compliance**: TTR generation for transactions >$10K
- **7-Year Retention**: All evidence tagged for retention
- **DVS Integration**: Document verification service
- **Real-time Monitoring**: Transaction screening and alerts

## 🗂️ Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── login/             # Authentication
│   │   ├── deals/             # Deal management
│   │   └── api/auth/          # NextAuth API routes
│   ├── components/            # Reusable UI components
│   │   ├── auth/              # Authentication components
│   │   ├── layout/            # Navigation and layout
│   │   └── ui/                # shadcn/ui components
│   └── lib/
│       ├── services/          # Mock service integrations
│       │   ├── dvsClient.ts   # Document verification
│       │   ├── screeningClient.ts # PEP/sanctions screening
│       │   ├── bankFeed.ts    # Transaction import
│       │   ├── pdf.ts         # Report generation
│       │   └── storage.ts     # Evidence storage
│       └── auth.ts            # NextAuth configuration
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Demo data seeding
├── fixtures/                  # Mock integration data
│   ├── dvs.json              # DVS responses
│   ├── screening.json        # Screening results
│   └── bank.csv              # Bank transactions
└── evidence/                 # Evidence file storage
```

## 🔄 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run db:reset     # Reset database and reseed
npm run test:e2e     # Run end-to-end tests
npm run test:e2e:ui  # Run tests with Playwright UI
```

## ⚠️ Important Disclaimers

- **Demo Only**: This is a demonstration system with mock integrations
- **Not Production Ready**: Not suitable for real compliance operations
- **Local Data**: All data stored locally in SQLite database
- **Mock Services**: DVS, screening, and bank feeds are simulated
- **Australian Focus**: Designed for Australian AML/CTF regulations

## 🔧 Mock Integrations

All external services are mocked using local fixtures:

- **DVS**: Returns PASS for passport "123456789"
- **Screening**: Shows medium risk for "James Chen" due to offshore funds
- **Bank Feed**: Imports $1.2M transaction from fixtures/bank.csv
- **Storage**: Saves files locally in /evidence directory

## 📊 Compliance Dashboard Features

- Real-time compliance score calculation
- Active deal tracking and alerts
- Staff training management
- Policy document versioning
- System health monitoring
- Audit event logging

## 🎓 Training Module

- AML/CTF basics course
- KYC procedures training
- AUSTRAC reporting requirements
- Staff completion tracking
- Certification management

---

**Coastal Realty Pty Ltd Demo** - Showcasing modern AML/CTF compliance for Australian real estate