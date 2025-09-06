import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

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

  // Create buyer party with partial profile
  const buyer = await prisma.party.create({
    data: {
      dealId: deal.id,
      type: 'BUYER',
      fullName: 'James Chen',
      dob: new Date('1985-03-15'),
      country: 'Australia',
      docType: 'Australian Passport',
      docNumber: '123456789',
      pepFlag: false
    }
  })

  // Create seller party
  const seller = await prisma.party.create({
    data: {
      dealId: deal.id,
      type: 'SELLER',
      fullName: 'Margaret Wilson',
      dob: new Date('1958-07-22'),
      country: 'Australia',
      docType: 'Australian Drivers Licence',
      docNumber: 'NSW12345',
      pepFlag: false
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

  // Create audit event for deal creation
  await prisma.auditEvent.create({
    data: {
      orgId: org.id,
      userId: luca.id,
      entity: 'Deal',
      entityId: deal.id,
      action: 'CREATE',
      payloadJson: JSON.stringify({
        address: deal.address,
        price: deal.price,
        status: deal.status
      })
    }
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