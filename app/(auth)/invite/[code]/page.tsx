"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Building2, AlertTriangle, LogOut } from "lucide-react";

interface InviteInfo {
  valid: boolean;
  error?: string;
  invite?: {
    org: {
      name: string;
      slug: string;
    };
    role: string;
    email: string;
  };
}

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { data: session, isPending: sessionLoading } = useSession();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  // 验证邀请码
  useEffect(() => {
    const verifyInvite = async () => {
      try {
        const res = await fetch(`/api/organization/invite/verify?code=${code}`);
        const data = await res.json();
        setInviteInfo(data);
      } catch (err) {
        setInviteInfo({ valid: false, error: "验证邀请码失败" });
      } finally {
        setIsLoading(false);
      }
    };

    verifyInvite();
  }, [code]);

  // 加入组织
  const handleJoin = async () => {
    if (!session) {
      // 未登录，跳转到注册页面，带上邀请码
      router.push(`/signup?invite=${code}`);
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      const res = await fetch("/api/organization/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "加入组织失败");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("加入组织失败，请稍后重试");
    } finally {
      setIsJoining(false);
    }
  };

  // 退出登录，让被邀请者可以登录
  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  if (isLoading || sessionLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!inviteInfo?.valid) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>邀请无效</CardTitle>
          <CardDescription>
            {inviteInfo?.error || "该邀请链接无效或已过期"}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link href="/">返回首页</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const { invite } = inviteInfo;
  
  // 检查当前登录用户邮箱是否与邀请邮箱匹配
  const isEmailMatch = session?.user?.email?.toLowerCase() === invite?.email?.toLowerCase();
  const isLoggedInWithDifferentEmail = session && !isEmailMatch;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>您被邀请加入</CardTitle>
        <CardDescription className="text-lg font-medium text-foreground">
          {invite?.org.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">邀请邮箱</span>
            <span className="font-medium">{invite?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">您的角色</span>
            <span className="capitalize">
              {invite?.role === "admin" ? "管理员" : "成员"}
            </span>
          </div>
        </div>

        {/* 已登录但邮箱不匹配 - 只显示提示和退出按钮 */}
        {isLoggedInWithDifferentEmail ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">当前登录账号与邀请邮箱不匹配</p>
                  <p className="text-amber-700 mt-2">
                    当前账号：<span className="font-medium">{session.user.email}</span>
                  </p>
                  <p className="text-amber-700 mt-1">
                    邀请邮箱：<span className="font-medium">{invite?.email}</span>
                  </p>
                  <p className="text-amber-600 mt-3 text-xs">
                    请使用其他浏览器访问此链接，或退出当前账号后重试。
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        ) : session ? (
          // 已登录且邮箱匹配
          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            接受邀请并加入
          </Button>
        ) : (
          // 未登录
          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link href={`/signup?invite=${code}&email=${encodeURIComponent(invite?.email || '')}`}>注册并加入</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/signin?callbackUrl=/invite/${code}`}>
                已有账号？登录后加入
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
