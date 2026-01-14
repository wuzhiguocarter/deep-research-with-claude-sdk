'use client'

import { useState, useEffect } from 'react'
import { ResearchForm } from '@/components/ResearchForm'
import { ResultsViewer } from '@/components/ResultsViewer'
import { StreamingCanvas } from '@/components/StreamingCanvas'
import { ResearchType, ResearchSession } from '@/lib/research/types'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { notifyCreditsUpdated } from '@/lib/credits-event'

export default function ResearchPage() {
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null)

  const startResearch = async (query: string, type: ResearchType) => {
    setIsLoading(true)
    setIsStreaming(true)
    setCurrentSession(null)
    setError(null)
    setCreditsUsed(null)

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, type })
      })

      const data = await response.json()

      if (!response.ok) {
        // 处理错误
        if (response.status === 402) {
          // 积分不足
          setError(`积分不足：需要 ${data.required} 积分，当前余额 ${data.balance} 积分`)
        } else if (response.status === 401) {
          setError('请先登录')
        } else {
          setError(data.error || '发起研究失败')
        }
        setIsLoading(false)
        setIsStreaming(false)
        return
      }

      const { sessionId, creditsUsed: used } = data
      setCreditsUsed(used)
      
      // Set current session ID for streaming
      setCurrentSession({ id: sessionId, query, type } as any)
      
      // Monitor completion via polling status
      const pollInterval = setInterval(async () => {
        const sessionResponse = await fetch(`/api/research/${sessionId}`)
        const session = await sessionResponse.json()

        if (session.status === 'completed' || session.status === 'failed') {
          clearInterval(pollInterval)
          setIsLoading(false)
          setIsStreaming(false)
          setCurrentSession(session)
          // 研究完成后通知积分更新
          notifyCreditsUpdated()
        }
      }, 3000)

    } catch (err) {
      console.error('Failed to start research:', err)
      setError('网络错误，请稍后重试')
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const downloadResult = () => {
    if (!currentSession?.result) return

    const blob = new Blob([currentSession.result], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-${currentSession.id}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">发起研究</h1>
        <p className="text-muted-foreground">
          使用 AI 进行深度研究，自动搜索并生成带引用的报告
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 积分消耗提示 */}
      {creditsUsed && isStreaming && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <p className="text-blue-700">
              本次研究已消耗 {creditsUsed} 积分，正在进行中...
            </p>
          </CardContent>
        </Card>
      )}

      {/* 研究表单 */}
      <ResearchForm onSubmit={startResearch} isLoading={isLoading} />

      {/* 研究进度或结果 */}
      {isStreaming ? (
        <StreamingCanvas 
          sessionId={currentSession?.id || null}
          isActive={isStreaming}
        />
      ) : currentSession?.result && currentSession.status === 'completed' ? (
        <ResultsViewer result={currentSession.result} onDownload={downloadResult} />
      ) : null}
    </div>
  )
}
