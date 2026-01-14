import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import { CreditService } from "@/lib/credits/service";
import { creditPackages } from "@/config";

/**
 * 微信支付服务
 * 注意：这是 MVP 版本，使用模拟支付流程
 * 生产环境需要接入真实的微信支付 API
 */
export class WechatPayService {
  /**
   * 创建支付订单
   */
  static async createOrder(params: {
    orgId: string;
    userId: string;
    packageId: string;
  }) {
    const { orgId, userId, packageId } = params;

    // 查找积分包
    const creditPackage = creditPackages.find((p) => p.id === packageId);
    if (!creditPackage) {
      throw new Error("积分包不存在");
    }

    const totalCredits = creditPackage.credits + creditPackage.bonus;

    // 创建订单
    const order = await prisma.order.create({
      data: {
        orgId,
        userId,
        type: "credits",
        status: "pending",
        amount: creditPackage.price,
        credits: totalCredits,
        provider: "wechat",
        providerOrderId: `WX${Date.now()}${nanoid(6)}`,
        // MVP: 生成模拟二维码 URL
        qrcodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOCK_PAY_${nanoid(8)}`,
      },
    });

    return {
      orderId: order.id,
      amount: creditPackage.price,
      credits: totalCredits,
      qrcodeUrl: order.qrcodeUrl,
      // MVP 模式：提供手动确认链接
      mockConfirmUrl: `/api/payment/wechat/mock-confirm?orderId=${order.id}`,
    };
  }

  /**
   * 处理支付成功（真实环境由微信回调触发）
   */
  static async handlePaymentSuccess(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("订单不存在");
    }

    if (order.status === "paid") {
      return order; // 已处理过
    }

    // 更新订单状态
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "paid",
        paidAt: new Date(),
      },
    });

    // 增加积分
    await CreditService.add({
      orgId: order.orgId,
      userId: order.userId,
      amount: order.credits,
      type: "purchase",
      description: `购买积分 ${order.credits} 个`,
      metadata: { orderId: order.id },
    });

    return order;
  }

  /**
   * 查询订单状态
   */
  static async getOrderStatus(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("订单不存在");
    }

    return {
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      credits: order.credits,
      paidAt: order.paidAt,
    };
  }
}
