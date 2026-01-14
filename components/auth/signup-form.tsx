"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Github, Loader2, UserPlus } from "lucide-react";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");
  const inviteEmail = searchParams.get("email") || "";
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 接受邀请加入组织
  const acceptInvite = async (code: string) => {
    try {
      const res = await fetch("/api/organization/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password.length < 8) {
      setError("密码长度至少为 8 位");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || "注册失败，请稍后重试");
      } else {
        // 注册成功
        if (inviteCode) {
          // 有邀请码，自动接受邀请
          const joined = await acceptInvite(inviteCode);
          if (joined) {
            router.push("/dashboard");
          } else {
            // 接受邀请失败，可能邀请码已过期，跳转到创建组织
            router.push("/org/create");
          }
        } else {
          // 没有邀请码，跳转到创建组织页面
          router.push("/org/create");
        }
        router.refresh();
      }
    } catch (err) {
      setError("注册失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSignUp = () => {
    setError("GitHub 注册功能暂未开放，请使用邮箱注册");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">创建账号</CardTitle>
        <CardDescription>
          {inviteCode 
            ? "注册后将自动加入邀请的组织" 
            : "注册后即可开始使用 AI 研究助手"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {inviteCode && (
          <div className="p-3 text-sm text-blue-600 bg-blue-50 rounded-md">
            您正在通过邀请链接注册，注册后将自动加入组织
          </div>
        )}

        {/* GitHub 注册 */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGitHubSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Github className="mr-2 h-4 w-4" />
          )}
          使用 GitHub 注册
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">或</span>
          </div>
        </div>

        {/* 邮箱注册 */}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              姓名
            </label>
            <Input
              id="name"
              type="text"
              placeholder="您的姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              邮箱
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              密码
            </label>
            <Input
              id="password"
              type="password"
              placeholder="至少 8 位字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            创建账号
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground">
          已有账号？{" "}
          <Link 
            href={inviteCode ? `/signin?callbackUrl=/invite/${inviteCode}` : "/signin"} 
            className="text-primary hover:underline"
          >
            立即登录
          </Link>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          注册即表示您同意我们的服务条款和隐私政策
        </div>
      </CardFooter>
    </Card>
  );
}
