'use client'

import { useState, useEffect } from 'react'
import { ResultsViewer } from '@/components/ResultsViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/toast'
import { History, Loader2, Trash2, Eye, Download, FileText } from 'lucide-react'
import { researchTypeNames, hasPermission, type OrgRole } from '@/config'

interface ResearchSession {
  id: string
  query: string
  type: string
  status: string
  result: string | null
  creditsUsed: number
  createdAt: string
  userId: string
  user?: {
    id: string
    name: string | null
    email: string
  }
}

interface OrgInfo {
  role: OrgRole
  currentUserId: string
}

export default function HistoryPage() {
  const { toast } = useToast()
  const [sessions, setSessions] = useState<ResearchSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ResearchSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null)

  // 删除确认弹窗状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 并行加载历史记录和组织信息
      const [historyRes, orgRes] = await Promise.all([
        fetch('/api/history'),
        fetch('/api/credits/balance'), // 这个 API 返回用户角色
      ])
      
      const historyData = await historyRes.json()
      const orgData = await orgRes.json()
      
      setSessions(Array.isArray(historyData) ? historyData : [])
      
      if (orgData.hasOrg) {
        setOrgInfo({
          role: orgData.role as OrgRole,
          currentUserId: orgData.userId,
        })
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSession = async (id: string) => {
    try {
      const response = await fetch(`/api/history/${id}`)
      const session = await response.json()
      setSelectedSession(session)
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  // 打开删除确认弹窗
  const openDeleteDialog = (id: string) => {
    setSessionToDelete(id)
    setDeleteDialogOpen(true)
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!sessionToDelete) return
    
    try {
      const res = await fetch(`/api/history/${sessionToDelete}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast({
          title: '删除失败',
          description: data.error || '删除研究记录失败',
          variant: 'destructive',
        })
        return
      }
      
      toast({
        title: '删除成功',
        description: '研究记录已删除',
        variant: 'success',
      })
      
      loadData()
      if (selectedSession?.id === sessionToDelete) {
        setSelectedSession(null)
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
      toast({
        title: '删除失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      })
    }
  }

  // 检查是否可以删除某条研究记录
  const canDeleteSession = (session: ResearchSession): boolean => {
    if (!orgInfo) return false
    
    // owner 可以删除所有
    if (hasPermission(orgInfo.role, 'research:delete_all')) {
      return true
    }
    
    // admin/member 只能删除自己的
    if (hasPermission(orgInfo.role, 'research:delete_own')) {
      return session.userId === orgInfo.currentUserId
    }
    
    return false
  }

  const downloadResult = () => {
    if (!selectedSession?.result) return

    const blob = new Blob([selectedSession.result], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-${selectedSession.id}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">已完成</Badge>
      case 'processing':
        return <Badge variant="secondary">进行中</Badge>
      case 'failed':
        return <Badge variant="destructive">失败</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">研究历史</h1>
        <p className="text-muted-foreground">
          查看团队所有的研究记录
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 历史列表 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                研究记录 ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sessions.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>暂无研究记录</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="divide-y">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                          selectedSession?.id === session.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => loadSession(session.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{session.query}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {researchTypeNames[session.type as keyof typeof researchTypeNames] || session.type}
                              </span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">
                                {session.creditsUsed} 积分
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(session.status)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(session.createdAt).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                            {session.user && (
                              <p className="text-xs text-muted-foreground mt-1">
                                由 {session.user.name || session.user.email} 创建
                              </p>
                            )}
                          </div>
                          {canDeleteSession(session) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                                openDeleteDialog(session.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 研究详情 */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <div className="space-y-4">
              {selectedSession.result && selectedSession.status === 'completed' ? (
                <ResultsViewer 
                  result={selectedSession.result} 
                  onDownload={downloadResult} 
                />
              ) : selectedSession.status === 'failed' ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-red-500">研究失败</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedSession.result || '未知错误'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-4">研究进行中...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-24 text-center">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mt-4">
                  选择左侧的研究记录查看详情
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条研究记录吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
