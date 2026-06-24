import { useGetDashboardSummary, useGetRecentActivity, useGetRecruitmentFunnel, useGetFinancialSnapshot, getGetDashboardSummaryQueryKey, getGetRecruitmentFunnelQueryKey, getGetFinancialSnapshotQueryKey, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, Briefcase, UserCheck, Calendar, TrendingUp, TrendingDown, DollarSign, Flame, Bot, Mail, Phone, Clock, CheckCircle2, AlertCircle, Star, Bell, ArrowRight, MessageSquare } from "lucide-react";
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

type AiNotification = {
  id: string;
  type: "interview_scored" | "new_application";
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  score?: number;
  recommendation?: string;
  summary?: string;
  strengths?: string[];
  interview_status?: string;
  email_notified?: boolean;
  timestamp: string;
};

type NotificationsResponse = {
  notifications: AiNotification[];
  admin_configured: { email: boolean; sms: boolean; admin_email: string | null; admin_phone: string | null };
};

function useAiNotifications() {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/recruitment/notifications", {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}` },
    })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

const REC_META: Record<string, { label: string; color: string; icon: string }> = {
  strong_hire: { label: "Strong Hire", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: "🏆" },
  hire:        { label: "Hire",        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",   icon: "✅" },
  maybe:       { label: "Maybe",       color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: "🔄" },
  no_hire:     { label: "No Hire",     color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",       icon: "❌" },
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className={cn("text-lg font-bold tabular-nums", score >= 75 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-500")}>{score}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">/ 100</span>
    </div>
  );
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const summary = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const activity = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  const funnel = useGetRecruitmentFunnel({ query: { queryKey: getGetRecruitmentFunnelQueryKey() } });
  const financial = useGetFinancialSnapshot({ query: { queryKey: getGetFinancialSnapshotQueryKey() } });
  const notifications = useAiNotifications();

  const s = summary.data as Record<string, number> | undefined;
  const fin = financial.data as { months?: string[]; revenue_trend?: number[]; expense_trend?: number[]; profit_trend?: number[] } | undefined;
  const funnelData = (funnel.data as { stages?: { stage: string; count: number; percentage: number }[] } | undefined)?.stages ?? [];
  const activityData = (activity.data as { id: string; title: string; description: string; user_name: string; created_at: string }[] | undefined) ?? [];

  const chartData = fin?.months?.map((month, i) => ({
    month,
    revenue: fin.revenue_trend?.[i] ?? 0,
    expenses: fin.expense_trend?.[i] ?? 0,
  })) ?? [];

  const fmt = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  const notifs = notifications.data?.notifications ?? [];
  const scored = notifs.filter(n => n.type === "interview_scored");
  const pending = notifs.filter(n => n.type === "new_application");
  const topPicks = scored.filter(n => n.recommendation === "strong_hire" || n.recommendation === "hire");
  const adminCfg = notifications.data?.admin_configured;

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

      {/* AI Recruiter Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: Scored interviews */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" /> AI Recruiter Inbox
                {scored.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">{scored.length}</span>
                )}
              </CardTitle>
              <Link href="/candidates">
                <span className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-0.5">All candidates <ArrowRight className="w-3 h-3" /></span>
              </Link>
            </div>
            {/* Admin notification status */}
            {!notifications.loading && adminCfg && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground">Recruiter alerts:</span>
                {adminCfg.email
                  ? <span className="flex items-center gap-1 text-xs text-green-600"><Mail className="w-3 h-3" /> {adminCfg.admin_email}</span>
                  : <Link href="/admin"><span className="text-xs text-amber-600 hover:underline cursor-pointer flex items-center gap-1"><Mail className="w-3 h-3" /> Set recruiter email →</span></Link>}
                {adminCfg.sms
                  ? <span className="flex items-center gap-1 text-xs text-green-600"><MessageSquare className="w-3 h-3" /> {adminCfg.admin_phone}</span>
                  : null}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {notifications.loading ? <Skeleton className="h-48" /> : scored.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No AI-scored interviews yet</p>
                <p className="text-xs mt-1 max-w-xs mx-auto">When a candidate completes their AI interview via the public job board, their score and recommendation will appear here instantly.</p>
                <Link href="/"><span className="text-xs text-primary hover:underline cursor-pointer mt-3 inline-block">View public job board →</span></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {scored.slice(0, 6).map(n => {
                  const rec = REC_META[n.recommendation ?? ""] ?? { label: "Pending", color: "bg-muted text-muted-foreground", icon: "🔄" };
                  return (
                    <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0 font-bold">
                        {n.candidate_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{n.candidate_name}</span>
                          <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", rec.color)}>{rec.icon} {rec.label}</span>
                          {n.email_notified && <span className="flex items-center gap-0.5 text-xs text-green-600"><Mail className="w-3 h-3" /> Notified</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.job_title} · {timeAgo(n.timestamp)}</p>
                        {n.score != null && <ScoreBar score={n.score} />}
                        {n.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.summary}</p>}
                        {(n.strengths ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(n.strengths ?? []).slice(0, 3).map(s => (
                              <span key={s} className="text-xs bg-muted px-1.5 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Top Picks + Pending */}
        <div className="space-y-4">

          {/* Top picks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Top AI Picks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.loading ? <Skeleton className="h-32" /> : topPicks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No "Hire" or "Strong Hire" candidates yet</p>
              ) : (
                <div className="space-y-2.5">
                  {topPicks.slice(0, 4).map(n => (
                    <div key={n.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                        {n.candidate_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{n.candidate_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.job_title}</p>
                      </div>
                      <div className={cn("text-sm font-bold tabular-nums shrink-0", n.score! >= 75 ? "text-green-600" : "text-blue-600")}>
                        {n.score}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending interviews */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Awaiting Interview
                {pending.length > 0 && <span className="text-xs text-muted-foreground font-normal">({pending.length})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.loading ? <Skeleton className="h-32" /> : pending.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No pending interviews</p>
              ) : (
                <div className="space-y-2">
                  {pending.slice(0, 5).map(n => (
                    <div key={n.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                        {n.candidate_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{n.candidate_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.job_title}</p>
                      </div>
                      {n.interview_status === "in_progress" ? (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600 shrink-0"><Clock className="w-3 h-3" /> Live</span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0"><AlertCircle className="w-3 h-3" /> Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification config prompt */}
          {!notifications.loading && !adminCfg?.email && !adminCfg?.sms && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Recruiter alerts not set up</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Add your email/phone to get notified instantly when candidates apply or score.</p>
                    <Link href="/admin">
                      <span className="text-xs font-medium text-amber-800 dark:text-amber-300 underline cursor-pointer mt-1 inline-flex items-center gap-0.5">
                        Set up in Admin → Communications <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
