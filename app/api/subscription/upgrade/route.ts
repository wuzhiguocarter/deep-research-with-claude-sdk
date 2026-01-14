import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrganizationService } from "@/lib/organization/service";
import { SubscriptionService } from "@/lib/subscription/service";
import { hasPermission, type OrgRole, type PlanId, plans } from "@/config";
import { CreditService } from "@/lib/credits/service";

/**
 * POST: 升级套餐
 * 
 * MVP 版本：直接升级，不涉及实际支付
 * 生产环境需要接入支付流程
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { plan } = await request.json();

    if (!plan || !["pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "无效的套餐" },
        { status: 400 }
      );
    }

    // 获取当前组织
    const org = await OrganizationService.getCurrentOrganization(session.user.id);
    if (!org) {
      return NextResponse.json(
        { error: "请先创建或加入一个组织" },
        { status: 400 }
      );
    }

    // 检查权限（只有 owner 可以升级）
    const userRole = await OrganizationService.getUserRole(session.user.id, org.id);
    if (!userRole || userRole !== "owner") {
      return NextResponse.json(
        { error: "仅组织拥有者可以升级套餐" },
        { status: 403 }
      );
    }

    // 获取当前套餐
    const currentPlan = await SubscriptionService.getOrgPlan(org.id);
    
    // 检查是否为有效升级
    const planOrder = { free: 0, pro: 1, enterprise: 2 };
    if (planOrder[plan as PlanId] <= planOrder[currentPlan]) {
      return NextResponse.json(
        { error: "只能升级到更高级的套餐" },
        { status: 400 }
      );
    }

    // 执行升级
    await SubscriptionService.upgradePlan(org.id, plan as PlanId);

    // MVP: 升级后立即赠送新套餐的月度积分（作为升级奖励）
    const newPlanConfig = plans[plan as PlanId];
    const bonusCredits = newPlanConfig.features.monthlyCredits;
    
    await CreditService.add({
      orgId: org.id,
      userId: session.user.id,
      amount: bonusCredits,
      type: "bonus",
      description: `升级到${newPlanConfig.name}赠送积分`,
    });

    return NextResponse.json({
      success: true,
      message: `成功升级到${newPlanConfig.name}`,
      plan: plan,
      bonusCredits,
    });
  } catch (error) {
    console.error("升级套餐失败:", error);
    return NextResponse.json({ error: "升级套餐失败" }, { status: 500 });
  }
}

/**
 * GET: 获取当前套餐信息
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const org = await OrganizationService.getCurrentOrganization(session.user.id);
    if (!org) {
      return NextResponse.json({ plan: "free", hasOrg: false });
    }

    const planId = await SubscriptionService.getOrgPlan(org.id);
    const planConfig = plans[planId];

    return NextResponse.json({
      plan: planId,
      planName: planConfig.name,
      features: planConfig.features,
      hasOrg: true,
    });
  } catch (error) {
    console.error("获取套餐信息失败:", error);
    return NextResponse.json({ error: "获取套餐信息失败" }, { status: 500 });
  }
}
