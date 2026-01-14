"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Coins, Loader2, QrCode, ArrowDownRight, ArrowUpRight, Gift, Lock, Crown, CheckCircle, Sparkles } from "lucide-react";
import { creditPackages, hasPermission, plans, type OrgRole, type PlanId } from "@/config";
import { notifyCreditsUpdated } from "@/lib/credits-event";
import { useToast } from "@/components/ui/toast";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string | null;
  createdAt: string;
}

interface PaymentOrder {
  orderId: string;
  amount: number;
  credits: number;
  qrcodeUrl: string;
  mockConfirmUrl: string;
}

export default function CreditsPage() {
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<OrgRole | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
  
  // 购买相关状态
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // 升级套餐弹窗
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    loadCreditsData();
  }, []);

  const loadCreditsData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        fetch("/api/credits/balance"),
        fetch("/api/credits/transactions"),
      ]);

      const balanceData = await balanceRes.json();
      const transactionsData = await transactionsRes.json();

      setBalance(balanceData.balance || 0);
      setTransactions(transactionsData || []);
      
      // 设置用户角色和当前套餐
      if (balanceData.role) {
        setUserRole(balanceData.role as OrgRole);
      }
      if (balanceData.plan) {
        setCurrentPlan(balanceData.plan as PlanId);
      }
    } catch (error) {
      console.error("加载积分数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 检查是否有购买积分权限
  const canPurchaseCredits = userRole ? hasPermission(userRole, "credits:purchase") : false;

  const handlePurchase = async (packageId: string) => {
    if (!canPurchaseCredits) return;
    
    setSelectedPackage(packageId);
    setIsPurchasing(true);
    setDialogOpen(true);

    try {
      const res = await fetch("/api/payment/wechat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();
      if (res.ok) {
        setPaymentOrder(data);
      } else {
        toast({
          title: "创建支付订单失败",
          description: data.error || "请稍后重试",
          variant: "destructive",
        });
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("创建支付订单失败:", error);
      toast({
        title: "创建支付订单失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setPaymentOrder(null);
    setSelectedPackage(null);
    // 刷新数据
    loadCreditsData();
    // 通知头部积分显示更新
    notifyCreditsUpdated();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case "consume":
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      case "bonus":
        return <Gift className="h-4 w-4 text-blue-500" />;
      default:
        return <Coins className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "purchase":
        return <Badge variant="default">购买</Badge>;
      case "consume":
        return <Badge variant="secondary">消耗</Badge>;
      case "bonus":
        return <Badge variant="outline">赠送</Badge>;
      case "refund":
        return <Badge variant="outline">退款</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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
        <h1 className="text-3xl font-bold">积分管理</h1>
        <p className="text-muted-foreground">查看和管理您的组织积分</p>
      </div>

      {/* 当前套餐 + 积分余额 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 当前套餐卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              当前套餐
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {plans[currentPlan].name}
                  {currentPlan !== "free" && (
                    <Badge variant="secondary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      已订阅
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {plans[currentPlan].priceDisplay}/{plans[currentPlan].period}
                </p>
              </div>
            </div>
            
            {/* 套餐功能 */}
            <div className="space-y-2 text-sm">
              {plans[currentPlan].featureList.slice(0, 3).map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {feature}
                </div>
              ))}
            </div>

            {/* 升级按钮 */}
            {currentPlan === "free" && (
              <Button className="w-full" onClick={() => setUpgradeDialogOpen(true)}>
                升级套餐
              </Button>
            )}
            {currentPlan === "pro" && (
              <Button variant="outline" className="w-full" onClick={() => setContactDialogOpen(true)}>
                升级到企业版
              </Button>
            )}
            {currentPlan === "enterprise" && (
              <p className="text-sm text-center text-muted-foreground">
                您已是最高级套餐
              </p>
            )}
          </CardContent>
        </Card>

        {/* 积分余额卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              当前积分余额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{balance}</div>
            <p className="text-sm text-muted-foreground mt-2">
              积分可用于发起各类研究任务
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>当前套餐月度积分：{plans[currentPlan].features.monthlyCredits}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 积分充值包 */}
      <Card>
        <CardHeader>
          <CardTitle>购买积分</CardTitle>
          <CardDescription>
            {canPurchaseCredits 
              ? "选择适合您需求的积分包" 
              : "仅组织拥有者和管理员可以购买积分"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!canPurchaseCredits && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-700">
              <Lock className="h-4 w-4" />
              <span>您的角色没有购买积分的权限，请联系组织管理员</span>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`border rounded-lg p-4 transition-colors flex flex-col ${
                  canPurchaseCredits 
                    ? "hover:border-primary" 
                    : "opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="text-2xl font-bold">{pkg.credits}</div>
                <div className="text-sm text-muted-foreground mb-2">积分</div>
                <div className={`text-sm mb-2 ${pkg.bonus > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                  {pkg.bonus > 0 ? `+${pkg.bonus} 赠送` : "标准套餐"}
                </div>
                <div className="text-xl font-semibold mb-4">{pkg.priceDisplay}</div>
                <Button
                  className="w-full mt-auto"
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={!canPurchaseCredits}
                >
                  {canPurchaseCredits ? "购买" : "无权购买"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 交易记录 */}
      <Card>
        <CardHeader>
          <CardTitle>交易记录</CardTitle>
          <CardDescription>最近的积分变动</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              暂无交易记录
            </p>
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="font-medium">
                        {tx.description || tx.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getTransactionBadge(tx.type)}
                    <span
                      className={`font-semibold ${
                        tx.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 支付弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>微信支付</DialogTitle>
            <DialogDescription>
              请使用微信扫描二维码完成支付
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isPurchasing ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : paymentOrder ? (
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-white rounded-lg border">
                  <img
                    src={paymentOrder.qrcodeUrl}
                    alt="支付二维码"
                    className="w-48 h-48"
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    ¥{(paymentOrder.amount / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    支付成功后将获得 {paymentOrder.credits} 积分
                  </p>
                </div>

                {/* MVP 模式：手动确认支付按钮 */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    [MVP 演示] 点击下方按钮模拟支付成功
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(paymentOrder.mockConfirmUrl, "_blank")}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    模拟支付成功
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 升级套餐弹窗 */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>升级套餐</DialogTitle>
            <DialogDescription>
              选择适合您团队的套餐
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* 专业版 */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedPlan === "pro" ? "border-primary bg-primary/5" : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedPlan("pro")}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{plans.pro.name}</span>
                  <Badge>推荐</Badge>
                </div>
                <span className="font-bold">{plans.pro.priceDisplay}/{plans.pro.period}</span>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {plans.pro.featureList.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* 企业版 */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedPlan === "enterprise" ? "border-primary bg-primary/5" : "hover:border-primary/50"
              }`}
              onClick={() => {
                setUpgradeDialogOpen(false);
                setContactDialogOpen(true);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">{plans.enterprise.name}</span>
                </div>
                <span className="font-bold">{plans.enterprise.priceDisplay}/{plans.enterprise.period}</span>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {plans.enterprise.featureList.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                企业版需联系销售
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={async () => {
                if (selectedPlan === "pro") {
                  setIsUpgrading(true);
                  try {
                    const res = await fetch("/api/subscription/upgrade", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ plan: "pro" }),
                    });
                    if (res.ok) {
                      toast({
                        title: "升级成功",
                        description: "您已成功升级到专业版套餐",
                        variant: "success",
                      });
                      setCurrentPlan("pro");
                      setUpgradeDialogOpen(false);
                      loadCreditsData();
                      notifyCreditsUpdated();
                    } else {
                      const data = await res.json();
                      toast({
                        title: "升级失败",
                        description: data.error || "请稍后重试",
                        variant: "destructive",
                      });
                    }
                  } catch {
                    toast({
                      title: "升级失败",
                      description: "网络错误，请稍后重试",
                      variant: "destructive",
                    });
                  } finally {
                    setIsUpgrading(false);
                  }
                }
              }}
              disabled={!selectedPlan || selectedPlan === "enterprise" || isUpgrading}
            >
              {isUpgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认升级
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 联系销售弹窗 */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>联系销售</DialogTitle>
            <DialogDescription>
              扫描下方二维码添加企业微信，我们将为您提供专属服务
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {/* 微信二维码占位图 */}
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center">
                <QrCode className="h-16 w-16 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">微信二维码</p>
                <p className="text-xs text-muted-foreground">(请替换为实际二维码)</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                工作时间：周一至周五 9:00-18:00
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                或发送邮件至：<a href="mailto:sales@example.com" className="text-primary hover:underline">sales@example.com</a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
