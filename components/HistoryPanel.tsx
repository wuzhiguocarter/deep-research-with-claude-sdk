'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResearchSession } from '@/lib/research/types'

interface HistoryPanelProps {
  sessions: ResearchSession[]
  onLoadSession: (id: string) => void
  onDeleteSession: (id: string) => void
}

export function HistoryPanel({ sessions, onLoadSession, onDeleteSession }: HistoryPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'processing':
        return 'bg-blue-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No research sessions yet
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex gap-2 p-3 border rounded-lg transition-colors ${
                    session.status === 'completed'
                      ? 'hover:bg-muted/50 cursor-pointer'
                      : 'hover:bg-muted/30'
                  }`}
                  onClick={() => session.status === 'completed' && onLoadSession(session.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{session.query}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(session.status)} variant="secondary">
                        {session.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {session.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          onLoadSession(session.id)
                        }}
                      >
                        View
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSession(session.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
