'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Maximize2, Minimize2, Download, FileText, File, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { copyShareLink } from '@/lib/share'
import { TableOfContents, extractHeadings, addHeadingIds, type Heading } from '@/components/TableOfContents'

interface StreamingCanvasProps {
  sessionId: string | null
  isActive: boolean
}

interface StreamEvent {
  type: 'progress' | 'done' | 'error'
  status: string
  query?: string
  result?: string
  hasResult?: boolean
  error?: string
}

export function StreamingCanvas({ sessionId, isActive }: StreamingCanvasProps) {
  const [content, setContent] = useState('')
  const [step, setStep] = useState('')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [activeHeading, setActiveHeading] = useState<string>('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // 进入全屏
  const enterFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen()
      } else if ((containerRef.current as any).mozRequestFullScreen) {
        (containerRef.current as any).mozRequestFullScreen()
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen()
      }
    }
  }, [])

  // 退出全屏
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen()
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen()
    }
  }, [])

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  // 导出为Markdown
  const exportMarkdown = useCallback(() => {
    if (!content) return

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-${sessionId || 'live'}-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [content, sessionId])

  // 导出为PDF
  const exportPDF = useCallback(async () => {
    if (!content) return

    setIsExporting(true)

    try {
      // 动态导入 @react-pdf/renderer
      const { pdf } = await import('@react-pdf/renderer')
      const { ResearchPDF } = await import('@/components/ResearchPDF')

      // 创建 PDF 文档
      const pdfDoc = pdf(
        <ResearchPDF
          title="实时研究画布"
          content={content}
          date={new Date().toLocaleString('zh-CN')}
        />
      )

      // 生成 Blob
      const blob = await pdfDoc.toBlob()

      // 下载 PDF
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `research-${sessionId || 'live'}-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF导出失败:', error)
    } finally {
      setIsExporting(false)
    }
  }, [content, sessionId])

  // 分享研究报告
  const handleShare = useCallback(async () => {
    if (!sessionId) return

    const success = await copyShareLink(sessionId)

    if (success) {
      toast.success('分享链接已复制到剪贴板', {
        description: '您现在可以分享这个研究报告了'
      })
    } else {
      toast.error('复制失败，请重试')
    }
  }, [sessionId])

  // 格式化内容并提取标题
  const formattedContent = useMemo(() => {
    if (!content) return { html: '', headings: [] }

    const html = formatContent(content)
    const htmlWithIds = addHeadingIds(html)
    const headings = extractHeadings(htmlWithIds)

    return { html: htmlWithIds, headings }
  }, [content])

  // 全屏模式下的滚动监听 - 更新当前激活的标题
  useEffect(() => {
    if (!isFullscreen) return

    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
    if (!scrollContainer || formattedContent.headings.length === 0) return

    // 使用 IntersectionObserver 更精确地检测可见标题
    const observerOptions = {
      root: scrollContainer,
      rootMargin: '-100px 0px -70% 0px',
      threshold: 0
    }

    const observer = new IntersectionObserver((entries) => {
      const intersectingHeadings = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => entry.target.id)

      if (intersectingHeadings.length > 0) {
        const activeId = intersectingHeadings[intersectingHeadings.length - 1]
        setActiveHeading(activeId)
      }
    }, observerOptions)

    const headingElements = formattedContent.headings
      .map(h => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[]

    headingElements.forEach(element => {
      observer.observe(element)
    })

    if (headingElements.length > 0) {
      setActiveHeading(formattedContent.headings[0].id)
    }

    return () => {
      observer.disconnect()
    }
  }, [isFullscreen, formattedContent.headings])

  // 点击目录项滚动到对应位置
  const handleHeadingClick = useCallback((headingId: string) => {
    const element = document.getElementById(headingId)
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement

    if (element && scrollContainer) {
      const elementTop = element.offsetTop - (scrollRef.current?.offsetTop || 0)

      scrollContainer.scrollTo({
        top: elementTop - 100,
        behavior: 'smooth'
      })

      setActiveHeading(headingId)
    }
  }, [])

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (!sessionId || !isActive) {
      return
    }

    setIsConnected(true)
    setContent('')
    setStep('准备开始...')
    setProgress(0)
    setStatus('processing')

    const eventSource = new EventSource(`/api/research/${sessionId}/stream`)

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data)

        if (data.type === 'progress') {
          setStatus(data.status)
          setStep(data.status === 'processing' ? '研究中...' : data.status)

          if (data.result && data.result !== content) {
            setContent(data.result)
            // Auto-scroll to bottom
            setTimeout(() => {
              if (scrollRef.current) {
                const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
                if (viewport) {
                  viewport.scrollTop = viewport.scrollHeight
                }
              }
            }, 100)
          }

          if (data.hasResult) {
            setProgress(Math.min(100, progress + 10))
          }
        } else if (data.type === 'done') {
          setStatus(data.status)
          setIsConnected(false)
          eventSource.close()

          if (data.status === 'completed') {
            setStep('✅ 研究完成！')
            setProgress(100)
          } else {
            setStep('❌ 研究失败')
            setProgress(0)
          }
        } else if (data.error) {
          setStatus('failed')
          setStep(`❌ 错误: ${data.error}`)
          setIsConnected(false)
          eventSource.close()
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error)
      setIsConnected(false)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [sessionId, isActive])

  if (!isActive) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">启动研究任务后，此处将实时显示生成过程</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      ref={containerRef}
      className={isFullscreen
        ? 'fixed inset-0 z-50 bg-background p-4 flex flex-col'
        : ''
      }
    >
      <Card className={isFullscreen ? 'flex-1 flex flex-col h-full overflow-hidden' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>📝 实时研究画布</span>
              {isConnected && (
                <Badge variant="secondary" className="animate-pulse">
                  实时更新中
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{step}</span>
              <Badge variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}>
                {Math.round(progress)}%
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isExporting || !content}>
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? '导出中...' : '导出'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportMarkdown} disabled={!content}>
                    <FileText className="h-4 w-4 mr-2" />
                    导出为 Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPDF} disabled={isExporting || !content}>
                    <File className="h-4 w-4 mr-2" />
                    导出为 PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                disabled={!sessionId}
                title="复制分享链接"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="ml-2"
                title={isFullscreen ? '退出全屏' : '全屏'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className={isFullscreen ? 'flex-1 flex flex-col min-h-0 p-0' : ''}>
          <div className="relative flex-1 flex flex-col min-h-0">
            {/* Progress bar */}
            <div className="w-full bg-secondary rounded-full h-2 mb-4 flex-shrink-0">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Content area with TOC in fullscreen */}
            <div className={isFullscreen ? 'flex-1 flex overflow-hidden' : ''}>
              <ScrollArea className={isFullscreen
                ? 'flex-1 w-full rounded-md border p-4 bg-background min-h-0'
                : 'h-[500px] w-full rounded-md border p-4 bg-background'
              }>
                <div ref={scrollRef}>
                  <div
                    ref={contentRef}
                    className="prose prose-sm max-w-none prose-headings:scroll-mt-24"
                    dangerouslySetInnerHTML={{ __html: formattedContent.html }}
                  />
                </div>

                {/* Cursor effect when streaming */}
                {isConnected && content && (
                  <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1" />
                )}
              </ScrollArea>

              {/* TOC in fullscreen mode */}
              {isFullscreen && formattedContent.headings.length > 0 && (
                <TableOfContents
                  headings={formattedContent.headings}
                  activeId={activeHeading}
                  onHeadingClick={handleHeadingClick}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatContent(text: string): string {
  if (!text) return ''

  let formatted = text

  // Escape HTML
  formatted = formatted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Code blocks
  formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm">$2</code></pre>')

  // Inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')

  // Headers
  formatted = formatted.replace(/^#### (.*$)/gim, '<h4 class="text-lg font-semibold mt-6 mb-3">$1</h4>')
  formatted = formatted.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
  formatted = formatted.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
  formatted = formatted.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')

  // Bold and Italic
  formatted = formatted.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Tables
  const lines = formatted.split('\n')
  let inTable = false
  let tableRows: string[] = []

  const processedLines = lines.map(line => {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').filter(cell => cell.trim() !== '')
      const isHeader = cells.every(cell => cell.trim().match(/^:.+:\*$/)) || line.includes('---')

      if (!inTable) {
        inTable = true
        const headerCells = cells.map(cell => cell.trim().replace(/^:+|:+$/g, ''))
        tableRows = [`<table class="w-full border-collapse my-4"><thead><tr>${headerCells.map(c => `<th class="border border-border px-4 py-2 text-left font-semibold">${c}</th>`).join('')}</tr></thead><tbody>`]
        return ''
      }

      if (isHeader) {
        return ''
      }

      const dataCells = cells.map(cell => cell.trim())
      tableRows.push(`<tr>${dataCells.map(c => `<td class="border border-border px-4 py-2">${c}</td>`).join('')}</tr>`)
      return ''
    } else {
      if (inTable) {
        inTable = false
        const tableContent = tableRows.join('') + '</tbody></table>'
        tableRows = []
        return tableContent + '\n' + line
      }
      return line
    }
  })

  formatted = processedLines.join('\n')

  // Lists
  formatted = formatted.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li class="ml-4">$1</li>')
  formatted = formatted.replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc list-inside my-2">$&</ul>')
  formatted = formatted.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li class="ml-4">$1</li>')
  formatted = formatted.replace(/(<li.*<\/li>\n?)+/g, '<ol class="list-decimal list-inside my-2">$&</ol>')

  // Line breaks
  formatted = formatted.replace(/\n\n+/g, '</p><p class="my-4">')
  formatted = '<p class="my-4">' + formatted + '</p>'

  // Links
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')

  return formatted
}
