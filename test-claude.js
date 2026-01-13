import { query } from '@anthropic-ai/claude-agent-sdk'

async function testClaudeSDK() {
  console.log('Testing Claude Agent SDK with Zhipu endpoint...')
  console.log('API Key:', process.env.ANTHROPIC_API_KEY?.substring(0, 20) + '...')
  console.log('Base URL:', process.env.ANTHROPIC_BASE_URL)

  try {
    const testQuery = 'What is 2+2? Answer in one sentence in Chinese.'

    for await (const message of query({
      prompt: testQuery,
      options: {
        permissionMode: 'bypassPermissions',
        model: 'claude-3-5-sonnet-20241022'
      }
    })) {
      console.log('Message type:', message.type)

      if (message.type === 'assistant') {
        const content = message.message.content
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text') {
              console.log('Response:', block.text)
            }
          }
        }
      } else if (message.type === 'result') {
        console.log('Final result:', message.subtype)
        if (message.subtype === 'success') {
          console.log('Success!')
          break
        } else if (message.subtype && message.subtype.startsWith('error')) {
          console.log('Error subtype:', message.subtype)
          break
        }
      }
    }

    console.log('Test completed!')
    process.exit(0)
  } catch (error) {
    console.error('Test failed:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testClaudeSDK()
