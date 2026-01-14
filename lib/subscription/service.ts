/**
 * 订阅服务
 * 处理套餐相关的业务逻辑
 */

import { prisma } from "@/lib/db";
import { plans, PlanId } from "@/config";
import { CreditService } from "@/lib/credits/service";

export class SubscriptionService {
  /**
   * 获取组织的订阅信息
   */
  static async getSubscription(orgId: string) {
    let subscription = await prisma.orgSubscription.findUnique({
      where: { orgId },
    });

    // 如果没有订阅记录，创建默认的免费套餐
    if (!subscription) {
      subscription = await prisma.orgSubscription.create({
        data: {
          orgId,
          plan: "free",
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: this.getNextMonthDate(),
        },
      });
    }

    return subscription;
  }

  /**
   * 获取组织当前套餐
   */
  static async getOrgPlan(orgId: string): Promise<PlanId> {
    const subscription = await this.getSubscription(orgId);
    return (subscription.plan as PlanId) || "free";
  }

  /**
   * 获取套餐配置
   */
  static getPlanConfig(planId: PlanId) {
    return plans[planId];
  }

  /**
   * 检查是否可以添加新成员
   */
  static async canAddMember(orgId: string): Promise<{ allowed: boolean; reason?: string; limit?: number; current?: number }> {
    const planId = await this.getOrgPlan(orgId);
    const plan = this.getPlanConfig(planId);
    const maxMembers = plan.features.members;

    // -1 表示无限
    if (maxMembers === -1) {
      return { allowed: true };
    }

    // 获取当前成员数量
    const currentMemberCount = await prisma.orgMember.count({
      where: { orgId },
    });

    if (currentMemberCount >= maxMembers) {
      return {
        allowed: false,
        reason: `当前套餐（${plan.name}）最多支持 ${maxMembers} 位成员，请升级套餐`,
        limit: maxMembers,
        current: currentMemberCount,
      };
    }

    return { allowed: true, limit: maxMembers, current: currentMemberCount };
  }

  /**
   * 检查是否可以使用某种研究类型
   */
  static async canUseResearchType(orgId: string, researchType: string): Promise<{ allowed: boolean; reason?: string }> {
    const planId = await this.getOrgPlan(orgId);
    const plan = this.getPlanConfig(planId);
    const allowedTypes = plan.features.researchTypes;

    if (!allowedTypes.includes(researchType)) {
      const typeNames: Record<string, string> = {
        summary: "摘要研究",
        analysis: "深度分析",
        comparison: "对比研究",
      };
      return {
        allowed: false,
        reason: `当前套餐（${plan.name}）不支持${typeNames[researchType] || researchType}，请升级到专业版或企业版`,
      };
    }

    return { allowed: true };
  }

  /**
   * 发放月度积分
   * 检查并为符合条件的组织发放月度积分
   */
  static async grantMonthlyCredits(orgId: string): Promise<{ granted: boolean; amount?: number; reason?: string }> {
    const subscription = await this.getSubscription(orgId);
    const planId = subscription.plan as PlanId;
    const plan = this.getPlanConfig(planId);
    const monthlyCredits = plan.features.monthlyCredits;

    if (monthlyCredits <= 0) {
      return { granted: false, reason: "当前套餐没有月度积分" };
    }

    const now = new Date();
    const lastGrant = subscription.lastCreditGrantAt;

    // 检查是否已经在本月发放过
    if (lastGrant) {
      const lastGrantMonth = lastGrant.getMonth();
      const lastGrantYear = lastGrant.getFullYear();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (lastGrantYear === currentYear && lastGrantMonth === currentMonth) {
        return { granted: false, reason: "本月积分已发放" };
      }
    }

    // 发放积分
    await CreditService.add({
      orgId,
      userId: "system",
      amount: monthlyCredits,
      type: "bonus",
      description: "月度套餐积分",
    });

    // 更新发放时间
    await prisma.orgSubscription.update({
      where: { orgId },
      data: { lastCreditGrantAt: now },
    });

    return { granted: true, amount: monthlyCredits };
  }

  /**
   * 批量处理所有组织的月度积分发放
   * 用于定时任务
   */
  static async processAllMonthlyCredits(): Promise<{ processed: number; granted: number; errors: number }> {
    const organizations = await prisma.organization.findMany({
      select: { id: true },
    });

    let processed = 0;
    let granted = 0;
    let errors = 0;

    for (const org of organizations) {
      try {
        const result = await this.grantMonthlyCredits(org.id);
        processed++;
        if (result.granted) {
          granted++;
        }
      } catch (error) {
        console.error(`发放月度积分失败 (orgId: ${org.id}):`, error);
        errors++;
      }
    }

    return { processed, granted, errors };
  }

  /**
   * 升级套餐
   */
  static async upgradePlan(orgId: string, newPlanId: PlanId): Promise<void> {
    const now = new Date();
    
    await prisma.orgSubscription.upsert({
      where: { orgId },
      create: {
        orgId,
        plan: newPlanId,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: this.getNextMonthDate(),
      },
      update: {
        plan: newPlanId,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: this.getNextMonthDate(),
        updatedAt: now,
      },
    });
  }

  /**
   * 获取下个月同一天的日期
   */
  private static getNextMonthDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }
}
