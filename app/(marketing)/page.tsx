import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  FileText, 
  Users, 
  Coins, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            AI 驱动的
            <span className="text-primary"> 企业级深度研究 </span>
            助手
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            让您的团队在几分钟内完成专业的市场调研、竞品分析。
            自动搜索、智能分析、自动生成带引用的专业报告。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                免费开始
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">查看定价</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            新用户注册即送 500 积分，无需信用卡
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">核心功能</h2>
            <p className="text-muted-foreground">
              为企业研究团队打造的专业工具
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-primary mb-2" />
                <CardTitle>智能搜索</CardTitle>
                <CardDescription>
                  AI 自动搜索全网信息，汇总最相关的内容
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>专业报告</CardTitle>
                <CardDescription>
                  自动生成带引用的 Markdown 报告，支持导出
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>团队协作</CardTitle>
                <CardDescription>
                  多人共享研究成果，团队成员实时查看历史
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Coins className="h-10 w-10 text-primary mb-2" />
                <CardTitle>灵活计费</CardTitle>
                <CardDescription>
                  积分制按量付费，不浪费一分钱
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>数据安全</CardTitle>
                <CardDescription>
                  企业级数据隔离，研究内容完全保密
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>实时进度</CardTitle>
                <CardDescription>
                  研究过程实时展示，随时掌握进度
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">使用流程</h2>
            <p className="text-muted-foreground">
              三步即可获得专业研究报告
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">输入研究问题</h3>
              <p className="text-sm text-muted-foreground">
                描述您想要研究的内容，选择研究类型
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">AI 自动研究</h3>
              <p className="text-sm text-muted-foreground">
                AI 自动搜索、阅读、分析相关信息
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">获取专业报告</h3>
              <p className="text-sm text-muted-foreground">
                获得带引用的专业报告，支持下载分享
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Research Types */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">研究类型</h2>
            <p className="text-muted-foreground">
              三种研究模式满足不同需求
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>📝 摘要研究</CardTitle>
                <CardDescription>10 积分</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    快速提取关键信息
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    生成简洁摘要
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    适合快速了解主题
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle>📊 深度分析</CardTitle>
                <CardDescription>25 积分</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    全面深度分析
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    SWOT 分析矩阵
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    功能特性对比
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>⚖️ 对比研究</CardTitle>
                <CardDescription>30 积分</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    多选项对比分析
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    优缺点详细列举
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    推荐决策建议
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">
            立即开始，让 AI 助力您的研究工作
          </h2>
          <p className="text-lg opacity-90 mb-8">
            新用户注册即送 500 积分，可完成约 20 次摘要研究
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">
              免费注册
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
