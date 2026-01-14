import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrganizationService } from "@/lib/organization/service";
import { SubscriptionService } from "@/lib/subscription/service";
import { hasPermission, type OrgRole } from "@/config";

// POST: 创建邀请
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { orgId, email, role = "member" } = await request.json();

    if (!orgId || !email) {
      return NextResponse.json(
        { error: "组织ID和邮箱不能为空" },
        { status: 400 }
      );
    }

    // 检查权限
    const userRole = await OrganizationService.getUserRole(
      session.user.id,
      orgId
    );
    if (!userRole || !hasPermission(userRole, "member:invite")) {
      return NextResponse.json({ error: "无权邀请成员" }, { status: 403 });
    }

    // 检查成员数量限制
    const memberCheck = await SubscriptionService.canAddMember(orgId);
    if (!memberCheck.allowed) {
      return NextResponse.json(
        { 
          error: memberCheck.reason,
          code: "MEMBER_LIMIT_EXCEEDED",
          limit: memberCheck.limit,
          current: memberCheck.current,
        },
        { status: 403 }
      );
    }

    const invite = await OrganizationService.createInvite({
      orgId,
      email,
      role: role as OrgRole,
    });

    // 构建邀请链接
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invite.code}`;

    return NextResponse.json({
      ...invite,
      inviteUrl,
    });
  } catch (error) {
    console.error("创建邀请失败:", error);
    return NextResponse.json({ error: "创建邀请失败" }, { status: 500 });
  }
}
