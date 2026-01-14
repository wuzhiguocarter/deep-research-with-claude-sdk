"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search,
  History,
  Coins,
  Settings,
  Building2,
  Users,
  LayoutDashboard,
} from "lucide-react";

const navItems = [
  {
    title: "仪表盘",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "发起研究",
    href: "/dashboard/research",
    icon: Search,
  },
  {
    title: "研究历史",
    href: "/dashboard/history",
    icon: History,
  },
  {
    title: "积分管理",
    href: "/dashboard/credits",
    icon: Coins,
  },
];

// 检查路径是否匹配（精确匹配或开头匹配）
const isActive = (pathname: string, href: string) => {
  // 这些路径需要精确匹配
  if (href === "/dashboard" || href === "/org") {
    return pathname === href;
  }
  return pathname.startsWith(href);
};

const orgItems = [
  {
    title: "组织设置",
    href: "/org",
    icon: Building2,
  },
  {
    title: "成员管理",
    href: "/org/members",
    icon: Users,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/30 min-h-screen">
      <div className="p-6">
        <Link href="/dashboard" className="text-xl font-bold">
          Deep Research
        </Link>
      </div>

      <nav className="px-4 space-y-6">
        {/* 主导航 */}
        <div>
          <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            研究
          </h3>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(pathname, item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 组织导航 */}
        <div>
          <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            组织
          </h3>
          <ul className="space-y-1">
            {orgItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(pathname, item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
