'use client'

import { useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  headings: Heading[]
  activeId: string
  onHeadingClick: (id: string) => void
}

export function TableOfContents({ headings, activeId, onHeadingClick }: TableOfContentsProps) {
  // 过滤出1-3级标题
  const filteredHeadings = useMemo(() => {
    return headings.filter(h => h.level >= 1 && h.level <= 3)
  }, [headings])

  if (filteredHeadings.length === 0) {
    return null
  }

  return (
    <div className="w-64 border-l pl-6 shrink-0">
      <div className="sticky top-0">
        <h3 className="text-sm font-semibold mb-4 px-2">目录</h3>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="space-y-1">
            {filteredHeadings.map((heading) => (
              <Button
                key={heading.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left transition-all duration-200 hover:bg-accent/50 dark:hover:bg-accent/50",
                  heading.level === 1 && "font-semibold",
                  heading.level === 2 && "pl-4 text-sm",
                  heading.level === 3 && "pl-8 text-xs text-muted-foreground",
                  activeId === heading.id && "bg-primary/10 text-primary font-semibold border-l-2 border-primary dark:bg-primary/20"
                )}
                onClick={() => onHeadingClick(heading.id)}
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 mr-1 shrink-0 transition-all duration-200",
                    activeId === heading.id ? "opacity-100 text-primary" : "opacity-0"
                  )}
                />
                <span className="truncate">{heading.text}</span>
              </Button>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </div>
  )
}

/**
 * 从 Markdown 内容中提取标题
 */
export function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = []
  const regex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi
  let match

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const id = match[2]
    const text = match[3].replace(/<[^>]*>/g, '') // 移除HTML标签

    headings.push({ id, text, level })
  }

  return headings
}

/**
 * 为标题添加 ID（如果没有）
 */
export function addHeadingIds(html: string): string {
  let idCounter = 0
  const idMap = new Map<string, number>()

  return html.replace(/<h([1-6])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, text) => {
    // 检查是否已有 id
    const idMatch = attrs.match(/id="([^"]*)"/)
    if (idMatch) {
      return match
    }

    // 生成唯一 ID
    const plainText = text.replace(/<[^>]*>/g, '')
    const baseId = plainText
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const existingCount = idMap.get(baseId) || 0
    idMap.set(baseId, existingCount + 1)
    const uniqueId = existingCount > 0 ? `${baseId}-${existingCount}` : baseId

    return `<h${level}${attrs} id="${uniqueId}">${text}</h${level}>`
  })
}
