import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrganizationService } from "@/lib/organization/service";

// POST: 接受邀请加入组织
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "邀请码不能为空" }, { status: 400 });
    }

    const org = await OrganizationService.acceptInvite(code, session.user.id);

    return NextResponse.json({
      success: true,
      organization: org,
    });
  } catch (error) {
    console.error("加入组织失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "加入组织失败" },
      { status: 500 }
    );
  }
}
