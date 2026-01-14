import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CreditService } from "@/lib/credits/service";
import { OrganizationService } from "@/lib/organization/service";
import { SubscriptionService } from "@/lib/subscription/service";

// GET: 获取当前组织的积分余额
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    // 获取用户当前激活的组织
    const org = await OrganizationService.getCurrentOrganization(session.user.id);
    
    if (!org) {
      return NextResponse.json({ balance: 0, hasOrg: false });
    }

    // 自动检查并发放月度积分（静默执行，不影响主流程）
    try {
      await SubscriptionService.grantMonthlyCredits(org.id);
    } catch (e) {
      console.error("自动发放月度积分失败:", e);
    }

    const balance = await CreditService.getBalance(org.id);
    const planId = await SubscriptionService.getOrgPlan(org.id);

    return NextResponse.json({ 
      balance, 
      hasOrg: true,
      orgId: org.id,
      orgName: org.name,
      role: org.role,
      userId: session.user.id,
      plan: planId,
    });
  } catch (error) {
    console.error("获取积分余额失败:", error);
    return NextResponse.json({ error: "获取积分余额失败" }, { status: 500 });
  }
}
