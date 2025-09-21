import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.auditEvent.deleteMany()
  await prisma.trainingRecord.deleteMany()
  await prisma.evidenceFile.deleteMany()
  await prisma.report.deleteMany()
  await prisma.case.deleteMany()
  await prisma.riskAssessment.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.screening.deleteMany()
  await prisma.kycCheck.deleteMany()
  await prisma.party.deleteMany()
  await prisma.deal.deleteMany()
  await prisma.entity.deleteMany()
  await prisma.policyDocument.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organisation.deleteMany()

  // Create organisation
  const org = await prisma.organisation.create({
    data: {
      name: 'Coastal Realty Pty Ltd',
      abn: '12 345 678 901',
      timezone: 'Australia/Sydney'
    }
  })

  // Create users with hashed passwords
  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Mitchell',
      email: 'sarah@coastalrealty.com',
      role: 'DIRECTOR',
      passwordHash: await bcrypt.hash('Password123!', 10)
    }
  })

  const luca = await prisma.user.create({
    data: {
      name: 'Luca Romano',
      email: 'luca@coastalrealty.com',
      role: 'AGENT',
      passwordHash: await bcrypt.hash('Password123!', 10)
    }
  })

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@coastalrealty.com',
      role: 'COMPLIANCE',
      passwordHash: await bcrypt.hash('Password123!', 10)
    }
  })

  // Create entities
  const buyerEntity = await prisma.entity.create({
    data: {
      orgId: org.id,
      kind: 'INDIVIDUAL',
      fullName: 'James Chen',
      dob: new Date('1985-03-15'),
      country: 'Australia',
      riskScore: 'MEDIUM',
      riskRationale: 'Medium risk due to offshore investment fund involvement',
      aliases: JSON.stringify(["James Chen", "James Robert Chen Jr"]),
      masterNotes: JSON.stringify([
        { 
          id: "1", 
          byUserId: sarah.id, 
          text: "Longstanding client with overseas connections", 
          createdAt: new Date().toISOString() 
        }
      ])
    }
  })

  const sellerEntity = await prisma.entity.create({
    data: {
      orgId: org.id,
      kind: 'INDIVIDUAL', 
      fullName: 'Margaret Wilson',
      dob: new Date('1958-07-22'),
      country: 'Australia',
      riskScore: 'LOW',
      riskRationale: 'Standard domestic client with clean profile'
    }
  })

  // Add Oceanic Investments entity
  const corporateEntity = await prisma.entity.create({
    data: {
      orgId: org.id,
      kind: 'ORGANISATION',
      legalName: 'Oceanic Investments Pty Ltd',
      fullName: 'Oceanic Investments Pty Ltd',
      abnAcn: '123 456 789',
      country: 'Australia',
      riskScore: 'LOW',
      riskRationale: 'Established property investment company with clean compliance history'
    }
  })

  // Create a demo deal
  const deal = await prisma.deal.create({
    data: {
      address: '12 Seaview Rd, Bondi NSW',
      price: 1200000,
      status: 'ACTIVE',
      createdByUserId: luca.id,
      orgId: org.id
    }
  })

  // Create cases for each entity
  const buyerCase = await prisma.case.create({
    data: {
      orgId: org.id,
      entityId: buyerEntity.id,
      dealId: deal.id,
      reason: 'RISK_ESCALATION',
      status: 'UNDER_REVIEW',
      signals: JSON.stringify([
        { type: "OVERSEAS_ACCOUNT" },
        { type: "AMOUNT_THRESHOLD", value: 20000 }
      ]),
      notes: JSON.stringify([{
        by: 'Luca Romano',
        at: new Date('2024-01-16T09:30:00Z').toISOString(),
        text: 'Client showing medium risk indicators due to offshore investment fund connections. Requires additional due diligence.'
      }]),
      createdById: luca.id
    }
  })

  // Create buyer party with entity link
  const buyer = await prisma.party.create({
    data: {
      dealId: deal.id,
      entityId: buyerEntity.id,
      type: 'BUYER',
      fullName: 'James Chen',
      dob: new Date('1985-03-15'),
      country: 'Australia',
      docType: 'Australian Passport',
      docNumber: '123456789',
      pepFlag: false
    }
  })

  // Create seller party with entity link
  const seller = await prisma.party.create({
    data: {
      dealId: deal.id,
      entityId: sellerEntity.id,
      type: 'SELLER',
      fullName: 'Margaret Wilson',
      dob: new Date('1958-07-22'),
      country: 'Australia',
      docType: 'Australian Drivers Licence',
      docNumber: 'NSW12345',
      pepFlag: false
    }
  })

  // Create comprehensive transactions with new fields
  await prisma.transaction.createMany({
    data: [
      {
        dealId: deal.id,
        type: 'DEPOSIT',
        subtype: 'PROPERTY_DEPOSIT',
        amount: 120000,
        currency: 'AUD',
        direction: 'IN',
        counterparty: 'James Chen',
        method: 'BANK',
        purpose: 'Initial deposit for property purchase',
        isCrossBorder: false,
        isStructured: false,
        flagged: false,
        receivedAt: new Date('2024-01-15T10:30:00Z')
      },
      {
        dealId: deal.id,
        type: 'BALANCE',
        subtype: 'BALANCE_PAYMENT',
        amount: 1080000,
        currency: 'AUD',
        direction: 'IN',
        counterparty: 'James Chen',
        method: 'BANK',
        purpose: 'Balance payment for property settlement',
        isCrossBorder: false,
        isStructured: false,
        flagged: false,
        receivedAt: new Date('2024-02-28T14:15:00Z')
      },
      {
        dealId: deal.id,
        type: 'BALANCE',
        amount: 24000,
        currency: 'AUD',
        direction: 'OUT',
        counterparty: 'Coastal Realty Commission Account',
        method: 'BANK',
        purpose: 'Real estate agent commission (2%)',
        isCrossBorder: false,
        isStructured: false,
        flagged: false,
        receivedAt: new Date('2024-02-28T16:00:00Z')
      },
      {
        dealId: deal.id,
        type: 'INTERNAL_TRANSFER',
        amount: 5000,
        currency: 'AUD',
        direction: 'OUT',
        counterparty: 'Coastal Realty Operating Account',
        method: 'BANK',
        purpose: 'Transfer of excess funds for operational expenses',
        isCrossBorder: false,
        isStructured: false,
        isInternal: true,
        flagged: false,
        receivedAt: new Date('2024-02-25T11:00:00Z')
      }
    ]
  })

  // Create KYC checks for parties and entities
  await prisma.kycCheck.create({
    data: {
      partyId: buyer.id,
      entityId: buyerEntity.id,
      dvStatus: 'PASS',
      liveness: true,
      proofOfAddressUrl: '/evidence/buyer-proof-of-address.pdf',
      resultJson: JSON.stringify({
        documentVerified: true,
        identityConfirmed: true,
        addressVerified: true,
        pepCheck: false,
        sanctions: false
      })
    }
  })

  await prisma.kycCheck.create({
    data: {
      partyId: seller.id,
      entityId: sellerEntity.id,
      dvStatus: 'PASS',
      liveness: true,
      proofOfAddressUrl: '/evidence/seller-proof-of-address.pdf',
      resultJson: JSON.stringify({
        documentVerified: true,
        identityConfirmed: true,
        addressVerified: true,
        pepCheck: false,
        sanctions: false
      })
    }
  })

  // Create screening results
  await prisma.screening.create({
    data: {
      partyId: buyer.id,
      entityId: buyerEntity.id,
      pep: false,
      sanctions: false,
      adverseMedia: true,
      resultJson: JSON.stringify({
        pepMatches: [],
        sanctionMatches: [],
        adverseMediaMatches: [{
          source: 'Financial Review',
          headline: 'Offshore Investment Fund Links Investigated',
          date: '2024-01-10',
          severity: 'MEDIUM'
        }],
        riskScore: 'MEDIUM'
      })
    }
  })

  await prisma.screening.create({
    data: {
      partyId: seller.id,
      entityId: sellerEntity.id,
      pep: false,
      sanctions: false,
      adverseMedia: false,
      resultJson: JSON.stringify({
        pepMatches: [],
        sanctionMatches: [],
        adverseMediaMatches: [],
        riskScore: 'LOW'
      })
    }
  })

  // Create risk assessment
  await prisma.riskAssessment.create({
    data: {
      dealId: deal.id,
      score: 'LOW',
      answersJson: JSON.stringify({
        transactionType: 'property_purchase',
        customerType: 'individual',
        geographicRisk: 'domestic',
        paymentMethod: 'bank_transfer',
        transactionComplexity: 'standard'
      }),
      rationale: 'Standard domestic property transaction between Australian residents with verified identities and clean screening results.'
    }
  })

  // Create policy document
  await prisma.policyDocument.create({
    data: {
      orgId: org.id,
      title: 'AML/CTF Program',
      version: '1.0',
      effectiveFrom: new Date('2024-01-01'),
      markdown: `# AML/CTF Compliance Program

## Purpose
This program is designed to ensure compliance with the Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (AML/CTF Act).

## Scope
This program applies to all designated services provided by Coastal Realty Pty Ltd, including:
- Real estate transactions above $10,000
- Property management services
- Commercial property transactions

## Customer Due Diligence (CDD)
### Standard CDD
- Verify customer identity using reliable and independent documents
- Obtain customer information including full name, date of birth, residential address
- Conduct ongoing customer due diligence

### Enhanced Due Diligence (EDD)
Required for:
- High-risk customers
- Politically Exposed Persons (PEPs)
- Transactions involving high-risk countries
- Complex or unusual large transactions

## Record Keeping
All records must be kept for a minimum of 7 years and include:
- Customer identification documents
- Transaction records
- Account files
- Correspondence with customers

## Reporting Obligations
### Threshold Transaction Reports (TTRs)
- Report cash transactions of $10,000 or more
- Submit within 10 business days

### Suspicious Matter Reports (SMRs)
- Report suspicious transactions immediately
- No minimum threshold amount

## Training and Awareness
All staff must complete AML/CTF training:
- Initial training within 30 days of commencement
- Annual refresher training
- Specialised training for compliance staff

## Review and Updates
This program will be reviewed annually or when legislative changes occur.`
    }
  })

  // Create training records for staff
  await prisma.trainingRecord.createMany({
    data: [
      {
        userId: sarah.id,
        course: 'AML_BASICS',
        completedAt: new Date('2024-01-10')
      },
      {
        userId: luca.id,
        course: 'AML_BASICS'
      },
      {
        userId: luca.id,
        course: 'KYC_101'
      },
      {
        userId: priya.id,
        course: 'AML_BASICS',
        completedAt: new Date('2024-01-05')
      },
      {
        userId: priya.id,
        course: 'KYC_101',
        completedAt: new Date('2024-01-05')
      },
      {
        userId: priya.id,
        course: 'REPORTING',
        completedAt: new Date('2024-01-05')
      }
    ]
  })

  // Create reports linked to cases
  await prisma.report.createMany({
    data: [
      {
        dealId: deal.id,
        caseId: buyerCase.id,
        kind: 'TTR',
        status: 'DRAFT',
        pdfUrl: '/reports/ttr-james-chen-draft.pdf'
      },
      {
        dealId: deal.id,
        caseId: buyerCase.id,
        kind: 'SMR',
        status: 'DRAFT',
        pdfUrl: '/reports/smr-james-chen-draft.pdf'
      }
    ]
  })

  // Create entity-linked transactions for James Chen over multiple months
  await prisma.transaction.createMany({
    data: [
      {
        entityId: buyerEntity.id,
        type: 'DEPOSIT',
        amount: 20000,
        currency: 'AUD',
        direction: 'IN',
        counterparty: 'Offshore Fund Transfer',
        method: 'BANK',
        overseasAccount: true,
        receivedAt: new Date('2024-01-15')
      },
      {
        entityId: buyerEntity.id,
        type: 'RENTAL',
        amount: 15000,
        currency: 'AUD',
        direction: 'IN',
        counterparty: 'Rental Income - Unit 5/123 Main St',
        method: 'BANK',
        overseasAccount: false,
        receivedAt: new Date('2024-02-10')
      },
      {
        entityId: buyerEntity.id,
        type: 'INTERNAL_TRANSFER',
        amount: 5000,
        currency: 'AUD',
        direction: 'OUT',
        counterparty: 'Internal Account Transfer',
        method: 'BANK',
        isInternal: true,
        receivedAt: new Date('2024-03-05')
      },
      {
        entityId: buyerEntity.id,
        type: 'DEPOSIT',
        amount: 25000,
        currency: 'AUD',
        direction: 'IN',
        counterparty: 'Investment Returns',
        method: 'BANK',
        overseasAccount: true,
        receivedAt: new Date('2024-04-20')
      },
      {
        entityId: buyerEntity.id,
        type: 'RENTAL',
        amount: 12000,
        currency: 'AUD',
        direction: 'IN',
        counterparty: 'Rental Income - Commercial Property',
        method: 'BANK',
        receivedAt: new Date('2024-05-15')
      },
      {
        entityId: buyerEntity.id,
        type: 'BALANCE',
        amount: 50000,
        currency: 'AUD',
        direction: 'OUT',
        counterparty: 'Property Investment',
        method: 'BANK',
        receivedAt: new Date('2024-06-01')
      },
      {
        entityId: buyerEntity.id,
        type: 'DEPOSIT',
        amount: 30000,
        currency: 'AUD',
        direction: 'IN',
        counterparty: 'Fund Distribution',
        method: 'BANK',
        overseasAccount: true,
        receivedAt: new Date('2024-07-10')
      },
      {
        entityId: buyerEntity.id,
        type: 'INTERNAL_TRANSFER',
        amount: 8000,
        currency: 'AUD',
        direction: 'OUT',
        counterparty: 'Portfolio Rebalance',
        method: 'BANK',
        isInternal: true,
        receivedAt: new Date('2024-08-22')
      },
      {
        entityId: buyerEntity.id,
        type: 'RENTAL',
        amount: 18000,
        currency: 'AUD',
        direction: 'IN',
        counterparty: 'Quarterly Rental Collection',
        method: 'BANK',
        receivedAt: new Date('2024-09-05')
      },
      {
        entityId: buyerEntity.id,
        type: 'DEPOSIT',
        amount: 35000,
        currency: 'AUD',
        direction: 'IN',
        counterparty: 'International Wire Transfer',
        method: 'BANK',
        overseasAccount: true,
        isCrossBorder: true,
        receivedAt: new Date('2024-10-12')
      },
      {
        entityId: buyerEntity.id,
        type: 'BALANCE',
        amount: 22000,
        currency: 'AUD',
        direction: 'OUT',
        counterparty: 'Property Maintenance Fund',
        method: 'BANK',
        receivedAt: new Date('2024-11-18')
      },
      {
        entityId: buyerEntity.id,
        type: 'DEPOSIT',
        amount: 40000,
        currency: 'AUD',
        direction: 'IN',
        counterparty: 'Year-end Distribution',
        method: 'BANK',
        overseasAccount: true,
        receivedAt: new Date('2024-12-20')
      }
    ]
  })

  // Create OrgSettings
  await prisma.orgSettings.create({
    data: {
      storeDocuments: true,
      kycReuseMonths: 12
    }
  })

  // Create audit events for various actions
  await prisma.auditEvent.createMany({
    data: [
      {
        orgId: org.id,
        userId: luca.id,
        entityType: 'Deal',
        entityId: deal.id,
        action: 'CREATE',
        payloadJson: JSON.stringify({
          address: deal.address,
          price: deal.price,
          status: deal.status
        })
      },
      {
        orgId: org.id,
        userId: luca.id,
        entityType: 'Case',
        entityId: buyerCase.id,
        action: 'CREATE',
        payloadJson: JSON.stringify({
          reason: 'RISK_ESCALATION',
          status: 'UNDER_REVIEW',
          entityId: buyerEntity.id
        })
      },
      {
        orgId: org.id,
        userId: priya.id,
        entityType: 'Case',
        entityId: buyerCase.id,
        action: 'ESCALATE',
        payloadJson: JSON.stringify({
          reason: 'RISK_ESCALATION',
          previousStatus: 'OPEN',
          newStatus: 'UNDER_REVIEW'
        })
      }
    ]
  })

  console.log('Database seeded successfully!')
  console.log('\nDemo Users:')
  console.log('Sarah Mitchell (Director): sarah@coastalrealty.com / Password123!')
  console.log('Luca Romano (Agent): luca@coastalrealty.com / Password123!')
  console.log('Priya Sharma (Compliance): priya@coastalrealty.com / Password123!')
  console.log(`\nDemo Deal: ${deal.address} - $${deal.price.toLocaleString('en-AU')}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })