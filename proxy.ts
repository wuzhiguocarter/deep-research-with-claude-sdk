import { NextResponse, type NextRequest } from "next/server";

// 需要登录的路由
const protectedRoutes = ["/dashboard", "/org"];
// 认证相关路由（已登录用户不应访问）
const authRoutes = ["/signin", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API 路由直接放行
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 静态资源放行
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 检查是否需要保护
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // 通过 cookie 检查会话（Better-Auth 默认使用 "better-auth.session_token" cookie）
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const hasSession = !!sessionCookie?.value;

  // 未登录用户访问受保护路由 -> 重定向到登录页
  if (isProtectedRoute && !hasSession) {
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  // 已登录用户访问认证页面 -> 重定向到仪表盘
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
