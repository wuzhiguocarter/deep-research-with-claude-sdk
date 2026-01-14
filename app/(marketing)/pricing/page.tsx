"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, X, QrCode } from "lucide-react";
import { plans, creditPackages } from "@/config";

export default function PricingPage() {
  const [showContactDialog, setShowContactDialog] = useState(false);

  return (
    <div className="py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">简单透明的定价</h1>
          <p className="text-xl text-muted-foreground">
            选择适合您团队规模的方案
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto mb-20">
          {/* Free Plan */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>{plans.free.name}</CardTitle>
              <CardDescription>适合个人体验</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plans.free.priceDisplay}</span>
                <span className="text-muted-foreground">/{plans.free.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plans.free.featureList.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4 shrink-0" />
                  导出 Markdown
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4 shrink-0" />
                  优先支持
                </li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/signup">免费开始</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="border-primary relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge>推荐</Badge>
            </div>
            <CardHeader>
              <CardTitle>{plans.pro.name}</CardTitle>
              <CardDescription>适合中小团队</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plans.pro.priceDisplay}</span>
                <span className="text-muted-foreground">/{plans.pro.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plans.pro.featureList.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" asChild>
                <Link href="/dashboard/credits">立即订阅</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Enterprise Plan */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>{plans.enterprise.name}</CardTitle>
              <CardDescription>适合大型企业</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plans.enterprise.priceDisplay}</span>
                <span className="text-muted-foreground">/{plans.enterprise.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plans.enterprise.featureList.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setShowContactDialog(true)}
              >
                联系销售
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Credit Packages */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">积分加油包</h2>
            <p className="text-muted-foreground">
              积分不够用？随时补充！
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {creditPackages.map((pkg) => (
              <Card key={pkg.id} className="flex flex-col">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{pkg.credits}</CardTitle>
                  <CardDescription>积分</CardDescription>
                </CardHeader>
                <CardContent className="text-center flex-1">
                  <p className="text-sm min-h-[20px] mb-2">
                    {pkg.bonus > 0 ? (
                      <span className="text-green-600">+{pkg.bonus} 赠送</span>
                    ) : (
                      <span className="text-muted-foreground">标准套餐</span>
                    )}
                  </p>
                  <p className="text-xl font-bold">{pkg.priceDisplay}</p>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/signup">购买</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">常见问题</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">什么是积分？如何消耗？</h3>
              <p className="text-muted-foreground">
                积分是使用研究功能的计量单位。不同类型研究消耗不同积分：摘要研究 10 积分，深度分析 25 积分，对比研究 30 积分。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">免费版和专业版的区别是什么？</h3>
              <p className="text-muted-foreground">
                免费版仅支持摘要研究，适合体验产品。专业版支持全部研究类型（摘要、深度分析、对比研究），并享有更多月度积分和优先支持。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">支持哪些支付方式？</h3>
              <p className="text-muted-foreground">
                目前支持微信支付，企业客户可申请对公转账。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">积分会过期吗？</h3>
              <p className="text-muted-foreground">
                每月套餐赠送的积分当月有效。单独购买的积分包永不过期。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 联系销售弹窗 */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
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
