import { useGetDashboardSummary, useGetRecentActivity, useGetRecruitmentFunnel, useGetFinancialSnapshot, getGetDashboardSummaryQueryKey, getGetRecruitmentFunnelQueryKey, getGetFinancialSnapshotQueryKey, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Users, Briefcase, UserCheck, Calendar, TrendingUp, TrendingDown, DollarSign, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ label, value, icon: Icon, sub, trend }: { label: string; value: string | number; icon: React.ElementType; sub?: string; trend?: "up" | "down" }) {
  return (
    <Card data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 mt-3 text-xs font-medium", trend === "up" ? "text-green-600" : "text-red-500")}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend === "up" ? "Trending up" : "Trending down"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const STAGE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#06b6d4", "#ef4444"];

export default function DashboardPage() {
  const { user } = useAuth();
  const summary = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const activity = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  const funnel = useGetRecruitmentFunnel({ query: { queryKey: getGetRecruitmentFunnelQueryKey() } });
  const financial = useGetFinancialSnapshot({ query: { queryKey: getGetFinancialSnapshotQueryKey() } });

  const s = summary.data as Record<string, number> | undefined;
  const fin = financial.data as { months?: string[]; revenue_trend?: number[]; expense_trend?: number[]; profit_trend?: number[] } | undefined;
  const funnelData = (funnel.data as { stages?: { stage: string; count: number; percentage: number }[] } | undefined)?.stages ?? [];
  const activityData = (activity.data as { id: string; title: string; description: string; user_name: string; created_at: string }[] | undefined) ?? [];

  const chartData = fin?.months?.map((month, i) => ({
    month,
    revenue: fin.revenue_trend?.[i] ?? 0,
    expenses: fin.expense_trend?.[i] ?? 0,
    profit: fin.profit_trend?.[i] ?? 0,
  })) ?? [];

  const fmt = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.full_name}. Here&apos;s your organization at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Active Employees" value={s?.total_employees ?? 0} icon={Users} trend="up" />
            <StatCard label="Open Jobs" value={s?.open_jobs ?? 0} icon={Briefcase} />
            <StatCard label="Active Candidates" value={s?.active_candidates ?? 0} icon={UserCheck} trend="up" />
            <StatCard label="Interviews Scheduled" value={s?.interviews_scheduled ?? 0} icon={Calendar} />
            <StatCard label="Monthly Revenue" value={fmt(s?.monthly_revenue ?? 0)} icon={DollarSign} trend="up" />
            <StatCard label="Monthly Expenses" value={fmt(s?.monthly_expenses ?? 0)} icon={Flame} />
            <StatCard label="Net Profit" value={fmt(s?.net_profit ?? 0)} icon={TrendingUp} trend={s?.net_profit && s.net_profit > 0 ? "up" : "down"} />
            <StatCard label="Cash Runway" value={`${s?.cash_runway_months ?? 0} mo`} icon={TrendingUp} sub="Months of runway" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Financial trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Financial Overview — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            {financial.isLoading ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recruitment funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recruitment Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {funnel.isLoading ? <Skeleton className="h-52" /> : (
              <div className="space-y-2.5">
                {funnelData.map((stage, i) => (
                  <div key={stage.stage} data-testid={`funnel-stage-${stage.stage}`}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium capitalize text-foreground">{stage.stage}</span>
                      <span className="text-muted-foreground">{stage.count} ({stage.percentage}%)</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${stage.percentage}%`, backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.isLoading ? <Skeleton className="h-32" /> : activityData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activityData.slice(0, 8).map(item => (
                <div key={item.id} data-testid={`activity-${item.id}`} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.user_name} &middot; {new Date(item.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
