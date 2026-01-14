import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrganizationService } from "@/lib/organization/service";
import { hasPermission } from "@/config";
import { prisma } from "@/lib/db";

// GET: 获取组织详情
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

    const org = await OrganizationService.getById(orgId);
    if (!org) {
      return NextResponse.json({ error: "组织不存在" }, { status: 404 });
    }

    return NextResponse.json({
      ...org,
      role,
      credits: org.credits?.balance ?? 0,
    });
  } catch (error) {
    console.error("获取组织详情失败:", error);
    return NextResponse.json({ error: "获取组织详情失败" }, { status: 500 });
  }
}

// PATCH: 更新组织信息
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
    // 检查权限
    const role = await OrganizationService.getUserRole(session.user.id, orgId);
    if (!role || !hasPermission(role, "org:update")) {
      return NextResponse.json({ error: "无权修改组织信息" }, { status: 403 });
    }

    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "组织名称不能为空" }, { status: 400 });
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: { name: name.trim() },
    });

    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error("更新组织失败:", error);
    return NextResponse.json({ error: "更新组织失败" }, { status: 500 });
  }
}

// DELETE: 删除组织
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
    // 检查权限（仅 owner 可以删除组织）
    const role = await OrganizationService.getUserRole(session.user.id, orgId);
    if (!role || !hasPermission(role, "org:delete")) {
      return NextResponse.json({ error: "仅组织拥有者可以删除组织" }, { status: 403 });
    }

    // 删除组织相关的所有数据（按依赖顺序）
    // 1. 删除研究记录
    await prisma.researchSession.deleteMany({
      where: { orgId },
    });

    // 2. 删除积分交易记录
    await prisma.creditTransaction.deleteMany({
      where: { orgId },
    });

    // 3. 删除组织积分
    await prisma.orgCredits.deleteMany({
      where: { orgId },
    });

    // 4. 删除邀请记录
    await prisma.orgInvite.deleteMany({
      where: { orgId },
    });

    // 5. 删除订单记录
    await prisma.order.deleteMany({
      where: { orgId },
    });

    // 6. 删除组织成员
    await prisma.orgMember.deleteMany({
      where: { orgId },
    });

    // 7. 清除用户的 activeOrgId（如果指向该组织）
    await prisma.user.updateMany({
      where: { activeOrgId: orgId },
      data: { activeOrgId: null },
    });

    // 8. 最后删除组织本身
    await prisma.organization.delete({
      where: { id: orgId },
    });

    return NextResponse.json({ success: true, message: "组织已删除" });
  } catch (error) {
    console.error("删除组织失败:", error);
    return NextResponse.json({ error: "删除组织失败" }, { status: 500 });
  }
}
