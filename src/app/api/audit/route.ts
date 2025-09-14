import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      orgId: session.user.orgId
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (entityId) {
      where.entityId = entityId
    }

    if (action) {
      where.action = action
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [events, totalCount] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          org: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.auditEvent.count({ where })
    ])

    return NextResponse.json({
      events,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Audit trail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      entityType,
      entityId,
      caseId,
      action,
      payloadJson
    } = body

    const auditEvent = await prisma.auditEvent.create({
      data: {
        orgId: session.user.orgId,
        userId: session.user.id,
        entityType,
        entityId,
        caseId,
        action,
        payloadJson: payloadJson ? JSON.stringify(payloadJson) : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        org: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ auditEvent })

  } catch (error) {
    console.error('Audit event creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create audit event' },
      { status: 500 }
    )
  }
}