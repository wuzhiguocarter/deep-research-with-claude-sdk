import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrganizationService } from "@/lib/organization/service";

// GET: 获取用户的所有组织
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const organizations = await OrganizationService.getUserOrganizations(
      session.user.id
    );
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("获取组织列表失败:", error);
    return NextResponse.json({ error: "获取组织列表失败" }, { status: 500 });
  }
}

// POST: 创建新组织
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "组织名称和标识不能为空" },
        { status: 400 }
      );
    }

    // 检查 slug 是否可用
    const isAvailable = await OrganizationService.isSlugAvailable(slug);
    if (!isAvailable) {
      return NextResponse.json(
        { error: "该组织标识已被使用" },
        { status: 400 }
      );
    }

    const org = await OrganizationService.create({
      name,
      slug,
      userId: session.user.id,
    });

    return NextResponse.json(org);
  } catch (error) {
    console.error("创建组织失败:", error);
    return NextResponse.json({ error: "创建组织失败" }, { status: 500 });
  }
}
