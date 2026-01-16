'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, File, Share2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { copyShareLink } from '@/lib/share'
import { TableOfContents, extractHeadings, addHeadingIds, type Heading } from '@/components/TableOfContents'

interface SharedReportViewerProps {
  sessionId: string
}

export function SharedReportViewer({ sessionId }: SharedReportViewerProps) {
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeHeading, setActiveHeading] = useState<string>('')

  const contentRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // 加载分享的研究报告
  useEffect(() => {
    const loadSharedSession = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/history/${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '研究报告不存在')
        }

        if (data.status !== 'completed') {
          throw new Error('该研究报告尚未完成')
        }

        setSession(data)
      } catch (err: any) {
        setError(err.message)
        toast.error('加载失败', {
          description: err.message
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSharedSession()
  }, [sessionId])

  // 格式化 Markdown 并提取标题
  const formattedContent = useMemo(() => {
    if (!session?.result) return { html: '', headings: [] }

    const html = formatMarkdown(session.result)
    const htmlWithIds = addHeadingIds(html)
    const headings = extractHeadings(htmlWithIds)

    return { html: htmlWithIds, headings }
  }, [session])

  // 滚动监听 - 更新当前激活的标题
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current
    if (!scrollContainer || formattedContent.headings.length === 0) return

    // 使用 IntersectionObserver 更精确地检测可见标题
    const observerOptions = {
      root: scrollContainer,
      rootMargin: '-100px 0px -70% 0px', // 顶部偏移100px，底部留30%空间
      threshold: 0
    }

    const observer = new IntersectionObserver((entries) => {
      // 找到所有相交的标题
      const intersectingHeadings = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => entry.target.id)

      if (intersectingHeadings.length > 0) {
        // 使用最后一个相交的标题（最靠下的那个）
        const activeId = intersectingHeadings[intersectingHeadings.length - 1]
        setActiveHeading(activeId)
      }
    }, observerOptions)

    // 观察所有标题元素
    const headingElements = formattedContent.headings
      .map(h => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[]

    headingElements.forEach(element => {
      observer.observe(element)
    })

    // 初始化时设置第一个标题为激活状态
    if (headingElements.length > 0) {
      setActiveHeading(formattedContent.headings[0].id)
    }

    return () => {
      observer.disconnect()
    }
  }, [formattedContent.headings])

  // 点击目录项滚动到对应位置
  const handleHeadingClick = useCallback((headingId: string) => {
    const element = document.getElementById(headingId)
    const scrollContainer = scrollAreaRef.current

    if (element && scrollContainer) {
      // 计算元素相对于滚动容器的位置
      const elementTop = element.offsetTop - scrollContainer.offsetTop

      scrollContainer.scrollTo({
        top: elementTop - 100, // 留出一些顶部空间
        behavior: 'smooth'
      })

      setActiveHeading(headingId)
    }
  }, [])

  // 导出为Markdown
  const exportMarkdown = useCallback(() => {
    if (!session?.result) return

    const blob = new Blob([session.result], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-${session.query ? session.query.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-') : 'shared'}-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('导出成功', {
      description: 'Markdown 文件已下载'
    })
  }, [session])

  // 导出为PDF
  const exportPDF = useCallback(async () => {
    if (!contentRef.current || !session?.result) return

    setIsExporting(true)

    try {
      const element = contentRef.current.cloneNode(true) as HTMLElement
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = '210mm'
      tempContainer.style.padding = '20mm'
      tempContainer.style.backgroundColor = '#ffffff'
      tempContainer.style.color = '#000000'
      tempContainer.className = 'prose prose-sm max-w-none'
      tempContainer.innerHTML = element.innerHTML

      const title = document.createElement('h1')
      title.textContent = session.query || '研究报告'
      title.style.fontSize = '24px'
      title.style.fontWeight = 'bold'
      title.style.marginBottom = '20px'
      title.style.color = '#000000'
      tempContainer.insertBefore(title, tempContainer.firstChild)

      const date = document.createElement('p')
      date.textContent = `生成时间: ${new Date(session.createdAt).toLocaleString('zh-CN')}`
      date.style.fontSize = '12px'
      date.style.color = '#666666'
      date.style.marginBottom = '20px'
      tempContainer.insertBefore(date, title.nextSibling)

      document.body.appendChild(tempContainer)

      // 使用 html2canvas 将 DOM 转换为 canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      // 计算分页
      const imgWidth = 210 // A4 宽度 (mm)
      const pageHeight = 297 // A4 高度 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      // 创建 PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      let position = 0

      // 添加第一页
      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // 添加后续页面
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const filename = `research-${session.query ? session.query.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-') : 'shared'}-${Date.now()}.pdf`
      pdf.save(filename)

      document.body.removeChild(tempContainer)

      toast.success('导出成功', {
        description: 'PDF 文件已下载'
      })
    } catch (error) {
      console.error('PDF导出失败:', error)
      toast.error('导出失败', {
        description: 'PDF 生成出错，请重试'
      })
    } finally {
      setIsExporting(false)
    }
  }, [session])

  // 分享链接
  const handleShare = useCallback(async () => {
    const success = await copyShareLink(sessionId)

    if (success) {
      toast.success('分享链接已复制到剪贴板', {
        description: '您现在可以分享这个研究报告了'
      })
    } else {
      toast.error('复制失败，请重试')
    }
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">加载中...</p>
                <p className="text-sm text-muted-foreground mt-1">正在获取研究报告</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-4">😕</div>
              <h3 className="text-lg font-semibold mb-2">无法加载研究报告</h3>
              <p className="text-muted-foreground mb-4">{error || '研究报告不存在'}</p>
              <Button onClick={() => window.location.href = '/research'}>
                返回研究页面
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col h-screen">
      <Card className="flex-1 flex flex-col h-full m-0 rounded-none border-0 overflow-hidden">
        <CardHeader className="border-b px-6 py-4 shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{session.query}</h1>
              <Badge variant="secondary">分享报告</Badge>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? '导出中...' : '导出'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportMarkdown}>
                    <FileText className="h-4 w-4 mr-2" />
                    导出为 Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPDF} disabled={isExporting}>
                    <File className="h-4 w-4 mr-2" />
                    导出为 PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                title="复制分享链接"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/research'}
              >
                开始新研究
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 flex">
          {/* 正文内容区域 */}
          <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
            <div className="p-8 max-w-5xl mx-auto">
              <div
                ref={contentRef}
                className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-pink-600 prose-pre:bg-muted prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground"
                dangerouslySetInnerHTML={{ __html: formattedContent.html }}
              />
            </div>
          </div>

          {/* 右侧目录 */}
          {formattedContent.headings.length > 0 && (
            <TableOfContents
              headings={formattedContent.headings}
              activeId={activeHeading}
              onHeadingClick={handleHeadingClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatMarkdown(text: string): string {
  if (!text) return ''

  let formatted = text

  // Escape HTML tags first
  formatted = formatted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Code blocks (must be before other processing)
  formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="bg-muted p-4 rounded-lg overflow-x-auto"><code class="text-sm">${code}</code></pre>`
  })

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
    // Check if table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').filter(cell => cell.trim() !== '')
      const isHeader = cells.every(cell => cell.trim().match(/^:.+:\*$/) || line.includes('---'))

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

  // Blockquotes
  formatted = formatted.replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-muted-foreground pl-4 italic my-4">$1</blockquote>')

  // Horizontal rules
  formatted = formatted.replace(/^---+$/gm, '<hr class="my-4 border-border">')

  // Line breaks and paragraphs
  formatted = formatted.replace(/\n\n+/g, '</p><p class="my-4">')
  formatted = '<p class="my-4">' + formatted + '</p>'

  // Links
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')

  return formatted
}
