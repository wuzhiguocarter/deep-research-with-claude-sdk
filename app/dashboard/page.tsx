"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, History, Coins, Users, ArrowRight, Loader2 } from "lucide-react";

interface DashboardStats {
  totalResearches: number;
  credits: number;
  memberCount: number;
  orgName: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalResearches: 0,
    credits: 0,
    memberCount: 0,
    orgName: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // 获取当前激活的组织信息
      const balanceRes = await fetch("/api/credits/balance");
      const balanceData = await balanceRes.json();

      if (!balanceData.hasOrg) {
        setIsLoading(false);
        return;
      }

      // 获取组织详情
      const orgRes = await fetch(`/api/organization/${balanceData.orgId}`);
      const orgData = await orgRes.json();

      // 获取研究历史数量
      const historyRes = await fetch("/api/history");
      const historyData = await historyRes.json();

      setStats({
        totalResearches: Array.isArray(historyData) ? historyData.length : 0,
        credits: balanceData.balance,
        memberCount: orgData._count?.members || 0,
        orgName: balanceData.orgName,
      });
    } catch (error) {
      console.error("加载统计数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground">
          欢迎使用 Deep Research AI 研究助手
          {stats.orgName && ` · ${stats.orgName}`}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">积分余额</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.credits}</div>
            <p className="text-xs text-muted-foreground">
              可用于发起研究任务
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">研究次数</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResearches}</div>
            <p className="text-xs text-muted-foreground">
              累计完成的研究任务
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">团队成员</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memberCount}</div>
            <p className="text-xs text-muted-foreground">
              组织内的成员数量
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>开始新研究</CardTitle>
            <CardDescription>
              使用 AI 进行深度研究，自动搜索、分析并生成报告
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/research">
                <Search className="mr-2 h-4 w-4" />
                发起研究
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>查看研究历史</CardTitle>
            <CardDescription>
              浏览团队所有的研究记录，下载或重新查看报告
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/dashboard/history">
                <History className="mr-2 h-4 w-4" />
                查看历史
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 研究类型说明 */}
      <Card>
        <CardHeader>
          <CardTitle>研究类型说明</CardTitle>
          <CardDescription>
            不同类型的研究消耗不同的积分
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📝 摘要研究</h3>
              <p className="text-sm text-muted-foreground mb-2">
                快速提取关键信息，生成简洁摘要
              </p>
              <p className="text-sm font-medium">消耗 10 积分</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📊 深度分析</h3>
              <p className="text-sm text-muted-foreground mb-2">
                全面分析，包含 SWOT 和功能矩阵
              </p>
              <p className="text-sm font-medium">消耗 25 积分</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">⚖️ 对比研究</h3>
              <p className="text-sm text-muted-foreground mb-2">
                多选项对比，优缺点分析
              </p>
              <p className="text-sm font-medium">消耗 30 积分</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
