import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CreditService } from "@/lib/credits/service";
import { OrganizationService } from "@/lib/organization/service";

// GET: 获取积分交易记录
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    // 获取用户当前激活的组织
    const org = await OrganizationService.getCurrentOrganization(session.user.id);
    
    if (!org) {
      return NextResponse.json([]);
    }

    const transactions = await CreditService.getTransactions(org.id, limit);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("获取交易记录失败:", error);
    return NextResponse.json({ error: "获取交易记录失败" }, { status: 500 });
  }
}
