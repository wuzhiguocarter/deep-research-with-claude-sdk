"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold">
            Deep Research
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              定价
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              功能
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <Button asChild>
              <Link href="/dashboard">进入工作台</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/signin">登录</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">免费开始</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
