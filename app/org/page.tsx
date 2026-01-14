"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useToast } from "@/components/ui/toast";
import { Building2, Loader2, Save, Trash2, AlertTriangle } from "lucide-react";
import { notifyOrgUpdated } from "@/lib/org-event";
import { hasPermission, type OrgRole } from "@/config";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: OrgRole;
  credits: number;
}

export default function OrgSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  // 删除组织相关状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadOrganization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrganization = async () => {
    try {
      // 获取当前激活的组织（通过 credits/balance API 获取 orgId）
      const balanceRes = await fetch("/api/credits/balance");
      const balanceData = await balanceRes.json();
      
      if (!balanceData.hasOrg) {
        // 没有组织，跳转到创建页面
        router.push("/org/create");
        return;
      }

      // 获取组织详情
      const orgRes = await fetch(`/api/organization/${balanceData.orgId}`);
      const orgData = await orgRes.json();
      
      setOrganization(orgData);
      setName(orgData.name);
    } catch (error) {
      console.error("加载组织失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization || !name.trim()) return;

    setIsSaving(true);
    setMessage("");

    try {
      const res = await fetch(`/api/organization/${organization.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setMessage("保存成功！");
        loadOrganization();
        // 通知头部组织选择器刷新
        notifyOrgUpdated();
      } else {
        const data = await res.json();
        setMessage(data.error || "保存失败");
      }
    } catch (error) {
      setMessage("保存失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  };

  // 删除组织
  const handleDelete = async () => {
    if (!organization || deleteConfirmName !== organization.name) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/organization/${organization.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // 通知头部刷新
        notifyOrgUpdated();
        
        // 检查是否还有其他组织
        const orgsRes = await fetch("/api/organization");
        const orgs = await orgsRes.json();
        
        if (Array.isArray(orgs) && orgs.length > 0) {
          // 还有其他组织，切换到第一个组织并跳转到仪表盘
          await fetch("/api/organization/switch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orgId: orgs[0].id }),
          });
          router.push("/dashboard");
        } else {
          // 没有其他组织，跳转到创建组织页面
          router.push("/org/create");
        }
      } else {
        const data = await res.json();
        toast({
          title: "删除组织失败",
          description: data.error || "请稍后重试",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "删除组织失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // 权限检查
  const canEdit = organization?.role ? hasPermission(organization.role, "org:update") : false;
  const canDelete = organization?.role ? hasPermission(organization.role, "org:delete") : false;

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 bg-muted/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </main>
        </div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-muted/10">
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-3xl font-bold">组织设置</h1>
              <p className="text-muted-foreground">管理您的组织信息</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  基本信息
                </CardTitle>
                <CardDescription>
                  组织的基本信息设置
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {message && (
                  <div className={`p-3 text-sm rounded-md ${
                    message.includes("成功") 
                      ? "text-green-600 bg-green-50" 
                      : "text-red-500 bg-red-50"
                  }`}>
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">组织名称</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canEdit || isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">组织标识</label>
                  <Input
                    value={organization.slug}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    组织标识创建后无法修改
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">您的角色</label>
                  <Input
                    value={
                      organization.role === "owner"
                        ? "拥有者"
                        : organization.role === "admin"
                        ? "管理员"
                        : "成员"
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>

                {canEdit && (
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    保存更改
                  </Button>
                )}

                {!canEdit && (
                  <p className="text-sm text-muted-foreground">
                    只有拥有者和管理员可以修改组织设置
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 组织统计 */}
            <Card>
              <CardHeader>
                <CardTitle>组织统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">当前积分</p>
                    <p className="text-2xl font-bold">{organization.credits}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">组织 ID</p>
                    <p className="text-sm font-mono">{organization.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 危险操作区域 - 仅 owner 可见 */}
            {canDelete && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    危险区域
                  </CardTitle>
                  <CardDescription>
                    以下操作不可逆，请谨慎操作
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <p className="font-medium text-red-700">删除组织</p>
                      <p className="text-sm text-red-600">
                        删除后所有数据将永久丢失，包括研究记录、积分等
                      </p>
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除组织
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              确认删除组织
            </DialogTitle>
            <DialogDescription>
              此操作不可逆！删除组织将永久删除以下所有数据：
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>所有研究记录和报告</li>
              <li>所有积分和交易记录</li>
              <li>所有成员关联（成员账号保留）</li>
              <li>所有邀请链接</li>
            </ul>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
              请输入组织名称 <strong>&ldquo;{organization?.name}&rdquo;</strong> 以确认删除
            </div>

            <Input
              placeholder="请输入组织名称"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmName("");
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || deleteConfirmName !== organization?.name}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
