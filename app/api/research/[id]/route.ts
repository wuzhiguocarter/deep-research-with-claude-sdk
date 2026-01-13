import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await prisma.researchSession.findUnique({
      where: { id }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Research session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: session.id,
      query: session.query,
      type: session.type,
      status: session.status,
      result: session.result,
      sources: session.sources,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    })
  } catch (error) {
    console.error('Error fetching research session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch research session' },
      { status: 500 }
    )
  }
}
