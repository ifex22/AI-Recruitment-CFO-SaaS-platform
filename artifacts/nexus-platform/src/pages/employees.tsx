import { useState } from "react";
import { useListEmployees, useCreateEmployee, useDeleteEmployee, useGetEmployeeStats, getListEmployeesQueryKey, getGetEmployeeStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Trash2, ExternalLink, Star, Users } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  on_leave: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  terminated: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const schema = z.object({
  full_name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  department: z.string().min(1, "Required"),
  job_title: z.string().min(1, "Required"),
  employment_type: z.string().default("full_time"),
  status: z.string().default("active"),
  start_date: z.string().min(1, "Required"),
  base_salary: z.number().min(0),
  location: z.string().optional(),
});
type EmpForm = z.infer<typeof schema>;

type Employee = { id: string; full_name: string; email: string; department: string; job_title: string; employment_type: string; status: string; start_date: string; base_salary: number; performance_score?: number | null; manager_name?: string | null; location?: string | null };

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const employees = useListEmployees(undefined, { query: { queryKey: getListEmployeesQueryKey() } });
  const statsQ = useGetEmployeeStats({ query: { queryKey: getGetEmployeeStatsQueryKey() } });
  const createEmployee = useCreateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const form = useForm<EmpForm>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", department: "", job_title: "", employment_type: "full_time", status: "active", start_date: new Date().toISOString().slice(0, 10), base_salary: 0 },
  });

  const data = employees.data as Employee[] | undefined ?? [];
  const stats = statsQ.data as { total_active?: number; total_on_leave?: number; avg_performance_score?: number; avg_tenure_months?: number; by_department?: { department: string; count: number }[] } | undefined;

  const departments = [...new Set(data.map(e => e.department))];
  const filtered = data.filter(e => {
    const matchSearch = !search || e.full_name.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const onSubmit = (form_data: EmpForm) => {
    createEmployee.mutate({ data: form_data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetEmployeeStatsQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Employee added" });
      },
      onError: () => toast({ title: "Failed to add employee", variant: "destructive" }),
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    deleteEmployee.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
        toast({ title: "Employee removed" });
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground">HR management and employee directory</p>
        </div>
        <Button data-testid="button-add-employee" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsQ.isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />) : (
          <>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-2xl font-bold">{stats?.total_active ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">On Leave</p><p className="text-2xl font-bold">{stats?.total_on_leave ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Performance</p><p className="text-2xl font-bold">{stats?.avg_performance_score?.toFixed(1) ?? "—"}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Tenure</p><p className="text-2xl font-bold">{stats?.avg_tenure_months ?? 0} <span className="text-sm font-normal">mo</span></p></CardContent></Card>
          </>
        )}
      </div>

      {/* Dept breakdown chart */}
      {stats?.by_department && stats.by_department.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Headcount by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={stats.by_department}>
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input data-testid="input-search" placeholder="Search employees..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {employees.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No employees found</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(emp => (
            <Card key={emp.id} data-testid={`card-employee-${emp.id}`} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{emp.full_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{emp.full_name}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLORS[emp.status] ?? "")}>{emp.status.replace("_", " ")}</span>
                      {emp.performance_score && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold">
                          <Star className="w-3 h-3 fill-current" />{emp.performance_score}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{emp.job_title} &middot; {emp.department} {emp.location ? `· ${emp.location}` : ""}</p>
                    <p className="text-xs text-muted-foreground">${(emp.base_salary / 1000).toFixed(0)}K/yr &middot; {(emp.employment_type ?? "full_time").replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/employees/${emp.id}`}>
                      <Button data-testid={`button-view-${emp.id}`} variant="ghost" size="sm"><ExternalLink className="w-4 h-4" /></Button>
                    </Link>
                    <Button data-testid={`button-delete-${emp.id}`} variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(emp.id, emp.full_name)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5"><Label>Full Name</Label><Input data-testid="input-full-name" {...form.register("full_name")} placeholder="Jane Smith" /></div>
              <div className="col-span-2 space-y-1.5"><Label>Email</Label><Input data-testid="input-email" {...form.register("email")} placeholder="jane@company.com" /></div>
              <div className="space-y-1.5"><Label>Department</Label><Input data-testid="input-department" {...form.register("department")} placeholder="Engineering" /></div>
              <div className="space-y-1.5"><Label>Job Title</Label><Input data-testid="input-job-title" {...form.register("job_title")} placeholder="Senior Engineer" /></div>
              <div className="space-y-1.5"><Label>Location</Label><Input data-testid="input-location" {...form.register("location")} placeholder="San Francisco, CA" /></div>
              <div className="space-y-1.5"><Label>Start Date</Label><Input data-testid="input-start-date" type="date" {...form.register("start_date")} /></div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.watch("employment_type")} onValueChange={v => form.setValue("employment_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Base Salary ($)</Label><Input data-testid="input-salary" type="number" {...form.register("base_salary", { valueAsNumber: true })} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button data-testid="button-save-employee" type="submit" disabled={createEmployee.isPending}>{createEmployee.isPending ? "Adding..." : "Add Employee"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
