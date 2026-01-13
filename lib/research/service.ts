import { query } from '@anthropic-ai/claude-agent-sdk'
import { getResearchPrompt } from './prompts'
import { ResearchType } from './types'

export class ResearchService {
  private sessionId: string

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  async *conductResearch(queryStr: string, type: ResearchType) {
    const researchPrompt = getResearchPrompt(queryStr, type)

    try {
      let fullResult = ''
      let step = 'Initializing...'
      let progress = 0

      for await (const message of query({
        prompt: researchPrompt,
        options: {
          allowedTools: ['WebSearch', 'WebFetch', 'Read', 'Write'],
          permissionMode: 'bypassPermissions'
        }
      })) {
        // Update progress based on message type
        if (message.type === 'system') {
          step = 'Initializing Claude Agent...'
          progress = 5
        } else if (message.type === 'assistant') {
          const content = message.message.content
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'text') {
                const newText = block.text
                fullResult += newText
                
                // Update step based on content
                if (newText.includes('Searching') || newText.includes('search')) {
                  step = '🔍 Searching the web...'
                  progress = 20
                } else if (newText.includes('Reading') || newText.includes('analyzing')) {
                  step = '📖 Reading and analyzing sources...'
                  progress = 40
                } else if (newText.includes('generating') || newText.includes('Creating')) {
                  step = '✍️ Generating report...'
                  progress = 70
                } else {
                  step = '🤔 Processing research...'
                  progress = 50
                }
              }
            }
          }
        } else if (message.type === 'result') {
          if (message.subtype === 'success') {
            fullResult = message.result || fullResult
          }
        }

        // Yield progress update with partial result
        yield {
          status: 'processing',
          step,
          progress,
          partialResult: fullResult
        }
      }

      // Final result
      yield {
        status: 'completed',
        step: '✅ Research complete!',
        progress: 100,
        result: fullResult
      }
    } catch (error) {
      yield {
        status: 'failed',
        step: '❌ Error occurred',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private estimateProgress(step: string): number {
    if (step.includes('Initializing')) return 5
    if (step.includes('Searching')) return 20
    if (step.includes('Reading')) return 50
    if (step.includes('Generating')) return 80
    if (step.includes('complete')) return 100
    return 10
  }
}
