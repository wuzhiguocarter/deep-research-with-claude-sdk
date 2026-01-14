'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ResearchType } from '@/lib/research/types'
import { useToast } from '@/components/ui/toast'
import { plans, type PlanId } from '@/config'
import { Lock, Crown } from 'lucide-react'

interface ResearchFormProps {
  onSubmit: (query: string, type: ResearchType) => void
  isLoading: boolean
}

export function ResearchForm({ onSubmit, isLoading }: ResearchFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ResearchType>('summary')
  const [hasOrg, setHasOrg] = useState<boolean | null>(null)
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free')

  // 检查用户是否属于任何组织及当前套餐
  useEffect(() => {
    const checkOrganization = async () => {
      try {
        const res = await fetch('/api/credits/balance')
        const data = await res.json()
        setHasOrg(data.hasOrg ?? false)
        setCurrentPlan(data.plan || 'free')
      } catch {
        setHasOrg(false)
      }
    }
    checkOrganization()
  }, [])

  // 获取当前套餐允许的研究类型
  const allowedTypes = plans[currentPlan]?.features.researchTypes || ['summary']
  const isTypeAllowed = (researchType: string) => allowedTypes.includes(researchType)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 检查是否属于组织
    if (!hasOrg) {
      toast({
        title: "无法发起研究",
        description: "您当前不属于任何组织，请先创建或加入一个组织后再进行研究。",
        variant: "destructive",
      })
      router.push('/org/create')
      return
    }
    
    if (query.trim()) {
      onSubmit(query, type)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          发起新研究
          {currentPlan !== 'free' && (
            <Badge 
              variant="outline" 
              className={`ml-2 ${
                currentPlan === 'pro' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-amber-500 bg-amber-50 text-amber-700'
              }`}
            >
              <Crown className={`h-3 w-3 mr-1 ${
                currentPlan === 'pro' ? 'text-blue-500' : 'text-amber-500'
              }`} />
              {plans[currentPlan].name}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          输入研究问题，选择研究类型，AI 将自动为您完成研究
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">研究类型</label>
            <Select value={type} onValueChange={(value) => setType(value as ResearchType)}>
              <SelectTrigger className="h-auto py-[25px]">
                <SelectValue>
                  {type === 'summary' && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📝</span>
                      <div className="text-left">
                        <div className="font-medium">摘要研究</div>
                        <div className="text-xs text-muted-foreground">快速提取关键信息，生成简洁摘要</div>
                      </div>
                      <Badge variant="secondary" className="ml-auto">10 积分</Badge>
                    </div>
                  )}
                  {type === 'analysis' && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📊</span>
                      <div className="text-left">
                        <div className="font-medium">深度分析</div>
                        <div className="text-xs text-muted-foreground">全面深度分析，包含 SWOT 和功能矩阵</div>
                      </div>
                      <Badge variant="secondary" className="ml-auto">25 积分</Badge>
                    </div>
                  )}
                  {type === 'comparison' && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg">⚖️</span>
                      <div className="text-left">
                        <div className="font-medium">对比研究</div>
                        <div className="text-xs text-muted-foreground">多选项对比分析，优缺点详细列举</div>
                      </div>
                      <Badge variant="secondary" className="ml-auto">30 积分</Badge>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary" className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📝</span>
                    <div>
                      <div className="font-medium mb-0.5">摘要研究</div>
                      <div className="text-xs text-muted-foreground">
                        快速提取关键信息，生成简洁摘要
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-auto shrink-0">10 积分</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="analysis" disabled={!isTypeAllowed('analysis')} className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📊</span>
                    <div>
                      <div className="font-medium mb-0.5 flex items-center gap-1">
                        深度分析
                        {!isTypeAllowed('analysis') && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isTypeAllowed('analysis') 
                          ? '全面深度分析，包含 SWOT 和功能矩阵'
                          : '需要专业版或企业版套餐'}
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-auto shrink-0">25 积分</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="comparison" disabled={!isTypeAllowed('comparison')} className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⚖️</span>
                    <div>
                      <div className="font-medium mb-0.5 flex items-center gap-1">
                        对比研究
                        {!isTypeAllowed('comparison') && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isTypeAllowed('comparison') 
                          ? '多选项对比分析，优缺点详细列举'
                          : '需要专业版或企业版套餐'}
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-auto shrink-0">30 积分</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {currentPlan === 'free' && (
              <p className="text-xs text-muted-foreground mt-2">
                当前为免费套餐，仅支持摘要研究。
                <Link href="/pricing" className="text-primary hover:underline ml-1">
                  升级套餐
                </Link>
                解锁更多研究类型。
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">研究问题</label>
            <Textarea
              placeholder="输入您想要研究的问题... (例如：'比较 React 和 Vue 在企业应用中的优缺点')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={!query.trim() || isLoading} className="w-full">
            {isLoading ? '研究中...' : '开始研究'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
