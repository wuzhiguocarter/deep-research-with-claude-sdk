import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import type { OrgRole } from "@/config";
import { plans } from "@/config";

/**
 * 组织服务
 */
export class OrganizationService {
  /**
   * 创建组织
   */
  static async create(data: {
    name: string;
    slug: string;
    userId: string;
  }) {
    const initialCredits = plans.free.features.monthlyCredits; // 使用免费套餐的月度积分作为初始积分

    // 创建组织并添加创建者为 owner
    const org = await prisma.$transaction(async (tx) => {
      // 创建组织
      const newOrg = await tx.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
        },
      });

      // 添加创建者为 owner
      await tx.orgMember.create({
        data: {
          orgId: newOrg.id,
          userId: data.userId,
          role: "owner",
        },
      });

      // 初始化组织积分
      await tx.orgCredits.create({
        data: {
          orgId: newOrg.id,
          balance: initialCredits,
        },
      });

      // 记录积分交易
      await tx.creditTransaction.create({
        data: {
          orgId: newOrg.id,
          userId: data.userId,
          type: "bonus",
          amount: initialCredits,
          balance: initialCredits,
          description: "新组织注册赠送",
        },
      });

      // 创建订阅记录（默认免费套餐）
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await tx.orgSubscription.create({
        data: {
          orgId: newOrg.id,
          plan: "free",
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: nextMonth,
          lastCreditGrantAt: new Date(), // 标记已发放首月积分
        },
      });

      // 更新用户的当前组织
      await tx.user.update({
        where: { id: data.userId },
        data: { activeOrgId: newOrg.id },
      });

      return newOrg;
    });

    return org;
  }

  /**
   * 获取用户当前激活的组织
   */
  static async getCurrentOrganization(userId: string) {
    // 先获取用户的 activeOrgId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeOrgId: true },
    });

    // 获取用户的所有组织
    const orgs = await this.getUserOrganizations(userId);
    
    if (orgs.length === 0) {
      return null;
    }

    // 如果有 activeOrgId，返回对应组织
    if (user?.activeOrgId) {
      const activeOrg = orgs.find((org) => org.id === user.activeOrgId);
      if (activeOrg) {
        return activeOrg;
      }
    }

    // 否则返回第一个组织
    return orgs[0];
  }

  /**
   * 获取用户的所有组织
   */
  static async getUserOrganizations(userId: string) {
    const memberships = await prisma.orgMember.findMany({
      where: { userId },
      include: {
        org: {
          include: {
            credits: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return memberships.map((m) => ({
      ...m.org,
      role: m.role as OrgRole,
      memberCount: m.org._count.members,
      credits: m.org.credits?.balance ?? 0,
    }));
  }

  /**
   * 获取组织详情
   */
  static async getById(orgId: string) {
    return prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        credits: true,
        _count: {
          select: { members: true, researches: true },
        },
      },
    });
  }

  /**
   * 获取组织成员
   */
  static async getMembers(orgId: string) {
    const members = await prisma.orgMember.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role as OrgRole,
      createdAt: m.createdAt,
      user: m.user,
    }));
  }

  /**
   * 检查用户是否是组织成员
   */
  static async isMember(userId: string, orgId: string) {
    const member = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: { userId, orgId },
      },
    });
    return !!member;
  }

  /**
   * 获取用户在组织中的角色
   */
  static async getUserRole(userId: string, orgId: string): Promise<OrgRole | null> {
    const member = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: { userId, orgId },
      },
    });
    return member?.role as OrgRole | null;
  }

  /**
   * 生成邀请链接
   */
  static async createInvite(data: {
    orgId: string;
    email: string;
    role: OrgRole;
  }) {
    const code = nanoid(12);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 天后过期

    const invite = await prisma.orgInvite.create({
      data: {
        orgId: data.orgId,
        email: data.email,
        role: data.role,
        code,
        expiresAt,
      },
    });

    return invite;
  }

  /**
   * 验证邀请码
   */
  static async verifyInvite(code: string) {
    const invite = await prisma.orgInvite.findUnique({
      where: { code },
      include: { org: true },
    });

    if (!invite) {
      return { valid: false, error: "邀请码不存在" };
    }

    if (invite.usedAt) {
      return { valid: false, error: "邀请码已被使用" };
    }

    if (invite.expiresAt < new Date()) {
      return { valid: false, error: "邀请码已过期" };
    }

    return { valid: true, invite };
  }

  /**
   * 接受邀请加入组织
   */
  static async acceptInvite(code: string, userId: string) {
    const result = await this.verifyInvite(code);
    
    if (!result.valid || !result.invite) {
      throw new Error(result.error);
    }

    const { invite } = result;

    // 检查是否已经是成员
    const existingMember = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: { userId, orgId: invite.orgId },
      },
    });

    if (existingMember) {
      throw new Error("您已经是该组织的成员");
    }

    // 加入组织
    await prisma.$transaction(async (tx) => {
      // 创建成员关系
      await tx.orgMember.create({
        data: {
          orgId: invite.orgId,
          userId,
          role: invite.role,
        },
      });

      // 标记邀请码已使用
      await tx.orgInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      // 更新用户的当前组织
      await tx.user.update({
        where: { id: userId },
        data: { activeOrgId: invite.orgId },
      });
    });

    return invite.org;
  }

  /**
   * 移除成员
   */
  static async removeMember(orgId: string, userId: string) {
    // 检查是否是 owner
    const member = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: { userId, orgId },
      },
    });

    if (member?.role === "owner") {
      throw new Error("无法移除组织拥有者");
    }

    await prisma.orgMember.delete({
      where: {
        userId_orgId: { userId, orgId },
      },
    });
  }

  /**
   * 更新成员角色
   */
  static async updateMemberRole(orgId: string, userId: string, role: OrgRole) {
    // 不能将 owner 降级
    const member = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: { userId, orgId },
      },
    });

    if (member?.role === "owner" && role !== "owner") {
      throw new Error("无法降低组织拥有者的角色");
    }

    await prisma.orgMember.update({
      where: {
        userId_orgId: { userId, orgId },
      },
      data: { role },
    });
  }

  /**
   * 切换用户的当前组织
   */
  static async switchOrg(userId: string, orgId: string) {
    // 验证用户是组织成员
    const isMember = await this.isMember(userId, orgId);
    if (!isMember) {
      throw new Error("您不是该组织的成员");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { activeOrgId: orgId },
    });
  }

  /**
   * 检查 slug 是否可用
   */
  static async isSlugAvailable(slug: string) {
    const org = await prisma.organization.findUnique({
      where: { slug },
    });
    return !org;
  }
}
