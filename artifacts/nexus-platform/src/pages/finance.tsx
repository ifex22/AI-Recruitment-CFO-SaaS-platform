import { useState } from "react";
import { useListTransactions, useCreateTransaction, useDeleteTransaction, useGetIncomeStatement, useGetCashFlow, useGetFinancialForecast, getListTransactionsQueryKey, getGetIncomeStatementQueryKey, getGetCashFlowQueryKey, getGetFinancialForecastQueryKey } from "@workspace/api-client-react";
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
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

const schema = z.object({
  type: z.enum(["revenue", "expense"]),
  category: z.string().min(1, "Required"),
  amount: z.number().positive("Must be positive"),
  description: z.string().min(1, "Required"),
  date: z.string().min(1, "Required"),
  vendor: z.string().optional(),
  department: z.string().optional(),
  status: z.string().default("completed"),
});
type TxForm = z.infer<typeof schema>;

type Transaction = { id: string; type: string; category: string; amount: number; description: string; date: string; vendor?: string | null; department?: string | null; status: string };
type ForecastData = { burn_rate?: number; runway_months?: number; risk_level?: string; insights?: string[]; next_quarter_revenue?: number; next_quarter_expenses?: number; forecast_months?: { month: string; projected_revenue: number; projected_expenses: number; projected_profit: number }[] };

export default function FinancePage() {
  const [open, setOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const qc = useQueryClient();
  const { toast } = useToast();

  const transactions = useListTransactions(undefined, { query: { queryKey: getListTransactionsQueryKey() } });
  const incomeStmt = useGetIncomeStatement(undefined, { query: { queryKey: getGetIncomeStatementQueryKey() } });
  const cashFlow = useGetCashFlow(undefined, { query: { queryKey: getGetCashFlowQueryKey() } });
  const forecast = useGetFinancialForecast({ query: { queryKey: getGetFinancialForecastQueryKey() } });
  const createTxn = useCreateTransaction();
  const deleteTxn = useDeleteTransaction();

  const form = useForm<TxForm>({
    resolver: zodResolver(schema),
    defaultValues: { type: "revenue", category: "", amount: 0, description: "", date: new Date().toISOString().slice(0, 10), status: "completed" },
  });

  const txData = transactions.data as Transaction[] | undefined ?? [];
  const filteredTx = typeFilter === "all" ? txData : txData.filter(t => t.type === typeFilter);
  const income = incomeStmt.data as { total_revenue?: number; total_expenses?: number; net_profit?: number; profit_margin?: number; revenue_by_category?: { category: string; amount: number }[]; expense_by_category?: { category: string; amount: number }[] } | undefined;
  const flow = cashFlow.data as { monthly_data?: { month: string; inflows: number; outflows: number; net: number }[] } | undefined;
  const fcst = forecast.data as ForecastData | undefined;

  const onSubmit = (data: TxForm) => {
    createTxn.mutate({ data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetIncomeStatementQueryKey() });
        qc.invalidateQueries({ queryKey: getGetCashFlowQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Transaction added" });
      },
      onError: () => toast({ title: "Failed to add transaction", variant: "destructive" }),
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    deleteTxn.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        toast({ title: "Transaction deleted" });
      },
    });
  };

  const fmt = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
  const fmtFull = (n: number) => `$${n.toLocaleString()}`;

  const riskColor = { low: "text-green-600", medium: "text-amber-600", high: "text-red-600" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Finance & CFO Dashboard</h1>
          <p className="text-sm text-muted-foreground">Financial health, transactions, and forecasting</p>
        </div>
        <Button data-testid="button-add-transaction" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Transaction
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {incomeStmt.isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />) : (
          <>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Revenue (MTD)</p><p className="text-xl font-bold text-green-600">{fmt(income?.total_revenue ?? 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Expenses (MTD)</p><p className="text-xl font-bold text-red-500">{fmt(income?.total_expenses ?? 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Net Profit</p><p className={cn("text-xl font-bold", (income?.net_profit ?? 0) >= 0 ? "text-green-600" : "text-red-500")}>{fmt(income?.net_profit ?? 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Profit Margin</p><p className="text-xl font-bold">{income?.profit_margin ?? 0}%</p></CardContent></Card>
          </>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="forecast">AI Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Cash Flow — Last 6 Months</CardTitle></CardHeader>
              <CardContent>
                {cashFlow.isLoading ? <Skeleton className="h-48" /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={flow?.monthly_data ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="inflows" fill="#10b981" radius={[3, 3, 0, 0]} name="Inflows" />
                      <Bar dataKey="outflows" fill="#ef4444" radius={[3, 3, 0, 0]} name="Outflows" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Revenue Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(income?.revenue_by_category ?? []).map(cat => (
                    <div key={cat.category} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{cat.category}</span>
                      <span className="font-semibold text-green-600">{fmtFull(cat.amount)}</span>
                    </div>
                  ))}
                  {!income?.revenue_by_category?.length && <p className="text-sm text-muted-foreground">No data for this period</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Expense Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(income?.expense_by_category ?? []).map(cat => (
                    <div key={cat.category} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{cat.category}</span>
                      <span className="font-semibold text-red-500">{fmtFull(cat.amount)}</span>
                    </div>
                  ))}
                  {!income?.expense_by_category?.length && <p className="text-sm text-muted-foreground">No data for this period</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type" className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {transactions.isLoading ? <Skeleton className="h-64" /> : filteredTx.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No transactions</p></div>
          ) : (
            <div className="space-y-2">
              {filteredTx.map(tx => (
                <Card key={tx.id} data-testid={`card-transaction-${tx.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", tx.type === "revenue" ? "bg-green-100" : "bg-red-100")}>
                        {tx.type === "revenue" ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.category} &middot; {tx.date} {tx.vendor ? `· ${tx.vendor}` : ""} {tx.department ? `· ${tx.department}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn("font-bold text-sm", tx.type === "revenue" ? "text-green-600" : "text-red-500")}>
                          {tx.type === "revenue" ? "+" : "−"}{fmtFull(tx.amount)}
                        </span>
                        <Button data-testid={`button-delete-${tx.id}`} variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(tx.id)}>
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

        <TabsContent value="forecast" className="mt-4 space-y-4">
          {forecast.isLoading ? <Skeleton className="h-64" /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Q3 Revenue (proj.)</p><p className="text-xl font-bold text-green-600">{fmt(fcst?.next_quarter_revenue ?? 0)}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Q3 Expenses (proj.)</p><p className="text-xl font-bold text-red-500">{fmt(fcst?.next_quarter_expenses ?? 0)}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Monthly Burn Rate</p><p className="text-xl font-bold">{fmt(fcst?.burn_rate ?? 0)}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cash Runway</p>
                  <p className={cn("text-xl font-bold", riskColor[fcst?.risk_level as "low" | "medium" | "high"] ?? "text-foreground")}>{fcst?.runway_months ?? "?"} <span className="text-sm font-normal">months</span></p>
                </CardContent></Card>
              </div>
              {fcst?.insights && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">AI Insights</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {fcst.insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{insight}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">6-Month Forecast</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={fcst?.forecast_months ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="projected_revenue" stroke="#10b981" strokeWidth={2} fill="#10b98115" name="Revenue" />
                      <Area type="monotone" dataKey="projected_expenses" stroke="#ef4444" strokeWidth={2} fill="#ef444415" name="Expenses" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Transaction Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.watch("type")} onValueChange={v => form.setValue("type", v as "revenue" | "expense")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input data-testid="input-category" {...form.register("category")} placeholder="e.g. SaaS Revenue" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Input data-testid="input-description" {...form.register("description")} placeholder="Transaction description" />
              </div>
              <div className="space-y-1.5">
                <Label>Amount ($)</Label>
                <Input data-testid="input-amount" type="number" {...form.register("amount", { valueAsNumber: true })} />
                {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input data-testid="input-date" type="date" {...form.register("date")} />
              </div>
              <div className="space-y-1.5">
                <Label>Vendor</Label>
                <Input data-testid="input-vendor" {...form.register("vendor")} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input data-testid="input-dept" {...form.register("department")} placeholder="Optional" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button data-testid="button-save-transaction" type="submit" disabled={createTxn.isPending}>{createTxn.isPending ? "Adding..." : "Add Transaction"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
