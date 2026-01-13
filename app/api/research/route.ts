import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ResearchService } from '@/lib/research/service'
import { ResearchRequest } from '@/lib/research/types'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Received research request')
    const body: ResearchRequest = await request.json()
    console.log('[API] Request body:', { query: body.query, type: body.type })

    const { query, type } = body

    if (!query || !type) {
      console.log('[API] Missing required fields')
      return NextResponse.json(
        { error: 'Query and type are required' },
        { status: 400 }
      )
    }

    console.log('[API] Creating research session in database...')
    // Create research session
    const session = await prisma.researchSession.create({
      data: {
        query,
        type,
        status: 'processing'
      }
    })

    console.log('[API] Session created:', session.id)

    // Start research in background
    startResearch(session.id, query, type).catch((err) => {
      console.error('[API] Background research error:', err)
    })

    return NextResponse.json({
      sessionId: session.id,
      status: 'processing'
    })
  } catch (error) {
    console.error('[API] Error creating research session:', error)
    return NextResponse.json(
      {
        error: 'Failed to create research session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function startResearch(sessionId: string, query: string, type: string) {
  console.log('[Research] Starting research process for session:', sessionId)
  const researchService = new ResearchService(sessionId)

  try {
    console.log('[Research] Calling conductResearch...')
    for await (const progress of researchService.conductResearch(query, type as any)) {
      console.log('[Research] Progress update:', progress.status, progress.step)

      // Update database with progress
      if (progress.status === 'completed' && progress.result) {
        console.log('[Research] Research completed, saving result...')
        await prisma.researchSession.update({
          where: { id: sessionId },
          data: {
            status: 'completed',
            result: progress.result
          }
        })
        console.log('[Research] Result saved successfully')
      } else if (progress.status === 'failed') {
        console.error('[Research] Research failed:', progress.error)
        await prisma.researchSession.update({
          where: { id: sessionId },
          data: {
            status: 'failed',
            result: progress.error || 'Research failed'
          }
        })
      }
    }
  } catch (error) {
    console.error('[Research] Exception in research process:', error)
    await prisma.researchSession.update({
      where: { id: sessionId },
      data: {
        status: 'failed',
        result: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}
