import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser, useGetOrganization, useUpdateOrganization, useListAuditLogs, getListUsersQueryKey, getGetOrganizationQueryKey, getListAuditLogsQueryKey } from "@workspace/api-client-react";
import type { UserInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit2, Shield, History } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  recruiter: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  hr_manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  cfo: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  manager: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  viewer: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const userSchema = z.object({
  email: z.string().email("Invalid email"),
  full_name: z.string().min(1, "Required"),
  role: z.string().min(1, "Required"),
});
type UserForm = z.infer<typeof userSchema>;

const orgSchema = z.object({
  name: z.string().min(1, "Required"),
  industry: z.string().optional(),
  size: z.string().optional(),
  headquarters: z.string().optional(),
  currency: z.string().optional(),
  fiscal_year_start: z.string().optional(),
});
type OrgForm = z.infer<typeof orgSchema>;

type PlatformUser = { id: string; email: string; full_name: string; role: string; status: string; created_at: string };
type OrgData = { name?: string; industry?: string; size?: string; headquarters?: string; currency?: string; fiscal_year_start?: string };
type AuditLog = { id: string; action: string; entity_type: string; user_name: string; details?: string; created_at: string };

export default function AdminPage() {
  const [userOpen, setUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<PlatformUser | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const users = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const org = useGetOrganization({ query: { queryKey: getGetOrganizationQueryKey() } });
  const auditLogs = useListAuditLogs(undefined, { query: { queryKey: getListAuditLogsQueryKey() } });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const updateOrg = useUpdateOrganization();

  const userForm = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: "", full_name: "", role: "viewer" },
  });

  const orgData = org.data as OrgData | undefined;
  const orgForm = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    values: { name: orgData?.name ?? "", industry: orgData?.industry ?? "", size: orgData?.size ?? "", headquarters: orgData?.headquarters ?? "", currency: orgData?.currency ?? "USD", fiscal_year_start: orgData?.fiscal_year_start ?? "January" },
  });

  const usersData = users.data as PlatformUser[] | undefined ?? [];
  const logsData = auditLogs.data as AuditLog[] | undefined ?? [];

  const onUserSubmit = (data: UserForm) => {
    if (editUser) {
      updateUser.mutate({ id: editUser.id, data }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setEditUser(null);
          toast({ title: "User updated" });
        },
      });
    } else {
      createUser.mutate({ data: data as UserInput }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setUserOpen(false);
          userForm.reset();
          toast({ title: "User invited" });
        },
        onError: () => toast({ title: "Failed to invite user", variant: "destructive" }),
      });
    }
  };

  const onOrgSubmit = (data: OrgForm) => {
    updateOrg.mutate({ data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetOrganizationQueryKey() });
        toast({ title: "Organization settings saved" });
      },
      onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
    });
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (!confirm(`Deactivate ${name}?`)) return;
    deleteUser.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "User deactivated" });
      },
    });
  };

  const openEdit = (user: PlatformUser) => {
    setEditUser(user);
    userForm.setValue("email", user.email);
    userForm.setValue("full_name", user.full_name);
    userForm.setValue("role", user.role);
  };

  const closeModal = () => {
    setUserOpen(false);
    setEditUser(null);
    userForm.reset();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage users, organization settings, and audit logs</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Shield className="w-3.5 h-3.5 mr-1.5" />Users</TabsTrigger>
          <TabsTrigger value="org">Organization</TabsTrigger>
          <TabsTrigger value="audit"><History className="w-3.5 h-3.5 mr-1.5" />Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button data-testid="button-invite-user" onClick={() => setUserOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Invite User
            </Button>
          </div>
          {users.isLoading ? <Skeleton className="h-64" /> : usersData.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><p className="text-sm">No users found</p></div>
          ) : (
            <div className="space-y-2">
              {usersData.map(user => (
                <Card key={user.id} data-testid={`card-user-${user.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{user.full_name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{user.full_name}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ROLE_COLORS[user.role] ?? "")}>{user.role.replace("_", " ")}</span>
                          {user.status !== "active" && <span className="text-xs text-muted-foreground">{user.status}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button data-testid={`button-edit-${user.id}`} variant="ghost" size="sm" onClick={() => openEdit(user)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button data-testid={`button-delete-${user.id}`} variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteUser(user.id, user.full_name)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="org" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Organization Settings</CardTitle></CardHeader>
            <CardContent>
              {org.isLoading ? <Skeleton className="h-64" /> : (
                <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5"><Label>Organization Name</Label><Input data-testid="input-org-name" {...orgForm.register("name")} /></div>
                    <div className="space-y-1.5"><Label>Industry</Label><Input data-testid="input-industry" {...orgForm.register("industry")} placeholder="Technology" /></div>
                    <div className="space-y-1.5"><Label>Company Size</Label>
                      <Select value={orgForm.watch("size")} onValueChange={v => orgForm.setValue("size", v)}>
                        <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                        <SelectContent>
                          {["1-10", "11-50", "51-200", "201-500", "500+"].map(s => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Headquarters</Label><Input data-testid="input-hq" {...orgForm.register("headquarters")} placeholder="San Francisco, CA" /></div>
                    <div className="space-y-1.5"><Label>Currency</Label>
                      <Select value={orgForm.watch("currency")} onValueChange={v => orgForm.setValue("currency", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["USD", "EUR", "GBP", "CAD", "AUD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Fiscal Year Start</Label>
                      <Select value={orgForm.watch("fiscal_year_start")} onValueChange={v => orgForm.setValue("fiscal_year_start", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["January", "April", "July", "October"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button data-testid="button-save-org" type="submit" disabled={updateOrg.isPending}>{updateOrg.isPending ? "Saving..." : "Save Settings"}</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4 space-y-3">
          {auditLogs.isLoading ? <Skeleton className="h-64" /> : logsData.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><History className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No audit logs</p></div>
          ) : (
            <div className="space-y-2">
              {logsData.map(log => (
                <Card key={log.id} data-testid={`card-audit-${log.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground uppercase">{log.action}</span>
                          <span className="text-xs text-muted-foreground capitalize">{log.entity_type.replace("_", " ")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.details}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{log.user_name} &middot; {new Date(log.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* User Modal */}
      <Dialog open={userOpen || !!editUser} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editUser ? "Edit User" : "Invite User"}</DialogTitle></DialogHeader>
          <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label>Full Name</Label><Input data-testid="input-full-name" {...userForm.register("full_name")} placeholder="Jane Smith" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input data-testid="input-email" {...userForm.register("email")} placeholder="jane@company.com" disabled={!!editUser} /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={userForm.watch("role")} onValueChange={v => userForm.setValue("role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["admin", "recruiter", "hr_manager", "cfo", "manager", "viewer"].map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button data-testid="button-save-user" type="submit" disabled={createUser.isPending || updateUser.isPending}>
                {editUser ? (updateUser.isPending ? "Saving..." : "Save Changes") : (createUser.isPending ? "Inviting..." : "Send Invite")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
