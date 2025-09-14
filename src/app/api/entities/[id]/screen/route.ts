import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { triggerManualScreening } from '@/lib/services/auto-screening'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For development/demo - skip auth check
    console.log('Screening API called for entity:', params.id)

    const entityId = params.id

    // Trigger manual screening
    const result = await triggerManualScreening(entityId)

    return NextResponse.json({
      success: true,
      result: {
        entityId: result.entityId,
        riskScore: result.riskScore,
        pep: result.pep,
        sanctions: result.sanctions,
        adverseMedia: result.adverseMedia,
        dvsVerification: result.dvsVerification,
        newMatches: result.newMatches,
        requiresReview: result.requiresReview
      }
    })

  } catch (error) {
    console.error('Manual screening error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to run screening', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}