import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrganizationService } from "@/lib/organization/service";
import { hasPermission, type OrgRole } from "@/config";

// GET: 获取组织成员列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    // 检查用户是否是组织成员
    const role = await OrganizationService.getUserRole(session.user.id, orgId);
    if (!role) {
      return NextResponse.json({ error: "无权访问该组织" }, { status: 403 });
    }

    const members = await OrganizationService.getMembers(orgId);
    return NextResponse.json(members);
  } catch (error) {
    console.error("获取成员列表失败:", error);
    return NextResponse.json({ error: "获取成员列表失败" }, { status: 500 });
  }
}

// DELETE: 移除成员
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { userId } = await request.json();

    // 检查权限
    const role = await OrganizationService.getUserRole(session.user.id, orgId);
    if (!role || !hasPermission(role, "member:remove")) {
      return NextResponse.json({ error: "无权移除成员" }, { status: 403 });
    }

    await OrganizationService.removeMember(orgId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("移除成员失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "移除成员失败" },
      { status: 500 }
    );
  }
}

// PATCH: 更新成员角色
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { userId, role: newRole } = await request.json();

    // 检查权限
    const currentRole = await OrganizationService.getUserRole(
      session.user.id,
      orgId
    );
    if (!currentRole || !hasPermission(currentRole, "member:update_role")) {
      return NextResponse.json({ error: "无权修改成员角色" }, { status: 403 });
    }

    await OrganizationService.updateMemberRole(
      orgId,
      userId,
      newRole as OrgRole
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新成员角色失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新成员角色失败" },
      { status: 500 }
    );
  }
}
