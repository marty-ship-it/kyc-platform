import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entities = await prisma.entity.findMany({
      include: {
        organisation: true,
        parties: {
          include: {
            deal: true
          }
        },
        cases: {
          where: {
            status: {
              in: ['ACTIVE', 'UNDER_REVIEW']
            }
          }
        },
        kycs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        screenings: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        deals: true,
        _count: {
          select: {
            cases: true,
            deals: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    return NextResponse.json(entities)
  } catch (error) {
    console.error('Entities API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}