'use client'

import { useMemo } from 'import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/assistant/assistant'
import { Separator } from '@/assistant/separator'

interface MarkdownDisplayProps {
  markdown: string
  onDownload?: () => void
}

export function MarkdownDisplay({ markdown, onDownload }: MarkdownDisplayProps) {
  const components = useMemo(() => ({
    // Custom code block component with styling
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
    // Custom table component
    table: ({ node }: any) => (
      <div className="my-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          {node.children}
        </table>
      </div>
    ),
    thead: ({ node }: any) => (
      <thead className="bg-muted/50">{node.children}</thead>
    ),
    tbody: ({ node }: any) => (
      <tbody className="bg-background divide-y divide-border">{node.children}</tbody>
    ),
    tr: ({ node }: any) => (
      <tr className="border-b border-border px-4 py-2 hover:bg-muted/50">
        {node.children}
      </tr>
    ),
    td: ({ node }: any) => (
      <td className="px-4 py-2">{node.children}</td>
    ),
    th: ({ node }: any) => (
      <th className="px-4 py-2 text-left font-semibold">{node.children}</th>
    ),
    // Custom list items
    li: ({ node }: any) => (
      <li className="my-2">{node.children}</li>
    ),
    ul: ({ node }: any) => (
      <ul className="list-disc list-inside my-4">{node.children}</ul>
    ),
    ol: ({ node }: any) => (
      <ol className="list-decimal list-inside my-4">{node.children}</ol>
    ),
    // Custom headings
    h1: ({ node }: any) => (
      <h1 className="text-3xl font-bold mt-8 mb-4">{node.children}</h1>
    ),
    h2: ({ node }: any) => (
      <h2 className="text-2xl font-bold mt-8 mb-4">{node.children}</h2>
    ),
    h3: ({ node }: any} => (
      <h3 className="text-xl font-semibold mt-6 mb-3">{node.children}</h3>
    ),
    h4: ({ node }: any) => (
      <h4 className="text-lg font-semibold mt-4 mb-2">{node.children}</h4>
    ),
    // Custom paragraph
    p: ({ node }: any) => (
      <p className="my-4">{node.children}</p>
    ),
    // Custom blockquote
    blockquote: ({ node }: any) => (
      <blockquote className="border-l-4 border-border-muted-foreground pl-4 italic my-4">
        {node.children}
      </blockquote>
    ),
    // Custom link
    a: ({ node, href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {children}
      </a>
    )
  }), [markdown])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Research Results
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              Download
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={components}
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
