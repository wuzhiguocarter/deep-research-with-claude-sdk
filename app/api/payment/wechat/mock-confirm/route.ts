import { NextRequest, NextResponse } from "next/server";
import { WechatPayService } from "@/lib/payment/wechat";

/**
 * MVP 模拟支付确认接口
 * 真实环境应由微信服务器回调
 */
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "订单ID不能为空" }, { status: 400 });
  }

  try {
    await WechatPayService.handlePaymentSuccess(orderId);

    // 返回成功页面
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>支付成功</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .success {
              color: #22c55e;
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 { margin: 0 0 10px; }
            p { color: #666; margin: 0 0 20px; }
            a {
              display: inline-block;
              background: #000;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
            }
            a:hover { background: #333; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success">✓</div>
            <h1>支付成功！</h1>
            <p>积分已到账，请返回应用查看</p>
            <a href="/dashboard/credits">返回积分页面</a>
          </div>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (error) {
    console.error("确认支付失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "确认支付失败" },
      { status: 500 }
    );
  }
}
