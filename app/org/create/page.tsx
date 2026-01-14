"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2 } from "lucide-react";
import { notifyOrgUpdated } from "@/lib/org-event";

export default function CreateOrgPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 自动生成唯一 slug（不包含组织名称）
  const generateSlug = () => {
    // 使用时间戳 + 随机字符确保唯一性
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `org-${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("请输入组织名称");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const slug = generateSlug();
      
      const res = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "创建组织失败");
      } else {
        // 通知头部组织选择器刷新
        notifyOrgUpdated();
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("创建组织失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">创建您的组织</CardTitle>
          <CardDescription>
            组织是团队协作的基础，创建后可邀请成员加入
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                组织名称
              </label>
              <Input
                id="name"
                placeholder="例如：我的团队"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Building2 className="mr-2 h-4 w-4" />
              )}
              创建组织
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">🎁 新组织福利</h4>
            <p className="text-xs text-muted-foreground">
              创建组织后将获得 500 积分，可用于发起研究任务
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
