'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResearchType } from '@/lib/research/types'

interface ResearchFormProps {
  onSubmit: (query: string, type: ResearchType) => void
  isLoading: boolean
}

export function ResearchForm({ onSubmit, isLoading }: ResearchFormProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ResearchType>('summary')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSubmit(query, type)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start New Research</CardTitle>
        <CardDescription>
          Enter your research query and select the type of analysis you need
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Research Type</label>
            <Select value={type} onValueChange={(value) => setType(value as ResearchType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comparison">
                  <div>
                    <div className="font-medium">Comparison</div>
                    <div className="text-xs text-muted-foreground">
                      Compare multiple options with pros/cons
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="analysis">
                  <div>
                    <div className="font-medium">Analysis</div>
                    <div className="text-xs text-muted-foreground">
                      Deep dive with feature matrix and SWOT
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="summary">
                  <div>
                    <div className="font-medium">Summary</div>
                    <div className="text-xs text-muted-foreground">
                      Aggregate and summarize key points
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Research Query</label>
            <Textarea
              placeholder="Enter your research question here... (e.g., 'Compare React and Vue for enterprise applications')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={!query.trim() || isLoading} className="w-full">
            {isLoading ? 'Researching...' : 'Start Research'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
