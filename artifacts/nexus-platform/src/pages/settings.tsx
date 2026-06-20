import { useGetMe, useGetOrganization, getGetMeQueryKey, getGetOrganizationQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { Settings, User, Building2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const me = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const org = useGetOrganization({ query: { queryKey: getGetOrganizationQueryKey() } });

  const orgData = org.data as { name?: string; industry?: string; size?: string; headquarters?: string; currency?: string } | undefined;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account and organization settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4" />Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {me.isLoading ? <Skeleton className="h-32" /> : (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                    {user?.full_name?.charAt(0) ?? "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{user?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">{user?.role?.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium text-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Organization</p>
                    <p className="text-sm font-medium text-foreground">{user?.organization_name ?? "—"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" />Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {org.isLoading ? <Skeleton className="h-32" /> : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Name", value: orgData?.name },
                  { label: "Industry", value: orgData?.industry },
                  { label: "Size", value: orgData?.size ? `${orgData.size} employees` : undefined },
                  { label: "HQ", value: orgData?.headquarters },
                  { label: "Currency", value: orgData?.currency },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value ?? "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Settings className="w-4 h-4" />Platform Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Platform", value: "Nexus AI" },
                { label: "Version", value: "1.0.0" },
                { label: "Environment", value: import.meta.env.MODE },
                { label: "API Status", value: "Connected" },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
