import { config } from 'dotenv'
config()

import { query } from '@anthropic-ai/claude-agent-sdk'

async function testClaudeSDK() {
  console.log('Testing Claude Agent SDK with Zhipu endpoint...')
  console.log('API Key:', process.env.ANTHROPIC_API_KEY?.substring(0, 20) + '...')
  console.log('Base URL:', process.env.ANTHROPIC_BASE_URL)

  try {
    const testQuery = '2+2等于几？用一句话回答。'

    for await (const message of query({
      prompt: testQuery,
      options: {
        permissionMode: 'bypassPermissions'
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
          console.log('✅ Success!')
          break
        }
      }
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testClaudeSDK()
