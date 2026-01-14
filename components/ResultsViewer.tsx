'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMemo } from 'react'

interface ResultsViewerProps {
  result: string
  onDownload: () => void
}

export function ResultsViewer({ result, onDownload }: ResultsViewerProps) {
  const formattedContent = useMemo(() => formatMarkdown(result), [result])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          研究结果
          <Button variant="outline" size="sm" onClick={onDownload}>
            导出 Markdown
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
          <div 
            className="prose prose-sm max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-pink-600 prose-pre:bg-muted prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        </ScrollArea>
      </CardContent>
    </Card>
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
