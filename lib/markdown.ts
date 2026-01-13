import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkStringify from 'remark-stringify'
import { default as rehypeReact } from 'rehype-react'
import { default as rehypeHighlight } from 'rehype-highlight'
import { default as rehypeSanitize } from 'rehype-sanitize'
import { default as reypeStringify } from 'retype-stringify'

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkStringify)
    .use(rehypeReact, {
      // Customize component rendering
      components: {
        // You can add custom components here later
      }
    })
    .use(rehypeHighlight, {
      detect: true,
      ignoreLanguages: [],
      prefix: 'language-'
    })
    .use(rehypeSanitize)
    .use(reypeStringify, {
      clean: 'prose'
    })
    .process(markdown)

  return String(result)
}
