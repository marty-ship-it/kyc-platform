import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // Only allow in production
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ error: 'Only available in production' }, { status: 403 })
  }

  try {
    console.log('Starting demo data update...')

    // Find James Chen entity
    const james = await prisma.entity.findFirst({
      where: {
        fullName: 'James Chen'
      }
    })

    if (!james) {
      return NextResponse.json({ error: 'James Chen entity not found' }, { status: 404 })
    }

    // Update James with aliases and master notes
    await prisma.entity.update({
      where: { id: james.id },
      data: {
        aliases: JSON.stringify(["James Chen", "James Robert Chen Jr"]),
        masterNotes: JSON.stringify([
          { 
            id: "1", 
            byUserId: "system", 
            text: "Longstanding client with overseas connections", 
            createdAt: new Date().toISOString() 
          }
        ])
      }
    })

    // Find existing case for James and add signals
    const jamesCase = await prisma.case.findFirst({
      where: {
        entityId: james.id
      }
    })

    if (jamesCase) {
      await prisma.case.update({
        where: { id: jamesCase.id },
        data: {
          signals: JSON.stringify([
            { type: "OVERSEAS_ACCOUNT" },
            { type: "AMOUNT_THRESHOLD", value: 20000 }
          ])
        }
      })
    }

    // Create entity-linked transactions for James Chen (for charts)
    const existingTransactions = await prisma.transaction.count({
      where: { entityId: james.id }
    })

    if (existingTransactions === 0) {
      await prisma.transaction.createMany({
        data: [
          {
            entityId: james.id,
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
            entityId: james.id,
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
            entityId: james.id,
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
            entityId: james.id,
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
            entityId: james.id,
            type: 'RENTAL',
            amount: 12000,
            currency: 'AUD',
            direction: 'IN',
            counterparty: 'Rental Income - Commercial Property',
            method: 'BANK',
            receivedAt: new Date('2024-05-15')
          },
          {
            entityId: james.id,
            type: 'BALANCE',
            amount: 50000,
            currency: 'AUD',
            direction: 'OUT',
            counterparty: 'Property Investment',
            method: 'BANK',
            receivedAt: new Date('2024-06-01')
          },
          {
            entityId: james.id,
            type: 'DEPOSIT',
            amount: 18000,
            currency: 'AUD',
            direction: 'IN',
            counterparty: 'Quarterly Dividend',
            method: 'BANK',
            overseasAccount: true,
            receivedAt: new Date('2024-07-10')
          },
          {
            entityId: james.id,
            type: 'RENTAL',
            amount: 14000,
            currency: 'AUD',
            direction: 'IN',
            counterparty: 'Rental Income - Apartment Complex',
            method: 'BANK',
            receivedAt: new Date('2024-08-15')
          },
          {
            entityId: james.id,
            type: 'DEPOSIT',
            amount: 30000,
            currency: 'AUD',
            direction: 'IN',
            counterparty: 'Bond Maturity',
            method: 'BANK',
            overseasAccount: false,
            receivedAt: new Date('2024-09-01')
          }
        ]
      })
    }

    // Create OrgSettings if not exists
    const orgSettings = await prisma.orgSettings.findFirst()
    if (!orgSettings) {
      await prisma.orgSettings.create({
        data: {
          storeDocuments: true,
          kycReuseMonths: 12
        }
      })
    }

    // Update existing KYC checks with document fields
    const existingKyc = await prisma.kycCheck.findFirst({
      where: { entityId: james.id }
    })

    if (existingKyc) {
      await prisma.kycCheck.update({
        where: { id: existingKyc.id },
        data: {
          docType: 'PASSPORT',
          docNumber: 'P1234567',
          issuer: 'Australia',
          expiry: new Date('2028-03-15'),
          verifiedElsewhere: false
        }
      })
    }

    const finalCounts = {
      entities: await prisma.entity.count(),
      transactions: await prisma.transaction.count({ where: { entityId: james.id } }),
      cases: await prisma.case.count(),
      orgSettings: await prisma.orgSettings.count()
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data updated successfully!',
      updates: {
        jamesAliases: 'Added',
        jamesMasterNotes: 'Added',
        caseSignals: jamesCase ? 'Added' : 'No case found',
        entityTransactions: existingTransactions === 0 ? 'Created 9 transactions' : 'Already existed',
        orgSettings: orgSettings ? 'Already existed' : 'Created',
        kycDocuments: existingKyc ? 'Updated' : 'No KYC found'
      },
      finalCounts
    })

  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({
      error: 'Update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}