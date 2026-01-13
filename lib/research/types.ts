export type ResearchType = 'comparison' | 'analysis' | 'summary'

export interface ResearchRequest {
  query: string
  type: ResearchType
}

export interface ResearchSession {
  id: string
  query: string
  type: ResearchType
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: string
  sources?: string
  createdAt: Date
  updatedAt: Date
}

export interface ResearchProgress {
  sessionId: string
  status: string
  step: string
  progress: number
  result?: string
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  publishedDate?: string
}
