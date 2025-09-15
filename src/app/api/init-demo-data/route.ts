import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function GET() {
  try {
    // Check if data already exists
    const existingEntities = await prisma.entity.count()
    
    if (existingEntities > 0) {
      return NextResponse.json({ message: 'Demo data already exists', count: existingEntities })
    }

    // Create organisation
    const org = await prisma.organisation.create({
      data: {
        name: 'Coastal Realty Pty Ltd',
        abn: '12 345 678 901',
        timezone: 'Australia/Sydney'
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
        riskRationale: 'Medium risk due to offshore investment fund involvement'
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

    // Create a demo user
    const luca = await prisma.user.create({
      data: {
        name: 'Luca Romano',
        email: 'luca@coastalrealty.com',
        role: 'AGENT',
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

    // Create a case
    await prisma.case.create({
      data: {
        orgId: org.id,
        entityId: buyerEntity.id,
        dealId: deal.id,
        reason: 'RISK_ESCALATION',
        status: 'UNDER_REVIEW',
        notes: JSON.stringify([{
          by: 'Luca Romano',
          at: new Date('2024-01-16T09:30:00Z').toISOString(),
          text: 'Client showing medium risk indicators due to offshore investment fund connections. Requires additional due diligence.'
        }]),
        createdById: luca.id
      }
    })

    // Create parties
    await prisma.party.create({
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

    await prisma.party.create({
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

    return NextResponse.json({ 
      message: 'Demo data initialized successfully',
      entities: {
        buyer: buyerEntity,
        seller: sellerEntity,
        corporate: corporateEntity
      }
    })
  } catch (error) {
    console.error('Init demo data error:', error)
    return NextResponse.json({ error: 'Failed to initialize demo data' }, { status: 500 })
  }
}