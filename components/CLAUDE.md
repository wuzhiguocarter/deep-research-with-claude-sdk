# Components 模块文档

[根目录](../CLAUDE.md) > **components**

---

## 变更记录 (Changelog)

### 2026-01-17
- 初始化组件模块文档
- 添加组件职责与接口说明

---

## 模块职责

`components/` 模块包含所有 React 组件，分为两类：

1. **UI 基础组件** (`ui/` 目录)：基于 shadcn/ui 的可复用基础组件
2. **功能组件**：业务逻辑相关的复合组件

---

## 组件清单

### UI 基础组件 (`ui/`)

| 组件名 | 文件 | 描述 | 状态 |
|-------|------|------|------|
| Button | `button.tsx` | 按钮组件，支持多种变体 | ✅ 活跃 |
| Card | `card.tsx` | 卡片容器组件 | ✅ 活跃 |
| Input | `input.tsx` | 文本输入框 | ✅ 活跃 |
| Textarea | `textarea.tsx` | 多行文本输入 | ✅ 活跃 |
| Select | `select.tsx` | 下拉选择器 | ✅ 活跃 |
| Badge | `badge.tsx` | 徽章/标签组件 | ✅ 活跃 |
| ScrollArea | `scroll-area.tsx` | 自定义滚动区域 | ✅ 活跃 |
| Separator | `separator.tsx` | 分隔线 | ✅ 活跃 |
| DropdownMenu | `dropdown-menu.tsx` | 下拉菜单 | ✅ 活跃 |

### 功能组件

| 组件名 | 文件 | 职责描述 | Props |
|-------|------|---------|-------|
| **ResearchForm** | `ResearchForm.tsx` | 研究表单，支持输入查询和选择研究类型 | `onSubmit: (query, type) => void`, `isLoading: boolean` |
| **StreamingCanvas** | `StreamingCanvas.tsx` | 实时流式画布，通过 SSE 接收研究进度 | `sessionId: string \| null`, `isActive: boolean` |
| **ResultsViewer** | `ResultsViewer.tsx` | 研究结果查看器，渲染 Markdown | `result: string`, `query: string`, `sessionId: string` |
| **HistoryPanel** | `HistoryPanel.tsx` | 历史记录侧边栏 | `sessions: ResearchSession[]`, `onLoadSession`, `onDeleteSession` |
| **SharedReportViewer** | `SharedReportViewer.tsx` | 分享报告的全屏查看器 | `sessionId: string` |
| **ProgressTracker** | `ProgressTracker.tsx` | 进度跟踪器组件 | - |
| **MarkdownDisplay** | `MarkdownDisplay.tsx` | Markdown 显示组件 | - |
| **ResearchPDF** | `ResearchPDF.tsx` | PDF 导出组件 (@react-pdf/renderer) | - |
| **TableOfContents** | `TableOfContents.tsx` | 目录导航组件 | `headings: Heading[]`, `activeId`, `onHeadingClick` |

---

## 关键组件详解

### 1. ResearchForm (研究表单)

**文件**：`components/ResearchForm.tsx`

**职责**：提供用户输入研究查询和选择研究类型的界面

**Props 接口**：
```typescript
interface ResearchFormProps {
  onSubmit: (query: string, type: ResearchType) => void
  isLoading: boolean
}
```

**关键特性**：
- 支持三种研究类型选择（对比分析、深度分析、摘要总结）
- 使用 Textarea 组件支持多行输入
- 提交时禁用按钮防止重复提交

**使用示例**：
```tsx
<ResearchForm onSubmit={startResearch} isLoading={isLoading} />
```

---

### 2. StreamingCanvas (实时流式画布)

**文件**：`components/StreamingCanvas.tsx`

**职责**：通过 Server-Sent Events (SSE) 实时接收并展示研究进度

**Props 接口**：
```typescript
interface StreamingCanvasProps {
  sessionId: string | null
  isActive: boolean
}
```

**关键特性**：
- **SSE 连接**：使用 `EventSource` 连接到 `/api/research/[id]/stream`
- **全屏模式**：支持全屏查看，带目录导航
- **实时更新**：显示当前步骤、进度百分比
- **导出功能**：支持导出为 Markdown 和 PDF
- **分享功能**：复制分享链接

**核心逻辑**：
```typescript
// SSE 连接
const eventSource = new EventSource(`/api/research/${sessionId}/stream`)

eventSource.onmessage = (event) => {
  const data: StreamEvent = JSON.parse(event.data)
  if (data.type === 'progress') {
    setContent(data.result)
    setProgress(...)
  }
}
```

**状态管理**：
- `content`: 研究结果内容
- `step`: 当前步骤描述
- `progress`: 进度百分比 (0-100)
- `isFullscreen`: 是否全屏
- `activeHeading`: 当前激活的标题（用于目录导航）

---

### 3. ResultsViewer (结果查看器)

**文件**：`components/ResultsViewer.tsx`

**职责**：渲染完成的研究结果，支持导出和分享

**Props 接口**：
```typescript
interface ResultsViewerProps {
  result: string
  query: string
  sessionId: string
}
```

**关键特性**：
- Markdown 渲染（使用 `react-markdown`）
- 代码高亮（`rehype-highlight`）
- 导出功能（Markdown/PDF）
- 分享链接

---

### 4. HistoryPanel (历史面板)

**文件**：`components/HistoryPanel.tsx`

**职责**：显示研究历史列表，支持加载和删除

**Props 接口**：
```typescript
interface HistoryPanelProps {
  sessions: ResearchSession[]
  onLoadSession: (id: string) => void
  onDeleteSession: (id: string) => void
}
```

**关键特性**：
- 按时间倒序显示历史记录
- 显示状态徽章（已完成/失败/处理中）
- 点击加载历史结果
- 删除不需要的记录

---

### 5. TableOfContents (目录导航)

**文件**：`components/TableOfContents.tsx`

**职责**：生成并显示 Markdown 报告的目录导航

**Props 接口**：
```typescript
interface TableOfContentsProps {
  headings: Heading[]
  activeId: string
  onHeadingClick: (headingId: string) => void
}

interface Heading {
  id: string
  text: string
  level: number
}
```

**关键特性**：
- 自动从 Markdown 提取标题层级
- 高亮当前可见标题
- 点击滚动到对应位置
- 使用 IntersectionObserver 检测可见性

**工具函数**：
```typescript
// 提取标题
export function extractHeadings(html: string): Heading[]

// 为标题添加 ID
export function addHeadingIds(html: string): string
```

---

## UI 基础组件说明

所有 `ui/` 目录下的组件均基于 **Radix UI** 和 **Tailwind CSS** 构建，遵循 shadcn/ui 设计规范。

### 共同特性

1. **类型安全**：完整的 TypeScript 类型定义
2. **可组合**：支持通过 props 自定义样式
3. **无障碍**：遵循 ARIA 标准
4. **主题支持**：使用 CSS 变量支持主题切换

### 使用示例

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

<Button variant="default" size="sm">
  点击我
</Button>

<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>
    内容
  </CardContent>
</Card>
```

---

## 组件间通信

### 数据流

```
ResearchForm
    ↓ onSubmit
app/research/page.tsx
    ↓ fetch
API Routes
    ↓ SSE
StreamingCanvas
    ↓ 渲染
ResultsViewer
```

### 状态提升

- 父组件 (`app/research/page.tsx`) 管理全局状态
- 通过 props 传递数据和回调函数
- 使用 React hooks (`useState`, `useEffect`) 管理组件内部状态

---

## 样式规范

### Tailwind CSS 类名约定

- 布局：`flex`, `grid`, `container`
- 间距：`p-4`, `m-2`, `gap-6`
- 颜色：`bg-background`, `text-foreground`, `border-border`
- 圆角：`rounded-lg`, `rounded-md`
- 阴影：`shadow-md`

### 响应式设计

```tsx
<div className="grid gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2">
    {/* 主内容区 */}
  </div>
  <div>
    {/* 侧边栏 */}
  </div>
</div>
```

---

## 常见问题

### Q: 如何添加新的 UI 组件？

使用 shadcn/ui CLI：
```bash
npx shadcn-ui@latest add [component-name]
```

### Q: 如何自定义组件样式？

1. 使用 `className` prop 覆盖样式
2. 修改组件源码（在 `components/ui/` 目录）
3. 通过 CSS 变量自定义主题

### Q: StreamingCanvas 为什么有时无法接收更新？

检查：
1. `sessionId` 是否正确
2. `isActive` 是否为 `true`
3. SSE 端点 `/api/research/[id]/stream` 是否正常
4. 浏览器控制台是否有错误

---

## 相关文件清单

```
components/
├── ui/                           # 基础 UI 组件
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── select.tsx
│   ├── badge.tsx
│   ├── scroll-area.tsx
│   ├── separator.tsx
│   └── dropdown-menu.tsx
├── ResearchForm.tsx              # 研究表单
├── StreamingCanvas.tsx           # 实时流式画布
├── ResultsViewer.tsx             # 结果查看器
├── HistoryPanel.tsx              # 历史面板
├── SharedReportViewer.tsx        # 分享报告查看器
├── ProgressTracker.tsx           # 进度跟踪器
├── MarkdownDisplay.tsx           # Markdown 显示
├── ResearchPDF.tsx               # PDF 导出组件
└── TableOfContents.tsx           # 目录导航
```

---

> 如需了解更多组件细节，请查看对应组件的源代码。
