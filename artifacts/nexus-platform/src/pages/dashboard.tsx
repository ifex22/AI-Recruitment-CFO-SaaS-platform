import { useGetDashboardSummary, useGetRecentActivity, useGetRecruitmentFunnel, useGetFinancialSnapshot, getGetDashboardSummaryQueryKey, getGetRecruitmentFunnelQueryKey, getGetFinancialSnapshotQueryKey, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Users, Briefcase, UserCheck, Calendar, TrendingUp, TrendingDown, DollarSign, Flame, Bot, Mail, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
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

type AiCandidate = {
  id: string; name: string; email: string; status: string;
  interview_status?: string; interview_score?: number; recommendation?: string; email_sent?: boolean; job_title?: string; applied_at?: string;
};

function useAiPipeline() {
  const [data, setData] = useState<AiCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/candidates", { headers: { Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}` } })
      .then(r => r.json())
      .then((rows: Record<string, unknown>[]) => {
        const mapped = (Array.isArray(rows) ? rows : []).map(r => {
          let extra: Record<string, unknown> = {};
          try { extra = JSON.parse((r.address as string) ?? "{}"); } catch {}
          const score = extra.interview_score as Record<string, unknown> | undefined;
          return {
            id: r.id as string, name: r.name as string, email: r.email as string,
            status: r.status as string,
            job_title: (extra.job_title as string) ?? "",
            interview_status: (extra.interview_status as string) ?? "pending",
            interview_score: score ? Number(score.overall_score ?? 0) : undefined,
            recommendation: score ? (score.recommendation as string) : undefined,
            email_sent: !!(extra.email_sent),
            applied_at: r.joined as string,
          };
        }).filter(c => c.interview_status !== undefined);
        setData(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  return { data, loading };
}

const REC_COLORS: Record<string, string> = {
  strong_hire: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
  hire: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  maybe: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
  no_hire: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
};
const REC_LABEL: Record<string, string> = { strong_hire: "Strong Hire", hire: "Hire", maybe: "Maybe", no_hire: "No Hire" };

export default function DashboardPage() {
  const { user } = useAuth();
  const summary = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const activity = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  const funnel = useGetRecruitmentFunnel({ query: { queryKey: getGetRecruitmentFunnelQueryKey() } });
  const financial = useGetFinancialSnapshot({ query: { queryKey: getGetFinancialSnapshotQueryKey() } });
  const pipeline = useAiPipeline();

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

      {/* AI Recruitment Pipeline */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" /> AI Recruitment Pipeline
            </CardTitle>
            <Link href="/candidates">
              <span className="text-xs text-primary hover:underline cursor-pointer">View all candidates →</span>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pipeline.loading ? <Skeleton className="h-40" /> : pipeline.data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No candidates in the AI pipeline yet.</p>
              <p className="text-xs mt-1">Applications via the public portal will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Candidate</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Role</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Interview</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">AI Score</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Result</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pipeline.data.slice(0, 8).map(c => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4">
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[140px]">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">{c.email}</p>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground truncate max-w-[120px]">{c.job_title || "—"}</td>
                      <td className="py-2.5 pr-4">
                        {c.interview_status === "completed" ? (
                          <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>
                        ) : c.interview_status === "in_progress" || c.interview_status === "awaiting_score" ? (
                          <span className="flex items-center gap-1 text-xs text-amber-600"><Clock className="w-3.5 h-3.5" /> In progress</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><AlertCircle className="w-3.5 h-3.5" /> Pending</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        {c.interview_score != null ? (
                          <span className={cn("font-bold text-sm", c.interview_score >= 75 ? "text-green-600" : c.interview_score >= 50 ? "text-amber-600" : "text-red-500")}>
                            {c.interview_score}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="py-2.5 pr-4">
                        {c.recommendation ? (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", REC_COLORS[c.recommendation] ?? "")}>
                            {REC_LABEL[c.recommendation] ?? c.recommendation}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="py-2.5">
                        {c.email_sent ? (
                          <span className="flex items-center gap-1 text-xs text-green-600"><Mail className="w-3.5 h-3.5" /> Sent</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
