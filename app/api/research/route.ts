import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { ResearchService } from '@/lib/research/service'
import { ResearchRequest } from '@/lib/research/types'
import { OrganizationService } from '@/lib/organization/service'
import { CreditService } from '@/lib/credits/service'
import { SubscriptionService } from '@/lib/subscription/service'
import { creditRules, type ResearchType } from '@/config'

export async function POST(request: NextRequest) {
  try {
    // 1. 认证检查
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    console.log('[API] Received research request from user:', session.user.id)
    const body: ResearchRequest = await request.json()
    console.log('[API] Request body:', { query: body.query, type: body.type })

    const { query, type } = body

    if (!query || !type) {
      console.log('[API] Missing required fields')
      return NextResponse.json(
        { error: '研究问题和类型不能为空' },
        { status: 400 }
      )
    }

    // 2. 获取用户当前激活的组织
    const org = await OrganizationService.getCurrentOrganization(session.user.id)
    if (!org) {
      return NextResponse.json(
        { error: '请先创建或加入一个组织' },
        { status: 400 }
      )
    }

    const orgId = org.id

    // 3. 检查套餐是否支持该研究类型
    const researchTypeCheck = await SubscriptionService.canUseResearchType(orgId, type)
    if (!researchTypeCheck.allowed) {
      return NextResponse.json(
        { 
          error: researchTypeCheck.reason,
          code: "RESEARCH_TYPE_NOT_ALLOWED",
        },
        { status: 403 }
      )
    }

    // 4. 计算积分消耗
    const creditCost = creditRules.research[type as ResearchType]
    if (!creditCost) {
      return NextResponse.json(
        { error: '无效的研究类型' },
        { status: 400 }
      )
    }

    // 6. 检查积分是否足够
    const hasEnoughCredits = await CreditService.checkBalance(orgId, creditCost)
    if (!hasEnoughCredits) {
      const balance = await CreditService.getBalance(orgId)
      return NextResponse.json(
        { 
          error: '积分不足',
          required: creditCost,
          balance,
          message: `此研究需要 ${creditCost} 积分，当前余额 ${balance} 积分`
        },
        { status: 402 }
      )
    }

    console.log('[API] Creating research session in database...')
    
    // 7. 创建研究会话（关联用户和组织）
    const researchSession = await prisma.researchSession.create({
      data: {
        query,
        type,
        status: 'processing',
        userId: session.user.id,
        orgId: orgId,
        creditsUsed: creditCost,
      }
    })

    console.log('[API] Session created:', researchSession.id)

    // 8. 扣减积分
    await CreditService.consumeForResearch({
      orgId,
      userId: session.user.id,
      researchType: type as ResearchType,
      researchId: researchSession.id,
    })

    console.log('[API] Credits consumed:', creditCost)

    // 9. 后台启动研究
    startResearch(researchSession.id, query, type).catch((err) => {
      console.error('[API] Background research error:', err)
    })

    return NextResponse.json({
      sessionId: researchSession.id,
      status: 'processing',
      creditsUsed: creditCost,
    })
  } catch (error) {
    console.error('[API] Error creating research session:', error)
    return NextResponse.json(
      {
        error: '创建研究任务失败',
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
