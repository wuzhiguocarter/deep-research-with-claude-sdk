import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Deep Research</h3>
            <p className="text-sm text-muted-foreground">
              AI 驱动的企业级深度研究平台，让研究工作更高效。
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">产品</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  定价
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-foreground">
                  功能介绍
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">资源</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground">
                  帮助中心
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  API 文档
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">法律</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  服务条款
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Deep Research. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
