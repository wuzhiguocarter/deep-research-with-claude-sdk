'use client'

import { useState, useEffect } from 'react'
import { ResearchForm } from '@/components/ResearchForm'
import { ResultsViewer } from '@/components/ResultsViewer'
import { StreamingCanvas } from '@/components/StreamingCanvas'
import { HistoryPanel } from '@/components/HistoryPanel'
import { ResearchType, ResearchSession } from '@/lib/research/types'

export default function ResearchPage() {
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null)
  const [history, setHistory] = useState<ResearchSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/history')
      const sessions = await response.json()
      console.log('[Frontend] Loaded history:', sessions.length, 'sessions')
      setHistory(sessions)
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const startResearch = async (query: string, type: ResearchType) => {
    setIsLoading(true)
    setIsStreaming(true)
    setCurrentSession(null)

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, type })
      })

      const { sessionId } = await response.json()
      
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
          loadHistory()
        }
      }, 3000)

    } catch (error) {
      console.error('Failed to start research:', error)
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const loadSession = async (id: string) => {
    try {
      console.log('[Frontend] Loading session:', id)
      const response = await fetch(`/api/history/${id}`)
      const session = await response.json()
      console.log('[Frontend] Session loaded:', session.status, 'hasResult:', !!session.result)
      setCurrentSession(session)
      setIsStreaming(false)
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  const deleteSession = async (id: string) => {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' })
      loadHistory()
      if (currentSession?.id === id) {
        setCurrentSession(null)
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Deep Research Assistant</h1>
        <p className="text-muted-foreground">
          AI-powered research with real-time streaming and automatic citations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ResearchForm onSubmit={startResearch} isLoading={isLoading} />

          {isStreaming ? (
            <StreamingCanvas 
              sessionId={currentSession?.id || null}
              isActive={isStreaming}
            />
          ) : currentSession?.result && currentSession.status === 'completed' ? (
            <ResultsViewer result={currentSession.result} onDownload={downloadResult} />
          ) : null}
        </div>

        <div>
          <HistoryPanel
            sessions={history}
            onLoadSession={loadSession}
            onDeleteSession={deleteSession}
          />
        </div>
      </div>
    </div>
  )
}
