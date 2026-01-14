import { NextRequest, NextResponse } from "next/server";
import { WechatPayService } from "@/lib/payment/wechat";

// GET: 查询订单状态
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "订单ID不能为空" }, { status: 400 });
  }

  try {
    const status = await WechatPayService.getOrderStatus(orderId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("查询订单状态失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询订单状态失败" },
      { status: 500 }
    );
  }
}
