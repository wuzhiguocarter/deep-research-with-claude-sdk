'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Maximize2, Minimize2, Download, FileText, File } from 'lucide-react'

interface ResultsViewerProps {
  result: string
  query?: string
}

export function ResultsViewer({ result, query }: ResultsViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
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
    if (!result) return

    const blob = new Blob([result], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-${query ? query.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-') : 'export'}-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [result, query])

  // 导出为PDF
  const exportPDF = useCallback(async () => {
    if (!contentRef.current || !result) return

    setIsExporting(true)

    try {
      // 动态导入html2pdf以避免SSR问题
      const html2pdfModule = await import('html2pdf.js')
      const html2pdf = html2pdfModule.default || html2pdfModule

      // 创建临时容器用于PDF生成
      const element = contentRef.current.cloneNode(true) as HTMLElement
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = '210mm'  // A4宽度
      tempContainer.style.padding = '20mm'
      tempContainer.style.backgroundColor = '#ffffff'
      tempContainer.style.color = '#000000'
      tempContainer.className = 'prose prose-sm max-w-none'
      tempContainer.innerHTML = element.innerHTML

      // 添加标题
      const title = document.createElement('h1')
      title.textContent = query || '研究报告'
      title.style.fontSize = '24px'
      title.style.fontWeight = 'bold'
      title.style.marginBottom = '20px'
      title.style.color = '#000000'
      tempContainer.insertBefore(title, tempContainer.firstChild)

      // 添加日期
      const date = document.createElement('p')
      date.textContent = `生成时间: ${new Date().toLocaleString('zh-CN')}`
      date.style.fontSize = '12px'
      date.style.color = '#666666'
      date.style.marginBottom = '20px'
      tempContainer.insertBefore(date, title.nextSibling)

      document.body.appendChild(tempContainer)

      // 配置PDF选项
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `research-${query ? query.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-') : 'export'}-${Date.now()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }

      // 生成PDF
      await html2pdf().set(opt).from(tempContainer).save()

      document.body.removeChild(tempContainer)
    } catch (error) {
      console.error('PDF导出失败:', error)
    } finally {
      setIsExporting(false)
    }
  }, [result, query])

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

  const formattedContent = useMemo(() => formatMarkdown(result), [result])

  return (
    <div
      ref={containerRef}
      className={isFullscreen
        ? 'fixed inset-0 z-50 bg-background p-4 flex flex-col'
        : ''
      }
    >
      <Card className={isFullscreen ? 'flex-1 flex flex-col h-full' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Research Results</span>
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
                onClick={toggleFullscreen}
                title={isFullscreen ? '退出全屏' : '全屏'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className={isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''}>
          <ScrollArea className={isFullscreen
            ? 'flex-1 w-full rounded-md border p-4 bg-background min-h-0'
            : 'h-[600px] w-full rounded-md border p-4'
          }>
            <div
              ref={contentRef}
              className="prose prose-sm max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-pink-600 prose-pre:bg-muted prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          </ScrollArea>
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
