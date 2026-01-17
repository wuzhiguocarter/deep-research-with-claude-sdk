# Lib 模块文档

[根目录](../CLAUDE.md) > **lib**

---

## 变更记录 (Changelog)

### 2026-01-17
- 初始化 lib 模块文档
- 添加核心服务与工具函数说明

---

## 模块职责

`lib/` 目录包含项目的核心业务逻辑、工具函数和配置，主要分为：

1. **研究服务** (`research/`)：基于 Claude Agent SDK 的研究核心
2. **工具函数**：通用工具（数据库、Markdown、分享等）

---

## 目录结构

```
lib/
├── research/                     # 研究服务模块
│   ├── service.ts                # Claude Agent SDK 集成
│   ├── prompts.ts                # 研究提示词模板
│   └── types.ts                  # 类型定义
├── db.ts                         # Prisma 客户端单例
├── markdown.ts                   # Markdown 转 HTML
├── share.ts                      # 分享链接工具
└── utils.ts                      # 通用工具函数
```

---

## 核心模块详解

### 1. 研究服务 (`research/`)

#### 1.1 types.ts - 类型定义

**文件**：`lib/research/types.ts`

**导出的类型**：

```typescript
// 研究类型
export type ResearchType = 'comparison' | 'analysis' | 'summary'

// 研究请求
export interface ResearchRequest {
  query: string
  type: ResearchType
}

// 研究会话
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

// 研究进度
export interface ResearchProgress {
  sessionId: string
  status: string
  step: string
  progress: number
  result?: string
}

// 搜索结果
export interface SearchResult {
  title: string
  url: string
  snippet: string
  publishedDate?: string
}
```

---

#### 1.2 prompts.ts - 研究提示词模板

**文件**：`lib/research/prompts.ts`

**导出函数**：

```typescript
export const getResearchPrompt = (query: string, type: string): string
```

**提示词结构**：

1. **基础指令**（所有类型通用）：
   - 使用 WebSearch 查找信息
   - 使用 WebFetch 阅读源内容
   - 提供具体引用链接
   - 使用 Markdown 格式
   - 直接以标题开始，无对话填充

2. **类型特定指令**：

| 研究类型 | 特定要求 |
|---------|---------|
| `comparison` | 对比表格、优缺点列表、具体示例、性能指标、场景推荐 |
| `analysis` | 功能矩阵、定价分析、SWOT 分析、可执行见解 |
| `summary` | 关键点提取、按主题分类、时间线、共识与分歧观点 |

**示例**：
```typescript
const prompt = getResearchPrompt(
  "对比 React 和 Vue 的性能",
  "comparison"
)
```

---

#### 1.3 service.ts - Claude Agent SDK 集成

**文件**：`lib/research/service.ts`

**核心类**：`ResearchService`

**构造函数**：
```typescript
constructor(sessionId: string)
```

**核心方法**：

```typescript
async *conductResearch(queryStr: string, type: ResearchType) {
  // 使用 Claude Agent SDK 的 query 函数
  for await (const message of query({
    prompt: researchPrompt,
    options: {
      allowedTools: ['WebSearch', 'WebFetch', 'Read', 'Write'],
      permissionMode: 'bypassPermissions'
    }
  })) {
    // 处理流式消息
    // 返回进度更新
  }
}
```

**返回值**（生成器）：
```typescript
{
  status: 'processing' | 'completed' | 'failed',
  step: string,
  progress: number,
  partialResult?: string,
  result?: string,
  error?: string
}
```

**关键特性**：

1. **流式输出**：使用 `async *` 生成器函数实现流式返回
2. **进度估算**：根据消息类型估算进度（初始化 5% → 搜索 20% → 阅读 40% → 生成 70% → 完成 100%）
3. **内容清理**：去除报告前的对话内容，保留从第一个标题开始的内容
4. **错误处理**：捕获并返回错误信息

**使用示例**：
```typescript
const service = new ResearchService(sessionId)

for await (const progress of service.conductResearch(query, type)) {
  console.log(`[${progress.progress}%] ${progress.step}`)

  if (progress.status === 'completed') {
    console.log('Result:', progress.result)
  }
}
```

**私有方法**：

```typescript
// 估算进度百分比
private estimateProgress(step: string): number

// 清理报告内容（去除前置对话）
private cleanReportContent(content: string): string
```

---

### 2. 数据库模块 (`db.ts`)

**文件**：`lib/db.ts`

**职责**：提供 Prisma 客户端单例

**实现**：
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**关键点**：
- 开发环境下复用全局实例，避免热重载时创建多个连接
- 生产环境下每次创建新实例

**使用示例**：
```typescript
import { prisma } from '@/lib/db'

const sessions = await prisma.researchSession.findMany({
  orderBy: { createdAt: 'desc' },
  take: 50
})
```

---

### 3. Markdown 处理 (`markdown.ts`)

**文件**：`lib/markdown.ts`

**导出函数**：
```typescript
export async function markdownToHtml(markdown: string): Promise<string>
```

**处理流程**：

```
Markdown 输入
    ↓
remarkParse (解析 Markdown)
    ↓
remarkGfm (GitHub Flavored Markdown)
    ↓
remarkBreaks (保留换行)
    ↓
remarkRehype (转换为 HTML)
    ↓
rehypeHighlight (代码高亮)
    ↓
rehypeSanitize (清理危险内容)
    ↓
rehypeStringify (序列化为 HTML)
    ↓
HTML 输出
```

**使用示例**：
```typescript
import { markdownToHtml } from '@/lib/markdown'

const html = await markdownToHtml('# Hello\n\nThis is **bold** text.')
```

---

### 4. 分享功能 (`share.ts`)

**文件**：`lib/share.ts`

**导出函数**：

```typescript
// 生成分享链接
export function generateShareUrl(sessionId: string): string

// 复制分享链接到剪贴板
export async function copyShareLink(sessionId: string): Promise<boolean>

// 从 URL 获取分享的 sessionId
export function getSharedSessionId(): string | null
```

**使用示例**：
```typescript
import { copyShareLink, getSharedSessionId } from '@/lib/share'

// 复制分享链接
const success = await copyShareLink(sessionId)
if (success) {
  toast.success('分享链接已复制')
}

// 获取 URL 中的分享 ID
const shareId = getSharedSessionId()
if (shareId) {
  // 显示分享报告
}
```

**关键特性**：
- 使用 `navigator.clipboard` API 复制链接
- 使用 `URLSearchParams` 解析查询参数
- 客户端安全检查（`typeof window !== 'undefined'`）

---

### 5. 通用工具 (`utils.ts`)

**文件**：`lib/utils.ts`

**导出函数**：

```typescript
// 合并 Tailwind CSS 类名
export function cn(...inputs: ClassValue[]): string
```

**实现**：
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**使用示例**：
```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  'base-class',
  isActive && 'active-class',
  'additional-class'
)} />
```

---

## API 使用指南

### 创建研究任务

```typescript
import { ResearchService } from '@/lib/research/service'
import { prisma } from '@/lib/db'

// 1. 创建数据库记录
const session = await prisma.researchSession.create({
  data: {
    query: "对比 React 和 Vue",
    type: "comparison",
    status: "processing"
  }
})

// 2. 启动研究
const service = new ResearchService(session.id)

for await (const progress of service.conductResearch(query, type)) {
  // 3. 更新进度
  console.log(`[${progress.progress}%] ${progress.step}`)

  // 4. 保存结果
  if (progress.status === 'completed') {
    await prisma.researchSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        result: progress.result
      }
    })
  }
}
```

---

## 常见问题

### Q: 如何添加新的研究类型？

1. 在 `lib/research/types.ts` 中添加类型：
   ```typescript
   export type ResearchType = 'comparison' | 'analysis' | 'summary' | 'your-type'
   ```

2. 在 `lib/research/prompts.ts` 中添加提示词模板：
   ```typescript
   const typeInstructions = {
     // ...
     'your-type': `YOUR_TYPE_SPECIFICS: ...`
   }
   ```

### Q: 如何自定义 Claude Agent SDK 配置？

修改 `lib/research/service.ts` 中的 `query` 函数参数：

```typescript
for await (const message of query({
  prompt: researchPrompt,
  options: {
    allowedTools: ['WebSearch', 'WebFetch', 'Read', 'Write'], // 添加/删除工具
    permissionMode: 'bypassPermissions',
    // 其他配置...
  }
})) {
  // ...
}
```

### Q: 如何扩展数据模型？

1. 修改 `prisma/schema.prisma`
2. 运行 `npx prisma migrate dev`
3. 更新 `lib/research/types.ts` 中的类型定义

---

## 相关文件清单

```
lib/
├── research/                     # 研究服务模块
│   ├── service.ts                # Claude Agent SDK 集成 (115 行)
│   ├── prompts.ts                # 研究提示词模板 (55 行)
│   └── types.ts                  # 类型定义 (33 行)
├── db.ts                         # Prisma 客户端单例 (10 行)
├── markdown.ts                   # Markdown 转 HTML (27 行)
├── share.ts                      # 分享链接工具 (47 行)
└── utils.ts                      # 通用工具函数 (6 行)
```

---

> 如需了解更多实现细节，请查看对应模块的源代码。
