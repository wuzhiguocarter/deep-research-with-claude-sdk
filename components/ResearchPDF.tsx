'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import React from 'react'

// 注册本地中文字体 - 思源黑体
Font.register({
  family: 'Source Han Sans SC',
  src: '/fonts/SourceHanSansSC-Regular.ttf',
})

Font.register({
  family: 'Source Han Sans SC',
  src: '/fonts/SourceHanSansSC-Bold.ttf',
  fontWeight: 700,
})

interface ResearchPDFProps {
  title: string
  content: string
  date: string
}

// 样式定义
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: 'Source Han Sans SC', // 使用思源黑体
    color: '#333333',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #333333',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
  },
  date: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 20,
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#000000',
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#000000',
  },
  heading3: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    color: '#000000',
  },
  heading4: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#000000',
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
  },
  codeBlock: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginBottom: 10,
    fontFamily: 'Courier', // 代码块使用等宽字体
    fontSize: 10,
    borderLeft: '3pt solid #007acc',
  },
  inlineCode: {
    backgroundColor: '#f0f0f0',
    padding: '2 4',
    fontFamily: 'Source Han Sans SC', // 使用思源黑体
    fontSize: 10,
    borderRadius: 2,
  },
  list: {
    marginBottom: 10,
    paddingLeft: 20,
  },
  listItem: {
    marginBottom: 5,
  },
  link: {
    color: '#0066cc',
    textDecoration: 'underline',
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#007acc',
    borderLeftStyle: 'solid',
    paddingLeft: 10,
    marginBottom: 10,
    fontStyle: 'italic',
    color: '#666666',
  },
  table: {
    width: '100%',
    marginBottom: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#cccccc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    borderBottomStyle: 'solid',
  },
  tableCell: {
    padding: 5,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#cccccc',
    borderRightStyle: 'solid',
  },
  horizontalRule: {
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    borderBottomStyle: 'solid',
    marginVertical: 10,
  },
})

// 解析 Markdown 并渲染为 PDF 组件
const renderMarkdown = (text: string) => {
  if (!text) return []

  const lines = text.split('\n')
  const elements: React.ReactElement[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 空行
    if (!line.trim()) {
      elements.push(<Text key={`empty-${i}`} style={{ marginBottom: 5 }}></Text>)
      i++
      continue
    }

    // 标题
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1
      const headingText = line.replace(/^#+\s*/, '')
      const headingStyle = [
        styles.heading1,
        styles.heading2,
        styles.heading3,
        styles.heading4,
      ][level - 1] || styles.heading4
      
      elements.push(
        <Text key={i} style={headingStyle}>{headingText}</Text>
      )
      i++
      continue
    }

    // 代码块
    if (line.startsWith('```')) {
      const lang = line.match(/```(\w*)/)?.[1] || ''
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      
      if (codeLines.length > 0) {
        elements.push(
          <View key={i} style={styles.codeBlock}>
            <Text style={{ fontFamily: 'Courier', fontSize: 10, color: '#333333' }}>
              {codeLines.join('\n')}
            </Text>
          </View>
        )
      }
      i++
      continue
    }

    // 表格
    if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableRows: string[][] = []
      
      // 解析表格行
      while (i < lines.length && lines[i].includes('|')) {
        const row = lines[i].trim()
        if (row.startsWith('|') && row.endsWith('|')) {
          const cells = row.split('|').slice(1, -1).map(cell => cell.trim())
          if (cells.length > 0 && cells.some(c => c !== '')) {
            // 检查是否是分隔行
            const isDivider = cells.every(cell => /^:?-+:?$/.test(cell))
            if (!isDivider) {
              tableRows.push(cells)
            }
          }
        }
        i++
      }

      // 渲染表格
      if (tableRows.length > 0) {
        elements.push(
          <View key={i} style={styles.table}>
            {tableRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.tableRow}>
                {row.map((cell, cellIndex) => (
                  <View key={cellIndex} style={styles.tableCell}>
                    <Text style={{ fontSize: 10, color: '#000000' }}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )
      }
      continue
    }

    // 无序列表
    if (line.match(/^\s*[-*]\s+/)) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].match(/^\s*[-*]\s+/)) {
        const itemText = lines[i].replace(/^\s*[-*]\s+/, '• ')
        listItems.push(itemText)
        i++
      }
      elements.push(
        <View key={i} style={styles.list}>
          {listItems.map((item, idx) => (
            <Text key={idx} style={styles.listItem}>{item}</Text>
          ))}
        </View>
      )
      continue
    }

    // 有序列表
    if (line.match(/^\s*\d+\.\s+/)) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
        listItems.push(lines[i])
        i++
      }
      elements.push(
        <View key={i} style={styles.list}>
          {listItems.map((item, idx) => (
            <Text key={idx} style={styles.listItem}>{item}</Text>
          ))}
        </View>
      )
      continue
    }

    // 引用块
    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s*/, ''))
        i++
      }
      const quoteText = quoteLines.join(' ')
      elements.push(
        <Text key={i} style={styles.blockquote}>{quoteText}</Text>
      )
      continue
    }

    // 水平线
    if (line.match(/^---+$/)) {
      elements.push(<View key={i} style={styles.horizontalRule} />)
      i++
      continue
    }

    // 普通段落（支持换行）
    const paragraphLines: string[] = []
    while (i < lines.length && lines[i].trim() && !lines[i].match(/^#+|^---+|^>|^\s*[-*]\s+|^\s*\d+\.\s+|```|\|.*\|/)) {
      paragraphLines.push(lines[i])
      i++
    }
    
    // 处理段落内容，保留换行
    const processParagraph = (text: string) => {
      // 处理加粗
      text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<b>$1</b>')
      text = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      // 处理斜体
      text = text.replace(/\*(.+?)\*/g, '<i>$1</i>')
      // 处理内联代码（临时占位符）
      text = text.replace(/`([^`]+)`/g, '<c>$1</c>')
      // 处理链接 [文本](url)
      text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a>$1</a>|$2|')
      return text
    }

    const paragraphText = paragraphLines.join('\n')
    const processedText = processParagraph(paragraphText)

    // 分割并处理内联格式
    const parts = processedText.split(/(<[bica]>[^<]+<\/[bica]>|<a>\$[^|]+\|<a>)/g)
    
    elements.push(
      <Text key={i} style={styles.paragraph}>
        {parts.map((part, idx) => {
          // 加粗
          if (part.startsWith('<b>')) {
            return <Text key={idx} style={{ fontWeight: 700 }}>{part.replace(/<\/?b>/g, '')}</Text>
          }
          // 斜体
          if (part.startsWith('<i>')) {
            return <Text key={idx} style={{ fontStyle: 'italic' }}>{part.replace(/<\/?i>/g, '')}</Text>
          }
          // 内联代码
          if (part.startsWith('<c>')) {
            return <Text key={idx} style={styles.inlineCode}>{part.replace(/<\/?c>/g, '')}</Text>
          }
          // 链接
          if (part.startsWith('<a>')) {
            const linkText = part.split('|')[1].replace('<a>', '')
            return <Text key={idx} style={styles.link}>{linkText}</Text>
          }
          // 普通文本（处理换行）
          return (
            <Text key={idx}>
              {part.split('\n').map((line, lineIdx) => (
                <Text key={lineIdx}>
                  {line}
                  {lineIdx < part.split('\n').length - 1 && (
                    <Text> {'\n'}</Text>
                  )}
                </Text>
              ))}
            </Text>
          )
        })}
      </Text>
    )
  }

  return elements
}

// PDF 文档组件
export const ResearchPDF: React.FC<ResearchPDFProps> = ({ title, content, date }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* 页眉 */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.date}>生成时间: {date}</Text>
      </View>

      {/* 内容 */}
      {renderMarkdown(content)}
    </Page>
  </Document>
)
