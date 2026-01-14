import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 简单的头部 */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="text-xl font-bold">
            Deep Research
          </Link>
        </div>
      </header>

      {/* 居中的认证表单 */}
      <main className="flex-1 flex items-center justify-center p-4 bg-muted/30">
        {children}
      </main>

      {/* 简单的页脚 */}
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 Deep Research. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
