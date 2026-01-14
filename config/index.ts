/**
 * 应用配置
 */

// 积分消耗规则
export const creditRules = {
  research: {
    summary: 10,      // 摘要研究消耗 10 积分
    analysis: 25,     // 深度分析消耗 25 积分
    comparison: 30,   // 对比研究消耗 30 积分
  },
} as const;

// 定价套餐
export const plans = {
  free: {
    id: "free",
    name: "免费版",
    price: 0,
    priceDisplay: "¥0",
    period: "月",
    features: {
      members: 3,
      monthlyCredits: 500,
      researchTypes: ["summary"] as string[],
      exportPdf: false,
      prioritySupport: false,
    },
    featureList: [
      "3 位团队成员",
      "500 积分/月",
      "仅摘要研究",
    ],
  },
  pro: {
    id: "pro",
    name: "专业版",
    price: 29900, // 分
    priceDisplay: "¥299",
    period: "月",
    recommended: true,
    features: {
      members: 10,
      monthlyCredits: 5000,
      researchTypes: ["summary", "analysis", "comparison"] as string[],
      exportPdf: true,
      prioritySupport: true,
    },
    featureList: [
      "10 位团队成员",
      "5000 积分/月",
      "全部研究类型",
      "导出 Markdown",
      "优先客服支持",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "企业版",
    price: 99900, // 分
    priceDisplay: "¥999",
    period: "月",
    features: {
      members: -1, // 无限
      monthlyCredits: 20000,
      researchTypes: ["summary", "analysis", "comparison"] as string[],
      exportPdf: true,
      prioritySupport: true,
      dedicatedSupport: true,
    },
    featureList: [
      "无限团队成员",
      "20000 积分/月",
      "全部研究类型",
      "导出 Markdown",
      "专属客服",
    ],
  },
} as const;

export type PlanId = keyof typeof plans;

// 积分充值包
export const creditPackages = [
  { id: "credits_1000", credits: 1000, price: 9900, bonus: 0, priceDisplay: "¥99" },
  { id: "credits_5000", credits: 5000, price: 39900, bonus: 500, priceDisplay: "¥399" },
  { id: "credits_20000", credits: 20000, price: 129900, bonus: 3000, priceDisplay: "¥1299" },
] as const;

// 组织角色
export const orgRoles = {
  owner: "owner",
  admin: "admin", 
  member: "member",
} as const;

export type OrgRole = keyof typeof orgRoles;

// 角色权限映射
export const rolePermissions = {
  owner: [
    "org:delete",
    "org:update",
    "member:invite",
    "member:remove",
    "member:update_role",
    "credits:purchase",
    "credits:view",
    "research:create",
    "research:view_all",
    "research:delete_all",
  ],
  admin: [
    "org:update",
    "member:invite",
    "member:remove",
    "credits:purchase",
    "credits:view",
    "research:create",
    "research:view_all",
    "research:delete_own",
  ],
  member: [
    "credits:view",
    "research:create",
    "research:view_all",
    "research:delete_own",
  ],
} as const;

// 权限检查函数
export function hasPermission(role: OrgRole, permission: string): boolean {
  const permissions = rolePermissions[role];
  return permissions?.includes(permission as never) ?? false;
}

// 研究类型名称
export const researchTypeNames = {
  summary: "摘要研究",
  analysis: "深度分析",
  comparison: "对比研究",
} as const;

export type ResearchType = keyof typeof researchTypeNames;
