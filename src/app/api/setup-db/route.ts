import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function GET(request: Request) {
  // Allow in production environment
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ error: 'Setup only available in production' }, { status: 403 })
  }

  try {
    // Check if data already exists
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({ message: 'Database already seeded' })
    }

    console.log('Starting database seed...')

    // Create organisation
    const org = await prisma.organisation.create({
      data: {
        name: 'Coastal Realty Pty Ltd',
        abn: '12 345 678 901',
        timezone: 'Australia/Sydney'
      }
    })

    // Create users
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
    const james = await prisma.entity.create({
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

    const margaret = await prisma.entity.create({
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

    const oceanic = await prisma.entity.create({
      data: {
        orgId: org.id,
        kind: 'ORGANISATION',
        legalName: 'Oceanic Investments Pty Ltd',
        abnAcn: '123 456 789',
        country: 'Australia',
        riskScore: 'LOW',
        riskRationale: 'Established property investment company with clean compliance history'
      }
    })

    // Create deal
    const deal = await prisma.deal.create({
      data: {
        address: '12 Seaview Rd, Bondi NSW',
        price: 1200000,
        status: 'ACTIVE',
        createdByUserId: luca.id,
        orgId: org.id,
        entities: {
          connect: [{ id: james.id }, { id: margaret.id }]
        }
      }
    })

    // Create parties
    const buyerParty = await prisma.party.create({
      data: {
        dealId: deal.id,
        entityId: james.id,
        type: 'BUYER',
        fullName: 'James Chen',
        dob: new Date('1985-03-15'),
        country: 'Australia'
      }
    })

    const sellerParty = await prisma.party.create({
      data: {
        dealId: deal.id,
        entityId: margaret.id,
        type: 'SELLER',
        fullName: 'Margaret Wilson',
        dob: new Date('1958-07-22'),
        country: 'Australia'
      }
    })

    // Create KYC check for James
    await prisma.kycCheck.create({
      data: {
        entityId: james.id,
        partyId: buyerParty.id,
        dvStatus: 'PASS',
        liveness: true
      }
    })

    // Create screening for James
    await prisma.screening.create({
      data: {
        entityId: james.id,
        partyId: buyerParty.id,
        pep: false,
        sanctions: false,
        adverseMedia: true
      }
    })

    // Create case for James
    await prisma.case.create({
      data: {
        orgId: org.id,
        entityId: james.id,
        dealId: deal.id,
        reason: 'RISK_ESCALATION',
        status: 'UNDER_REVIEW',
        createdById: luca.id,
        notes: JSON.stringify([{
          by: 'Luca Romano',
          at: new Date().toISOString(),
          text: 'Client showing medium risk indicators due to offshore investment fund connections. Requires additional due diligence.'
        }])
      }
    })

    // Create transactions
    await prisma.transaction.createMany({
      data: [
        {
          dealId: deal.id,
          type: 'DEPOSIT',
          amount: 60000,
          currency: 'AUD',
          direction: 'IN',
          counterparty: 'James Chen',
          method: 'BANK',
          purpose: 'Property deposit payment',
          receivedAt: new Date('2024-01-16')
        },
        {
          dealId: deal.id,
          type: 'INTERNAL_TRANSFER',
          amount: 40000,
          currency: 'AUD',
          direction: 'IN',
          counterparty: 'Chen Holdings Pty Ltd',
          method: 'BANK',
          purpose: 'Additional deposit from company account',
          isInternal: true,
          receivedAt: new Date('2024-01-17')
        }
      ]
    })

    return NextResponse.json({ 
      success: true,
      message: 'Database seeded successfully!',
      stats: {
        users: 3,
        entities: 3,
        deals: 1,
        cases: 1
      }
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'Setup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}