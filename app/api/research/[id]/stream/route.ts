import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      try {
        // Poll database for updates
        const pollInterval = setInterval(async () => {
          const session = await prisma.researchSession.findUnique({
            where: { id }
          })

          if (!session) {
            sendEvent({ error: 'Session not found' })
            clearInterval(pollInterval)
            controller.close()
            return
          }

          sendEvent({
            type: 'progress',
            status: session.status,
            query: session.query,
            result: session.result,
            hasResult: !!session.result
          })

          // If completed or failed, close the stream
          if (session.status === 'completed' || session.status === 'failed') {
            clearInterval(pollInterval)
            sendEvent({ type: 'done', status: session.status })
            controller.close()
          }
        }, 1000) // Poll every second

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(pollInterval)
          controller.close()
        })

      } catch (error) {
        sendEvent({ error: error instanceof Error ? error.message : 'Unknown error' })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
