"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Plus, Coins, RefreshCw } from "lucide-react";
import { creditsEvent } from "@/lib/credits-event";
import { orgEvent } from "@/lib/org-event";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
  credits: number;
}

export function OrgSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 获取组织列表和积分
  const loadOrganizations = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }
    
    try {
      // 获取组织列表（包含积分）
      const orgsRes = await fetch("/api/organization");
      const orgsData = await orgsRes.json();
      setOrganizations(orgsData);

      // 获取当前激活的组织
      const balanceRes = await fetch("/api/credits/balance");
      const balanceData = await balanceRes.json();
      
      if (balanceData.orgId) {
        setCurrentOrgId(balanceData.orgId);
      } else if (orgsData.length > 0) {
        setCurrentOrgId(orgsData[0].id);
      }
    } catch (error) {
      console.error("加载组织失败:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 仅刷新积分（轻量级）
  const refreshCredits = useCallback(async () => {
    try {
      const orgsRes = await fetch("/api/organization");
      const orgsData = await orgsRes.json();
      setOrganizations(orgsData);
    } catch (error) {
      console.error("刷新积分失败:", error);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // 监听路由变化，刷新积分
  useEffect(() => {
    // pathname 变化时刷新积分
    refreshCredits();
  }, [pathname, refreshCredits]);

  // 监听积分更新事件（研究完成、充值等场景）
  useEffect(() => {
    const unsubscribe = creditsEvent.subscribe(() => {
      refreshCredits();
    });
    return unsubscribe;
  }, [refreshCredits]);

  // 监听组织信息更新事件（修改组织名称等场景）
  useEffect(() => {
    const unsubscribe = orgEvent.subscribe(() => {
      loadOrganizations();
    });
    return unsubscribe;
  }, [loadOrganizations]);

  const handleOrgChange = async (orgId: string) => {
    if (orgId === "create") {
      router.push("/org/create");
      return;
    }

    if (orgId === currentOrgId) return;

    setCurrentOrgId(orgId);

    // 切换组织
    try {
      await fetch("/api/organization/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      // 刷新整个页面以更新所有数据
      window.location.reload();
    } catch (error) {
      console.error("切换组织失败:", error);
    }
  };

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  if (isLoading) {
    return (
      <div className="h-10 w-48 bg-muted animate-pulse rounded-md" />
    );
  }

  if (organizations.length === 0) {
    return (
      <Button variant="outline" onClick={() => router.push("/org/create")}>
        <Plus className="h-4 w-4 mr-2" />
        创建组织
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Select value={currentOrgId} onValueChange={handleOrgChange}>
        <SelectTrigger className="w-48">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <SelectValue placeholder="选择组织" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex items-center justify-between w-full">
                <span>{org.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {org.role === "owner"
                    ? "拥有者"
                    : org.role === "admin"
                    ? "管理员"
                    : "成员"}
                </span>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="create">
            <div className="flex items-center gap-2 text-primary">
              <Plus className="h-4 w-4" />
              创建新组织
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {currentOrg && (
        <div 
          className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
          onClick={() => refreshCredits()}
          title="点击刷新积分"
        >
          <Coins className="h-4 w-4" />
          <span>{currentOrg.credits} 积分</span>
          {isRefreshing && (
            <RefreshCw className="h-3 w-3 animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}
