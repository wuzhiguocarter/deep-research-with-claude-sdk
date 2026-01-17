# App 模块文档

[根目录](../CLAUDE.md) > **app**

---

## 变更记录 (Changelog)

### 2026-01-17
- 初始化 app 模块文档
- 添加 API 路由与页面说明

---

## 模块职责

`app/` 目录是 Next.js 16 的 App Router 根目录，包含：

1. **API 路由**：后端接口（研究任务、历史管理）
2. **页面**：前端页面（研究页面、首页）
3. **布局**：全局布局与配置

---

## 目录结构

```
app/
├── api/                          # API 路由
│   ├── research/                 # 研究任务 API
│   │   ├── route.ts              # POST /api/research (创建研究任务)
│   │   └── [id]/
│   │       ├── route.ts          # GET /api/research/[id] (获取结果)
│   │       └── stream/
│   │           └── route.ts      # GET /api/research/[id]/stream (SSE 流)
│   └── history/                  # 历史记录 API
│       ├── route.ts              # GET /api/history (获取历史列表)
│       └── [id]/
│           └── route.ts          # GET/DELETE /api/history/[id]
├── research/                     # 研究页面
│   └── page.tsx                  # /research 页面
├── layout.tsx                    # 根布局
└── page.tsx                      # 首页 (/)
```

---

## API 路由详解

### 1. 研究任务 API (`api/research/`)

#### 1.1 POST /api/research

**文件**：`app/api/research/route.ts`

**方法**：`POST`

**职责**：创建新的研究任务并启动后台处理

**请求体**：
```typescript
{
  query: string      // 研究查询
  type: ResearchType // 研究类型: 'comparison' | 'analysis' | 'summary'
}
```

**响应**：
```typescript
{
  sessionId: string  // 研究会话 ID
  status: string     // 'processing'
}
```

**错误响应**：
```typescript
{
  error: string
  details?: string
}
```

**处理流程**：

```
1. 接收请求 → 验证参数
2. 创建数据库记录 (status: 'processing')
3. 启动后台研究任务 (不阻塞响应)
4. 立即返回 sessionId
```

**关键代码**：
```typescript
export async function POST(request: NextRequest) {
  const body: ResearchRequest = await request.json()
  const { query, type } = body

  // 创建会话
  const session = await prisma.researchSession.create({
    data: { query, type, status: 'processing' }
  })

  // 启动后台任务
  startResearch(session.id, query, type).catch(console.error)

  return NextResponse.json({
    sessionId: session.id,
    status: 'processing'
  })
}
```

---

#### 1.2 GET /api/research/[id]

**文件**：`app/api/research/[id]/route.ts`

**方法**：`GET`

**职责**：获取指定研究任务的结果

**URL 参数**：
- `id`: 研究会话 ID

**响应**：
```typescript
{
  id: string
  query: string
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: string
  sources?: string
  createdAt: string
  updatedAt: string
}
```

**使用场景**：
- 前端轮询任务状态
- 加载历史记录
- 显示分享报告

---

#### 1.3 GET /api/research/[id]/stream (SSE)

**文件**：`app/api/research/[id]/stream/route.ts`

**方法**：`GET`

**职责**：通过 Server-Sent Events (SSE) 流式推送研究进度

**URL 参数**：
- `id`: 研究会话 ID

**响应类型**：`text/event-stream`

**事件格式**：
```
data: {"type":"progress","status":"processing","step":"研究中...","result":"部分内容","hasResult":true}

data: {"type":"done","status":"completed","result":"完整结果"}

data: {"type":"error","error":"错误信息"}
```

**事件类型**：

| type | status | 描述 |
|------|--------|------|
| `progress` | `processing` | 进度更新，包含部分结果 |
| `done` | `completed` / `failed` | 任务完成或失败 |
| `error` | - | 发生错误 |

**前端接收示例**：
```typescript
const eventSource = new EventSource(`/api/research/${sessionId}/stream`)

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)

  if (data.type === 'progress') {
    console.log(`[${data.step}] ${data.result}`)
  } else if (data.type === 'done') {
    console.log('完成！', data.result)
    eventSource.close()
  }
}
```

**关键实现**：
- 使用 `ReadableStream` 创建流式响应
- 定期轮询数据库（每秒）获取最新结果
- 通过 `writer.write()` 发送 SSE 事件

---

### 2. 历史记录 API (`api/history/`)

#### 2.1 GET /api/history

**文件**：`app/api/history/route.ts`

**方法**：`GET`

**职责**：获取研究历史列表

**响应**：
```typescript
[
  {
    id: string
    query: string
    type: string
    status: string
    result?: string
    createdAt: string
    updatedAt: string
  },
  // ... 最多 50 条记录
]
```

**排序**：按创建时间倒序（最新的在前）

**限制**：最多返回 50 条记录

---

#### 2.2 GET /api/history/[id]

**文件**：`app/api/history/[id]/route.ts`

**方法**：`GET`

**职责**：获取单个研究会话的详细信息

**URL 参数**：
- `id`: 研究会话 ID

**响应**：单个 `ResearchSession` 对象

**错误**：404（会话不存在）

---

#### 2.3 DELETE /api/history/[id]

**文件**：`app/api/history/[id]/route.ts`

**方法**：`DELETE`

**职责**：删除指定的研究会话

**URL 参数**：
- `id`: 研究会话 ID

**响应**：`204 No Content`

**错误**：404（会话不存在）或 500（删除失败）

---

## 页面详解

### 1. 首页 (`page.tsx`)

**文件**：`app/page.tsx`

**路由**：`/`

**职责**：项目首页（可能包含介绍和导航）

**内容**：
- 项目介绍
- 快速开始指南
- 导航到研究页面

---

### 2. 研究页面 (`research/page.tsx`)

**文件**：`app/research/page.tsx`

**路由**：`/research`

**职责**：研究任务的主界面

**组件结构**：
```tsx
<ResearchPage>
  <ResearchForm onSubmit={startResearch} />
  {isStreaming ? (
    <StreamingCanvas sessionId={sessionId} isActive={isStreaming} />
  ) : (
    <ResultsViewer result={result} />
  )}
  <HistoryPanel sessions={history} />
</ResearchPage>
```

**状态管理**：
```typescript
const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null)
const [history, setHistory] = useState<ResearchSession[]>([])
const [isLoading, setIsLoading] = useState(false)
const [isStreaming, setIsStreaming] = useState(false)
```

**关键功能**：

1. **启动研究**：
   ```typescript
   const startResearch = async (query: string, type: ResearchType) => {
     // 1. POST /api/research
     // 2. 轮询状态 (每 3 秒)
     // 3. 完成后加载历史
   }
   ```

2. **加载会话**：
   ```typescript
   const loadSession = async (id: string) => {
     // GET /api/history/[id]
     // 设置为当前会话
   }
   ```

3. **删除会话**：
   ```typescript
   const deleteSession = async (id: string) => {
     // DELETE /api/history/[id]
     // 刷新历史列表
   }
   ```

4. **分享报告**：
   - 检测 URL 参数 `?share=sessionId`
   - 如果存在，显示全屏分享视图
   - 否则显示常规研究界面

---

### 3. 根布局 (`layout.tsx`)

**文件**：`app/layout.tsx`

**职责**：全局布局配置

**配置项**：
- HTML 结构
- 字体加载（思源黑体）
- 元数据（SEO）
- 全局样式

**关键配置**：
```tsx
export const metadata: Metadata = {
  title: 'Deep Research Assistant',
  description: 'AI-powered research with real-time streaming'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={font.className}>{children}</body>
    </html>
  )
}
```

---

## 数据流

### 研究任务流程

```
用户提交表单
    ↓
ResearchForm.onSubmit
    ↓
POST /api/research
    ↓
创建数据库记录 (status: processing)
    ↓
启动后台任务 (ResearchService.conductResearch)
    ↓
Claude Agent SDK (WebSearch/WebFetch)
    ↓
更新数据库 (result)
    ↓
前端轮询 /api/research/[id]
    ↓
显示结果 (ResultsViewer)
```

### SSE 流式更新流程

```
前端连接 /api/research/[id]/stream
    ↓
后端轮询数据库 (每秒)
    ↓
发送 SSE 事件
    ↓
StreamingCanvas 接收更新
    ↓
更新 UI (进度 + 内容)
```

---

## 错误处理

### API 错误响应格式

```typescript
{
  error: string        // 错误类型
  details?: string     // 详细信息
}
```

### HTTP 状态码

| 状态码 | 场景 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 前端错误处理

```typescript
try {
  const response = await fetch('/api/research', { ... })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const data = await response.json()
} catch (error) {
  console.error('请求失败:', error)
  toast.error('研究启动失败，请重试')
}
```

---

## 相关文件清单

```
app/
├── api/                          # API 路由
│   ├── research/
│   │   ├── route.ts              # POST /api/research (97 行)
│   │   └── [id]/
│   │       ├── route.ts          # GET /api/research/[id]
│   │       └── stream/
│   │           └── route.ts      # SSE stream endpoint
│   └── history/
│       ├── route.ts              # GET /api/history (22 行)
│       └── [id]/
│           └── route.ts          # GET/DELETE /api/history/[id]
├── research/
│   └── page.tsx                  # /research 页面 (142 行)
├── layout.tsx                    # 根布局
└── page.tsx                      # 首页
```

---

> 如需了解更多实现细节，请查看对应文件的源代码。
