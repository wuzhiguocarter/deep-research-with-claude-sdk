import { prisma } from "@/lib/db";
import { creditRules, type ResearchType } from "@/config";

/**
 * 积分服务
 */
export class CreditService {
  /**
   * 获取组织积分余额
   */
  static async getBalance(orgId: string): Promise<number> {
    const credits = await prisma.orgCredits.findUnique({
      where: { orgId },
    });
    return credits?.balance ?? 0;
  }

  /**
   * 检查积分是否足够
   */
  static async checkBalance(orgId: string, required: number): Promise<boolean> {
    const balance = await this.getBalance(orgId);
    return balance >= required;
  }

  /**
   * 消耗积分
   */
  static async consume(params: {
    orgId: string;
    userId: string;
    amount: number;
    description: string;
    metadata?: Record<string, unknown>;
  }) {
    const { orgId, userId, amount, description, metadata } = params;

    return await prisma.$transaction(async (tx) => {
      // 获取当前余额
      const credits = await tx.orgCredits.findUnique({
        where: { orgId },
      });

      if (!credits || credits.balance < amount) {
        throw new Error("积分不足");
      }

      // 扣减余额
      const newCredits = await tx.orgCredits.update({
        where: { orgId },
        data: { balance: { decrement: amount } },
      });

      // 记录交易
      await tx.creditTransaction.create({
        data: {
          orgId,
          userId,
          type: "consume",
          amount: -amount,
          balance: newCredits.balance,
          description,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      return newCredits;
    });
  }

  /**
   * 研究消耗积分
   */
  static async consumeForResearch(params: {
    orgId: string;
    userId: string;
    researchType: ResearchType;
    researchId: string;
  }) {
    const { orgId, userId, researchType, researchId } = params;
    const cost = creditRules.research[researchType];

    return this.consume({
      orgId,
      userId,
      amount: cost,
      description: `研究消耗：${researchType}`,
      metadata: { researchId, researchType },
    });
  }

  /**
   * 获取研究消耗的积分数
   */
  static getResearchCost(researchType: ResearchType): number {
    return creditRules.research[researchType];
  }

  /**
   * 增加积分（购买/赠送）
   */
  static async add(params: {
    orgId: string;
    userId: string;
    amount: number;
    type: "purchase" | "bonus" | "refund";
    description: string;
    metadata?: Record<string, unknown>;
  }) {
    const { orgId, userId, amount, type, description, metadata } = params;

    return await prisma.$transaction(async (tx) => {
      // 增加余额
      const newCredits = await tx.orgCredits.upsert({
        where: { orgId },
        update: { balance: { increment: amount } },
        create: { orgId, balance: amount },
      });

      // 记录交易
      await tx.creditTransaction.create({
        data: {
          orgId,
          userId,
          type,
          amount,
          balance: newCredits.balance,
          description,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      return newCredits;
    });
  }

  /**
   * 获取交易记录
   */
  static async getTransactions(orgId: string, limit = 20) {
    return prisma.creditTransaction.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
