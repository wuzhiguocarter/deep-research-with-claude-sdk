import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/lib/organization/service";

// GET: 验证邀请码
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ valid: false, error: "邀请码不能为空" });
  }

  try {
    const result = await OrganizationService.verifyInvite(code);
    return NextResponse.json(result);
  } catch (error) {
    console.error("验证邀请码失败:", error);
    return NextResponse.json({ valid: false, error: "验证邀请码失败" });
  }
}
