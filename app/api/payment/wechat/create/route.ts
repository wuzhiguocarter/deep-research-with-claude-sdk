import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { WechatPayService } from "@/lib/payment/wechat";
import { OrganizationService } from "@/lib/organization/service";
import { hasPermission } from "@/config";

// POST: 创建微信支付订单
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { packageId } = await request.json();

    if (!packageId) {
      return NextResponse.json({ error: "请选择积分包" }, { status: 400 });
    }

    // 获取用户当前激活的组织
    const org = await OrganizationService.getCurrentOrganization(session.user.id);
    
    if (!org) {
      return NextResponse.json({ error: "请先创建组织" }, { status: 400 });
    }

    // 检查权限
    if (!hasPermission(org.role, "credits:purchase")) {
      return NextResponse.json({ error: "无权购买积分" }, { status: 403 });
    }

    // 创建支付订单
    const result = await WechatPayService.createOrder({
      orgId: org.id,
      userId: session.user.id,
      packageId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("创建支付订单失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建支付订单失败" },
      { status: 500 }
    );
  }
}
