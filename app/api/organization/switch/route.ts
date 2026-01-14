import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrganizationService } from "@/lib/organization/service";

// POST: 切换当前组织
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { orgId } = await request.json();

    if (!orgId) {
      return NextResponse.json({ error: "组织ID不能为空" }, { status: 400 });
    }

    await OrganizationService.switchOrg(session.user.id, orgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("切换组织失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "切换组织失败" },
      { status: 500 }
    );
  }
}
