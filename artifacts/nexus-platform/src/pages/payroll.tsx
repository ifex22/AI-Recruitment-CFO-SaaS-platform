import { useState } from "react";
import { useListPayrollRuns, useCreatePayrollRun, useProcessPayrollRun, useGetPayrollSummary, getListPayrollRunsQueryKey, getGetPayrollSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, CreditCard, PlayCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  approved: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const schema = z.object({
  period_start: z.string().min(1, "Required"),
  period_end: z.string().min(1, "Required"),
  notes: z.string().optional(),
});
type RunForm = z.infer<typeof schema>;

type PayrollRun = { id: string; period_start: string; period_end: string; status: string; total_gross: number; total_net: number; total_tax: number; total_benefits: number; employee_count: number; processed_at?: string | null; created_at: string };

export default function PayrollPage() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const runs = useListPayrollRuns({ query: { queryKey: getListPayrollRunsQueryKey() } });
  const summary = useGetPayrollSummary({ query: { queryKey: getGetPayrollSummaryQueryKey() } });
  const createRun = useCreatePayrollRun();
  const processRun = useProcessPayrollRun();

  const form = useForm<RunForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
    },
  });

  const runsData = runs.data as PayrollRun[] | undefined ?? [];
  const summaryData = summary.data as { total_monthly_payroll?: number; ytd_payroll?: number; avg_salary?: number; by_department?: { department: string; headcount: number; total_cost: number; avg_salary: number }[] } | undefined;

  const onSubmit = (data: RunForm) => {
    createRun.mutate({ data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPayrollRunsQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Payroll run created" });
      },
      onError: () => toast({ title: "Failed to create payroll run", variant: "destructive" }),
    });
  };

  const handleProcess = (id: string) => {
    if (!confirm("Process this payroll run? This will mark it as completed.")) return;
    processRun.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPayrollRunsQueryKey() });
        toast({ title: "Payroll processed successfully" });
      },
      onError: () => toast({ title: "Failed to process payroll", variant: "destructive" }),
    });
  };

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Payroll</h1>
          <p className="text-sm text-muted-foreground">Manage payroll runs and compensation</p>
        </div>
        <Button data-testid="button-create-payroll" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Payroll Run
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {summary.isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />) : (
          <>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Monthly Payroll</p><p className="text-2xl font-bold">{fmt(summaryData?.total_monthly_payroll ?? 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">YTD Payroll</p><p className="text-2xl font-bold">{fmt(summaryData?.ytd_payroll ?? 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Salary</p><p className="text-2xl font-bold">{fmt(summaryData?.avg_salary ?? 0)}</p></CardContent></Card>
          </>
        )}
      </div>

      {/* Dept breakdown */}
      {summaryData?.by_department && summaryData.by_department.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Payroll Cost by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={summaryData.by_department}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total_cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Monthly Cost" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Payroll runs */}
      {runs.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : runsData.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No payroll runs yet</p></div>
      ) : (
        <div className="space-y-3">
          {runsData.map(run => (
            <Card key={run.id} data-testid={`card-payroll-${run.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-sm">
                        {new Date(run.period_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(run.period_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </h3>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLORS[run.status] ?? "")}>{run.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{run.employee_count} employees</p>
                    <div className="grid grid-cols-4 gap-4 mt-3">
                      {[
                        { label: "Gross", value: fmt(run.total_gross) },
                        { label: "Tax", value: fmt(run.total_tax) },
                        { label: "Benefits", value: fmt(run.total_benefits) },
                        { label: "Net", value: fmt(run.total_net), bold: true },
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className={cn("text-sm font-semibold", item.bold ? "text-primary" : "text-foreground")}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {run.status === "draft" && (
                      <Button data-testid={`button-process-${run.id}`} size="sm" onClick={() => handleProcess(run.id)} disabled={processRun.isPending}>
                        <PlayCircle className="w-4 h-4 mr-1.5" /> Process
                      </Button>
                    )}
                    {run.status === "completed" && <span className="text-xs text-green-600 font-medium">Processed {run.processed_at ? new Date(run.processed_at).toLocaleDateString() : ""}</span>}
                    {run.status === "approved" && <span className="text-xs text-purple-600 font-medium">Approved</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Payroll Run</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Period Start</Label>
              <Input data-testid="input-period-start" type="date" {...form.register("period_start")} />
            </div>
            <div className="space-y-1.5">
              <Label>Period End</Label>
              <Input data-testid="input-period-end" type="date" {...form.register("period_end")} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input data-testid="input-notes" {...form.register("notes")} placeholder="Optional notes" />
            </div>
            <p className="text-xs text-muted-foreground">Payroll amounts will be calculated automatically from active employee salaries.</p>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button data-testid="button-save-payroll" type="submit" disabled={createRun.isPending}>{createRun.isPending ? "Creating..." : "Create Run"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
