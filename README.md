# Deep Research - 企业级 AI 研究助手

一个基于 Claude Agent SDK 的企业级 ToB SaaS AI 研究平台，支持多租户、团队协作、订阅套餐、积分系统和微信支付。

## 🚀 功能特性

### 核心研究功能
- **摘要研究** - 快速提取关键信息，生成简洁摘要（10 积分）
- **深度分析** - 全面分析，包含 SWOT 和功能矩阵（25 积分）
- **对比研究** - 多选项对比，优缺点分析（30 积分）
- **实时进度** - SSE 流式更新研究进度
- **自动引用** - 自动提取和标注信息来源
- **Markdown 导出** - 下载研究报告

### ToB SaaS 功能
- **用户认证** - Better-Auth 实现邮箱/密码登录（GitHub OAuth 预留）
- **多租户组织** - 组织创建、切换、删除，数据完全隔离
- **成员管理** - 邀请链接、角色管理、成员移除
- **权限控制** - RBAC 角色权限（Owner / Admin / Member）
- **订阅套餐** - 免费版 / 专业版 / 企业版，不同功能权限
- **积分系统** - 组织级积分池，按使用量计费
- **积分购买** - 支持积分包购买（模拟微信支付）

## 🛠 技术栈

- **前端**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **UI**: shadcn/ui, Radix UI, Lucide Icons
- **后端**: Next.js API Routes
- **认证**: Better-Auth + Prisma Adapter
- **数据库**: SQLite + Prisma ORM
- **AI**: Claude Agent SDK (WebSearch, WebFetch)

## 📁 项目结构

```
├── app/
│   ├── (auth)/              # 认证页面
│   │   ├── signin/          # 登录
│   │   ├── signup/          # 注册
│   │   └── invite/[code]/   # 邀请接受
│   ├── (marketing)/         # 营销页面
│   │   ├── page.tsx         # 落地页
│   │   └── pricing/         # 定价页
│   ├── dashboard/           # 用户工作台
│   │   ├── page.tsx         # 仪表盘概览
│   │   ├── research/        # 发起研究
│   │   ├── history/         # 研究历史
│   │   └── credits/         # 积分管理
│   ├── org/                 # 组织管理
│   │   ├── page.tsx         # 组织设置
│   │   ├── create/          # 创建组织
│   │   └── members/         # 成员管理
│   └── api/                 # API 路由
│       ├── auth/            # Better-Auth 处理
│       ├── organization/    # 组织 CRUD
│       ├── research/        # 研究任务
│       ├── credits/         # 积分查询
│       ├── payment/         # 支付处理
│       └── subscription/    # 订阅管理
├── components/
│   ├── auth/                # 登录/注册表单
│   ├── dashboard/           # Header、Sidebar、OrgSwitcher
│   ├── marketing/           # Navbar、Footer
│   └── ui/                  # shadcn/ui 组件
├── lib/
│   ├── auth.ts              # Better-Auth 服务端配置
│   ├── auth-client.ts       # Better-Auth 客户端
│   ├── db.ts                # Prisma Client
│   ├── organization/        # 组织服务层
│   ├── credits/             # 积分服务层
│   ├── subscription/        # 订阅服务层
│   ├── payment/             # 支付服务层
│   └── research/            # 研究服务层
├── config/
│   └── index.ts             # 统一配置（套餐、积分、权限）
└── prisma/
    └── schema.prisma        # 数据库模型定义
```

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# 数据库
DATABASE_URL="file:./prisma/dev.db"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Claude AI（必需）
ANTHROPIC_API_KEY="your-anthropic-api-key"

# GitHub OAuth（可选，暂未启用）
# GITHUB_CLIENT_ID="your-github-client-id"
# GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 3. 初始化数据库

```bash
npx prisma migrate dev
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 📊 数据库模型

### 认证相关
- `User` - 用户（含 activeOrgId 跟踪当前组织）
- `Session` - 会话
- `Account` - 第三方账号关联
- `Verification` - 验证码

### 组织相关
- `Organization` - 组织
- `OrgMember` - 组织成员（含角色）
- `OrgInvite` - 邀请链接
- `OrgSubscription` - 组织订阅套餐

### 积分相关
- `OrgCredits` - 组织积分余额
- `CreditTransaction` - 积分交易记录
- `Order` - 支付订单

### 业务数据
- `ResearchSession` - 研究会话（关联用户和组织）

## 🔐 权限系统

| 权限 | Owner | Admin | Member |
|------|:-----:|:-----:|:------:|
| 删除组织 | ✅ | ❌ | ❌ |
| 编辑组织信息 | ✅ | ✅ | ❌ |
| 邀请成员 | ✅ | ✅ | ❌ |
| 移除成员 | ✅ | ✅ | ❌ |
| 修改成员角色 | ✅ | ❌ | ❌ |
| 购买积分 | ✅ | ✅ | ❌ |
| 发起研究 | ✅ | ✅ | ✅ |
| 查看研究历史 | ✅ | ✅ | ✅ |
| 删除所有研究 | ✅ | ❌ | ❌ |
| 删除自己的研究 | ✅ | ✅ | ✅ |

## 💎 订阅套餐

| 功能 | 免费版 | 专业版 | 企业版 |
|------|:------:|:------:|:------:|
| 价格 | ¥0/月 | ¥299/月 | ¥999/月 |
| 团队成员 | 3 人 | 10 人 | 无限 |
| 月度积分 | 500 | 5,000 | 20,000 |
| 摘要研究 | ✅ | ✅ | ✅ |
| 深度分析 | ❌ | ✅ | ✅ |
| 对比研究 | ❌ | ✅ | ✅ |
| 导出 PDF | ❌ | ✅ | ✅ |
| 优先支持 | ❌ | ✅ | ✅ |
| 专属客服 | ❌ | ❌ | ✅ |

## 💰 积分规则

### 消耗规则
| 研究类型 | 消耗积分 |
|---------|:-------:|
| 摘要研究 | 10 |
| 深度分析 | 25 |
| 对比研究 | 30 |

### 积分包购买
| 积分包 | 价格 | 赠送 |
|-------|:----:|:----:|
| 500 积分 | ¥49 | - |
| 1,000 积分 | ¥99 | +100 |
| 3,000 积分 | ¥249 | +500 |

## 🎯 API 接口

### 认证
- `POST /api/auth/*` - Better-Auth 统一处理

### 组织
- `GET /api/organization` - 获取用户的组织列表
- `POST /api/organization` - 创建组织
- `GET /api/organization/[orgId]` - 获取组织详情
- `PATCH /api/organization/[orgId]` - 更新组织信息
- `DELETE /api/organization/[orgId]` - 删除组织
- `GET /api/organization/[orgId]/members` - 获取成员列表
- `PATCH /api/organization/[orgId]/members` - 更新成员角色
- `DELETE /api/organization/[orgId]/members` - 移除成员
- `POST /api/organization/invite` - 创建邀请链接
- `GET /api/organization/invite/verify` - 验证邀请码
- `POST /api/organization/join` - 接受邀请加入
- `POST /api/organization/switch` - 切换当前组织

### 研究
- `POST /api/research` - 发起研究（检查套餐权限，扣减积分）
- `GET /api/research/[id]` - 获取研究状态和结果
- `GET /api/research/[id]/stream` - SSE 实时进度流

### 历史
- `GET /api/history` - 获取组织研究历史
- `GET /api/history/[id]` - 获取单条研究详情
- `DELETE /api/history/[id]` - 删除研究记录（需权限）

### 积分
- `GET /api/credits/balance` - 获取积分余额和组织信息
- `GET /api/credits/transactions` - 获取交易记录

### 支付
- `POST /api/payment/wechat/create` - 创建支付订单
- `POST /api/payment/wechat/confirm` - 确认支付（模拟）
- `GET /api/payment/wechat/status` - 查询订单状态

### 订阅
- `POST /api/subscription/upgrade` - 升级订阅套餐

## 🎨 页面导航

| 页面 | 路径 | 说明 |
|------|-----|------|
| 落地页 | `/` | 产品介绍 |
| 定价页 | `/pricing` | 套餐对比和积分包 |
| 登录 | `/signin` | 邮箱密码登录 |
| 注册 | `/signup` | 用户注册 |
| 邀请 | `/invite/[code]` | 接受组织邀请 |
| 仪表盘 | `/dashboard` | 概览统计 |
| 发起研究 | `/dashboard/research` | 创建研究任务 |
| 研究历史 | `/dashboard/history` | 查看和管理历史 |
| 积分管理 | `/dashboard/credits` | 余额和购买 |
| 组织设置 | `/org` | 编辑组织信息 |
| 创建组织 | `/org/create` | 新建组织 |
| 成员管理 | `/org/members` | 邀请和管理成员 |

## 📝 MVP 说明

### 当前实现
- ✅ 邮箱密码认证
- ✅ 多租户组织管理
- ✅ 完整权限控制（RBAC）
- ✅ 三档订阅套餐
- ✅ 积分系统（消耗 + 购买）
- ✅ 研究类型限制（按套餐）
- ✅ 成员数量限制（按套餐）
- ✅ 研究历史管理

### 暂未实现
- ⏸️ GitHub OAuth（已预留，需配置）
- ⏸️ 真实微信支付（当前为模拟）
- ⏸️ 月度积分自动发放（需定时任务）
- ⏸️ 邮件通知（邀请、支付等）
- ⏸️ 研究历史分页

### 后续扩展建议
1. 接入真实微信支付 API
2. 配置 GitHub OAuth 应用
3. 添加邮件通知服务
4. 实现月度积分自动发放（Cron Job）
5. 研究历史分页和搜索
6. PDF 导出功能
7. API 访问密钥
8. SSO 单点登录

## 🧪 测试流程

1. 访问 http://localhost:3000 → 落地页
2. 点击「开始免费试用」→ 注册账号
3. 注册后自动跳转创建组织页面
4. 创建组织后进入仪表盘
5. 测试功能：
   - 发起摘要研究（免费版可用）
   - 尝试深度分析（提示需升级）
   - 邀请成员（复制邀请链接）
   - 购买积分（模拟支付）
   - 切换组织（如有多个）

## 📄 License

MIT
