"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Loader2, Copy, Check, Trash2, Shield, Pencil } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { hasPermission, type OrgRole } from "@/config";

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Organization {
  id: string;
  name: string;
  role: OrgRole;
}

export default function MembersPage() {
  const { toast } = useToast();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 邀请相关状态
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteUrl, setInviteUrl] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 修改角色相关状态
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  // 移除成员确认弹窗状态
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentOrganization();
  }, []);

  useEffect(() => {
    if (currentOrg) {
      loadMembers(currentOrg.id);
    }
  }, [currentOrg]);

  const loadCurrentOrganization = async () => {
    try {
      // 获取当前激活的组织
      const balanceRes = await fetch("/api/credits/balance");
      const balanceData = await balanceRes.json();
      
      if (!balanceData.hasOrg) {
        setIsLoading(false);
        return;
      }

      // 获取组织详情
      const orgRes = await fetch(`/api/organization/${balanceData.orgId}`);
      const orgData = await orgRes.json();
      
      setCurrentOrg(orgData);
    } catch (error) {
      console.error("加载组织失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async (orgId: string) => {
    try {
      const res = await fetch(`/api/organization/${orgId}/members`);
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error("加载成员失败:", error);
    }
  };

  const handleInvite = async () => {
    if (!currentOrg || !inviteEmail) return;

    setIsInviting(true);
    try {
      const res = await fetch("/api/organization/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: currentOrg.id,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setInviteUrl(data.inviteUrl);
      } else {
        toast({
          title: "创建邀请失败",
          description: data.error || "请稍后重试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("创建邀请失败:", error);
      toast({
        title: "创建邀请失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 打开移除成员确认弹窗
  const openRemoveDialog = (userId: string) => {
    setMemberToRemove(userId);
    setRemoveDialogOpen(true);
  };

  // 确认移除成员
  const confirmRemoveMember = async () => {
    if (!currentOrg || !memberToRemove) return;

    try {
      const res = await fetch(`/api/organization/${currentOrg.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberToRemove }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        toast({
          title: "移除成员失败",
          description: data.error || "请稍后重试",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "移除成功",
        description: "成员已从组织中移除",
        variant: "success",
      });
      
      loadMembers(currentOrg.id);
    } catch (error) {
      console.error("移除成员失败:", error);
      toast({
        title: "移除成员失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  // 打开修改角色弹窗
  const openRoleDialog = (member: Member) => {
    setEditingMember(member);
    setNewRole(member.role);
    setRoleDialogOpen(true);
  };

  // 修改成员角色
  const handleUpdateRole = async () => {
    if (!currentOrg || !editingMember || !newRole) return;
    if (newRole === editingMember.role) {
      setRoleDialogOpen(false);
      return;
    }

    setIsUpdatingRole(true);
    try {
      const res = await fetch(`/api/organization/${currentOrg.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: editingMember.userId,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast({
          title: "修改角色失败",
          description: data.error || "请稍后重试",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "修改成功",
        description: "成员角色已更新",
        variant: "success",
      });

      loadMembers(currentOrg.id);
      setRoleDialogOpen(false);
    } catch (error) {
      console.error("修改角色失败:", error);
      toast({
        title: "修改角色失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge>拥有者</Badge>;
      case "admin":
        return <Badge variant="secondary">管理员</Badge>;
      default:
        return <Badge variant="outline">成员</Badge>;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner": return "拥有者";
      case "admin": return "管理员";
      default: return "成员";
    }
  };

  // 权限检查
  const canInvite = currentOrg?.role ? hasPermission(currentOrg.role, "member:invite") : false;
  const canRemove = currentOrg?.role ? hasPermission(currentOrg.role, "member:remove") : false;
  const canUpdateRole = currentOrg?.role ? hasPermission(currentOrg.role, "member:update_role") : false;

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

  if (!currentOrg) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 bg-muted/10">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">请先创建一个组织</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-muted/10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">成员管理</h1>
                <p className="text-muted-foreground">
                  管理 {currentOrg.name} 的团队成员
                </p>
              </div>

              {canInvite && (
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) {
                    setInviteUrl("");
                    setInviteEmail("");
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      邀请成员
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>邀请新成员</DialogTitle>
                      <DialogDescription>
                        生成邀请链接发送给新成员
                      </DialogDescription>
                    </DialogHeader>

                    {!inviteUrl ? (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">邮箱地址</label>
                          <Input
                            placeholder="member@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">角色</label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">成员</SelectItem>
                              <SelectItem value="admin">管理员</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">邀请链接</p>
                          <p className="text-xs text-muted-foreground break-all">
                            {inviteUrl}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleCopyUrl}
                        >
                          {copied ? (
                            <Check className="mr-2 h-4 w-4" />
                          ) : (
                            <Copy className="mr-2 h-4 w-4" />
                          )}
                          {copied ? "已复制" : "复制链接"}
                        </Button>
                      </div>
                    )}

                    <DialogFooter>
                      {!inviteUrl ? (
                        <Button onClick={handleInvite} disabled={isInviting || !inviteEmail}>
                          {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          生成邀请链接
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setInviteUrl("");
                            setInviteEmail("");
                            setDialogOpen(false);
                          }}
                        >
                          完成
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  团队成员 ({members.length})
                </CardTitle>
                <CardDescription>
                  查看和管理组织内所有成员
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {member.user.image ? (
                            <img
                              src={member.user.image}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {(member.user.name || member.user.email)[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.user.name || "未设置姓名"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* 角色标签 */}
                        {getRoleBadge(member.role)}
                        
                        {/* 操作按钮组 */}
                        {member.role !== "owner" && (
                          <div className="flex items-center gap-1">
                            {/* 编辑角色按钮：仅 owner 可见 */}
                            {canUpdateRole && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRoleDialog(member)}
                                title="修改角色"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                            
                            {/* 删除按钮：owner/admin 可见 */}
                            {canRemove && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRemoveDialog(member.userId)}
                                title="移除成员"
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* 修改角色弹窗 */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              修改成员角色
            </DialogTitle>
            <DialogDescription>
              为 {editingMember?.user.name || editingMember?.user.email} 设置新角色
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">选择角色</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex flex-col">
                      <span>管理员</span>
                      <span className="text-xs text-muted-foreground">
                        可以邀请/移除成员、购买积分
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex flex-col">
                      <span>成员</span>
                      <span className="text-xs text-muted-foreground">
                        仅可使用研究功能
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">当前角色：{getRoleLabel(editingMember?.role || "")}</p>
              <p className="text-muted-foreground">
                {newRole === editingMember?.role 
                  ? "角色未变更" 
                  : `将变更为：${getRoleLabel(newRole)}`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleUpdateRole} 
              disabled={isUpdatingRole || newRole === editingMember?.role}
            >
              {isUpdatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 移除成员确认弹窗 */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除成员</AlertDialogTitle>
            <AlertDialogDescription>
              确定要将该成员从组织中移除吗？移除后，该成员将无法访问组织资源。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemoveMember}>
              移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
