import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrganizationService } from "@/lib/organization/service";
import { hasPermission } from "@/config";

// GET: 获取单个研究记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const research = await prisma.researchSession.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!research) {
      return NextResponse.json({ error: "研究记录不存在" }, { status: 404 });
    }

    // 检查用户是否属于该组织
    const role = await OrganizationService.getUserRole(
      session.user.id,
      research.orgId
    );
    if (!role) {
      return NextResponse.json({ error: "无权访问该记录" }, { status: 403 });
    }

    return NextResponse.json(research);
  } catch (error) {
    console.error("获取研究记录失败:", error);
    return NextResponse.json({ error: "获取研究记录失败" }, { status: 500 });
  }
}

// DELETE: 删除研究记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 先获取研究记录
    const research = await prisma.researchSession.findUnique({
      where: { id },
      select: { id: true, userId: true, orgId: true },
    });

    if (!research) {
      return NextResponse.json({ error: "研究记录不存在" }, { status: 404 });
    }

    // 检查用户是否属于该组织
    const role = await OrganizationService.getUserRole(
      session.user.id,
      research.orgId
    );
    if (!role) {
      return NextResponse.json({ error: "无权访问该记录" }, { status: 403 });
    }

    // 权限检查：
    // 1. owner 可以删除所有人的研究 (research:delete_all)
    // 2. admin/member 只能删除自己的研究 (research:delete_own)
    const isOwnResearch = research.userId === session.user.id;
    const canDeleteAll = hasPermission(role, "research:delete_all");
    const canDeleteOwn = hasPermission(role, "research:delete_own");

    if (!canDeleteAll && !(canDeleteOwn && isOwnResearch)) {
      return NextResponse.json(
        { error: "只能删除自己的研究记录" },
        { status: 403 }
      );
    }

    // 执行删除
    await prisma.researchSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除研究记录失败:", error);
    return NextResponse.json({ error: "删除研究记录失败" }, { status: 500 });
  }
}
