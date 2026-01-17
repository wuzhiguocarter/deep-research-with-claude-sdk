# Prisma 数据层文档

[根目录](../CLAUDE.md) > **prisma**

---

## 变更记录 (Changelog)

### 2026-01-17
- 初始化 Prisma 模块文档
- 添加数据模型与迁移说明

---

## 模块职责

`prisma/` 目录包含数据库相关的所有配置和迁移文件，负责：

1. **数据模型定义**：`schema.prisma`
2. **数据库迁移**：`migrations/` 目录
3. **数据库文件**：`dev.db`（SQLite）

---

## 目录结构

```
prisma/
├── schema.prisma                 # 数据模型定义
├── migrations/                   # 迁移历史
│   └── 20260112182212_init/      # 初始迁移
│       ├── migration.sql         # 迁移 SQL
│       └── migration_lock.toml   # 迁移锁文件
└── dev.db                        # SQLite 数据库文件（开发环境）
```

---

## 数据模型

### ResearchSession (研究会话)

**表名**：`ResearchSession`

**职责**：存储用户的研究任务和结果

**字段定义**：

```prisma
model ResearchSession {
  id          String   @id @default(cuid())
  query       String
  type        String
  status      String   @default("pending")
  result      String?
  sources     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**字段说明**：

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| `id` | String | PRIMARY KEY, DEFAULT(cuid()) | 唯一标识符 |
| `query` | String | NOT NULL | 研究查询内容 |
| `type` | String | NOT NULL | 研究类型 (comparison/analysis/summary) |
| `status` | String | DEFAULT("pending") | 任务状态 |
| `result` | String? | OPTIONAL | 研究结果 (Markdown 格式) |
| `sources` | String? | OPTIONAL | 数据源 JSON（预留字段） |
| `createdAt` | DateTime | DEFAULT(now()) | 创建时间 |
| `updatedAt` | DateTime | AUTO UPDATE | 更新时间 |

**状态值**：

- `pending`: 待处理
- `processing`: 处理中
- `completed`: 已完成
- `failed`: 失败

**索引**：

- 主键：`id`
- 无额外索引（可按需添加）

---

## 数据库配置

### 数据源 (datasource)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**说明**：
- **提供者**：SQLite
- **连接 URL**：从环境变量 `DATABASE_URL` 读取
- **默认值**：`file:./dev.db`（开发环境）

### 生成器 (generator)

```prisma
generator client {
  provider = "prisma-client-js"
}
```

**说明**：
- **提供者**：`prisma-client-js`
- **生成的客户端**：`@prisma/client`

---

## 迁移历史

### 初始迁移 (20260112182212_init)

**文件**：`prisma/migrations/20260112182212_init/migration.sql`

**内容**：

```sql
-- CreateTable
CREATE TABLE "ResearchSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "sources" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ResearchSession_createdAt_idx" ON "ResearchSession"("createdAt");
```

**说明**：
- 创建 `ResearchSession` 表
- 在 `createdAt` 上创建索引（加速排序查询）

---

## 使用指南

### 1. 初始化数据库

```bash
# 创建迁移
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate
```

### 2. 修改数据模型

```bash
# 1. 修改 schema.prisma
# 2. 创建迁移
npx prisma migrate dev --name your_migration_name

# 3. 重新生成客户端
npx prisma generate
```

### 3. 重置数据库

```bash
# 删除所有数据并重新应用迁移
npx prisma migrate reset

# 或者手动删除
rm prisma/dev.db
npx prisma migrate dev
```

### 4. 打开数据库 GUI

```bash
# 打开 Prisma Studio（数据库可视化工具）
npx prisma studio
```

---

## Prisma Client 使用

### 导入客户端

```typescript
import { prisma } from '@/lib/db'
```

### CRUD 操作

#### 创建记录

```typescript
const session = await prisma.researchSession.create({
  data: {
    query: "对比 React 和 Vue",
    type: "comparison",
    status: "processing"
  }
})
```

#### 查询记录

```typescript
// 单条查询
const session = await prisma.researchSession.findUnique({
  where: { id: sessionId }
})

// 多条查询（带排序和限制）
const sessions = await prisma.researchSession.findMany({
  orderBy: { createdAt: 'desc' },
  take: 50
})
```

#### 更新记录

```typescript
const session = await prisma.researchSession.update({
  where: { id: sessionId },
  data: {
    status: 'completed',
    result: '# Research Result\n\n...'
  }
})
```

#### 删除记录

```typescript
await prisma.researchSession.delete({
  where: { id: sessionId }
})
```

---

## 环境变量

### .env 配置

```bash
# 数据库连接 URL
DATABASE_URL="file:./dev.db"

# Anthropic API 配置（在根 .env 中）
ANTHROPIC_API_KEY="your-api-key"
ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"
```

### .env.example

```bash
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY=""
ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"
```

---

## 数据库文件

### dev.db

**位置**：`prisma/dev.db`

**说明**：
- SQLite 数据库文件（开发环境）
- 不提交到 Git（在 `.gitignore` 中）
- 生产环境建议使用 PostgreSQL 或 MySQL

**查看数据**：
```bash
# 使用 sqlite3 命令行
sqlite3 prisma/dev.db

# 查看表
.tables

# 查询数据
SELECT * FROM ResearchSession;
```

---

## 性能优化建议

### 1. 添加索引

如果经常按 `status` 或 `type` 查询，可以添加索引：

```prisma
model ResearchSession {
  // ...

  @@index([status, createdAt])
  @@index([type])
}
```

### 2. 分页查询

对于大量数据，使用游标分页：

```typescript
const sessions = await prisma.researchSession.findMany({
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: 1,
  cursor: { id: lastSessionId }
})
```

### 3. 选择性查询

只查询需要的字段：

```typescript
const sessions = await prisma.researchSession.findMany({
  select: {
    id: true,
    query: true,
    status: true,
    createdAt: true
    // 不查询 result（可能很大）
  }
})
```

---

## 常见问题

### Q: 迁移失败怎么办？

```bash
# 重置迁移
npx prisma migrate reset --force

# 或者手动解决冲突
npx prisma migrate resolve --applied "migration_name"
```

### Q: Prisma Client 找不到类型？

```bash
# 重新生成客户端
npx prisma generate
```

### Q: 数据库锁定？

```bash
# 关闭所有数据库连接
# 删除锁文件
rm -f prisma/dev.db-shm prisma/dev.db-wal
```

---

## 生产环境建议

### 1. 使用 PostgreSQL

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. 配置连接池

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'error', 'warn']
})
```

### 3. 数据库备份

```bash
# SQLite 备份
cp prisma/dev.db prisma/backup.db

# PostgreSQL 备份
pg_dump -U user -d database > backup.sql
```

---

## 相关文件清单

```
prisma/
├── schema.prisma                 # 数据模型定义 (23 行)
├── migrations/                   # 迁移历史
│   ├── 20260112182212_init/      # 初始迁移
│   │   ├── migration.sql         # 迁移 SQL
│   │   └── migration_lock.toml   # 迁移锁文件
│   └── migration_lock.toml       # 全局迁移锁
└── dev.db                        # SQLite 数据库文件（不提交）
```

---

> 如需了解更多数据库操作，请参考 [Prisma 文档](https://www.prisma.io/docs)。
