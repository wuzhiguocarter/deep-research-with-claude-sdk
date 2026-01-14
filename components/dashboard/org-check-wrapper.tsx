"use client";

import { useEffect, useState } from "react";
import { CreateOrgRequiredDialog } from "./create-org-required-dialog";
import { Loader2 } from "lucide-react";

interface OrgCheckWrapperProps {
  children: React.ReactNode;
}

export function OrgCheckWrapper({ children }: OrgCheckWrapperProps) {
  const [hasOrg, setHasOrg] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkOrganization();
  }, []);

  const checkOrganization = async () => {
    try {
      const res = await fetch("/api/organization");
      const data = await res.json();
      
      // 如果用户有至少一个组织，则 hasOrg 为 true
      setHasOrg(Array.isArray(data) && data.length > 0);
    } catch (error) {
      console.error("检查组织失败:", error);
      // 出错时假设没有组织，显示创建对话框
      setHasOrg(false);
    } finally {
      setIsChecking(false);
    }
  };

  // 检查中显示加载状态
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <CreateOrgRequiredDialog open={hasOrg === false} />
    </>
  );
}
