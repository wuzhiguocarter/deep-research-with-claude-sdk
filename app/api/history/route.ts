import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const sessions = await prisma.researchSession.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
