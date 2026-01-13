'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ResultsViewerProps {
  result: string
  onDownload: () => void
}

export function ResultsViewer({ result, onDownload }: ResultsViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Research Results
          <Button variant="outline" size="sm" onClick={onDownload}>
            Download
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(result) }} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function formatMarkdown(text: string): string {
  // Basic markdown formatting
  let formatted = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br />')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>')

  return formatted
}
