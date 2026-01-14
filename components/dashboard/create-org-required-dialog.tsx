"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { notifyOrgUpdated } from "@/lib/org-event";

interface CreateOrgRequiredDialogProps {
  open: boolean;
}

export function CreateOrgRequiredDialog({ open }: CreateOrgRequiredDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "请输入组织名称",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 自动生成唯一的 slug
      const slug = `org-${nanoid(8)}`;

      const res = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建失败");
      }

      toast({
        title: "组织创建成功！",
        description: "欢迎使用 Deep Research",
      });

      // 通知组织更新
      notifyOrgUpdated();

      // 刷新页面以加载新组织数据
      router.refresh();
      window.location.reload();
    } catch (error) {
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-md"
        // 禁止通过点击外部或按 ESC 关闭
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // 隐藏关闭按钮
        hideCloseButton
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">欢迎使用 Deep Research</DialogTitle>
          <DialogDescription className="text-base">
            在开始之前，请先创建您的组织。组织是您管理团队成员、积分和研究记录的基础。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="org-name" className="text-sm font-medium">
              组织名称 <span className="text-destructive">*</span>
            </label>
            <Input
              id="org-name"
              placeholder="例如：我的团队、XX公司研发部"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              您可以稍后在组织设置中修改名称
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                创建组织并开始使用
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground text-center">
            💡 提示：创建组织后，您将获得初始积分，并可以邀请团队成员一起使用
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
