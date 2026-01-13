import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-8">
      <div className="max-w-3xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Deep Research Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered research with Claude Agent SDK and web search capabilities.
            Get comprehensive reports with automatic citations for any topic.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 pt-8">
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-semibold mb-2">Comparison</h3>
            <p className="text-sm text-muted-foreground">
              Compare products, technologies, or approaches with detailed pros and cons
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold mb-2">Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Deep dive into topics with feature matrices, SWOT analysis, and insights
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-sm text-muted-foreground">
              Aggregate multiple sources and extract key points with timelines
            </p>
          </div>
        </div>

        <div className="pt-8">
          <Button asChild size="lg">
            <Link href="/research">
              Start Researching →
            </Link>
          </Button>
        </div>

        <div className="pt-12 text-sm text-muted-foreground">
          <p>Powered by Claude Agent SDK & Web Search</p>
        </div>
      </div>
    </div>
  )
}
