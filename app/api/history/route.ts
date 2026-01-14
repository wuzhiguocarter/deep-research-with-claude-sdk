import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { OrganizationService } from '@/lib/organization/service'

export async function GET(request: NextRequest) {
  try {
    // 认证检查
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 获取用户当前激活的组织
    const org = await OrganizationService.getCurrentOrganization(session.user.id)
    if (!org) {
      return NextResponse.json([])
    }

    const orgId = org.id

    // 获取组织内的研究历史
    const sessions = await prisma.researchSession.findMany({
      where: {
        orgId: orgId,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
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
