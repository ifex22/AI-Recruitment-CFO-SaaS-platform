import { useRoute } from "wouter";
import { useGetEmployee, useUpdateEmployee, getGetEmployeeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Star } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700", on_leave: "bg-yellow-100 text-yellow-700", terminated: "bg-red-100 text-red-700",
};

const schema = z.object({
  full_name: z.string().min(1), email: z.string().email(),
  department: z.string().min(1), job_title: z.string().min(1),
  status: z.string(), base_salary: z.number().min(0),
  location: z.string().optional(), performance_score: z.number().min(0).max(5).optional(),
});
type EmpForm = z.infer<typeof schema>;
type Employee = { id: string; full_name: string; email: string; phone?: string; department: string; job_title: string; employment_type: string; status: string; start_date: string; base_salary: number; performance_score?: number | null; manager_name?: string | null; location?: string | null };

export default function EmployeeDetailPage() {
  const [, params] = useRoute("/employees/:id");
  const id = params?.id ?? "";
  const qc = useQueryClient();
  const { toast } = useToast();

  const employee = useGetEmployee(id, { query: { enabled: !!id, queryKey: getGetEmployeeQueryKey(id) } });
  const updateEmployee = useUpdateEmployee();

  const e = employee.data as Employee | undefined;
  const form = useForm<EmpForm>({
    resolver: zodResolver(schema),
    values: { full_name: e?.full_name ?? "", email: e?.email ?? "", department: e?.department ?? "", job_title: e?.job_title ?? "", status: e?.status ?? "active", base_salary: e?.base_salary ?? 0, location: e?.location ?? "", performance_score: e?.performance_score ?? undefined },
  });

  const onSubmit = (data: EmpForm) => {
    updateEmployee.mutate({ id, data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetEmployeeQueryKey(id) });
        toast({ title: "Employee updated" });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employees"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Employees</Button></Link>
        {employee.isLoading ? <Skeleton className="h-6 w-48" /> : <h1 className="text-xl font-bold text-foreground">{e?.full_name}</h1>}
      </div>

      {employee.isLoading ? (
        <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : e && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Edit Employee</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Full Name</Label><Input data-testid="input-name" {...form.register("full_name")} /></div>
                    <div className="space-y-1.5"><Label>Email</Label><Input data-testid="input-email" {...form.register("email")} /></div>
                    <div className="space-y-1.5"><Label>Department</Label><Input data-testid="input-dept" {...form.register("department")} /></div>
                    <div className="space-y-1.5"><Label>Job Title</Label><Input data-testid="input-title" {...form.register("job_title")} /></div>
                    <div className="space-y-1.5"><Label>Location</Label><Input data-testid="input-loc" {...form.register("location")} /></div>
                    <div className="space-y-1.5"><Label>Base Salary ($)</Label><Input data-testid="input-salary" type="number" {...form.register("base_salary", { valueAsNumber: true })} /></div>
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select value={form.watch("status")} onValueChange={v => form.setValue("status", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Performance Score (0-5)</Label><Input data-testid="input-perf" type="number" step="0.1" min="0" max="5" {...form.register("performance_score", { valueAsNumber: true })} /></div>
                  </div>
                  <Button data-testid="button-save" type="submit" disabled={updateEmployee.isPending}>{updateEmployee.isPending ? "Saving..." : "Save Changes"}</Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">{e.full_name.charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-foreground">{e.full_name}</p>
                    <p className="text-sm text-muted-foreground">{e.job_title}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block", STATUS_COLORS[e.status] ?? "")}>{e.status.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-border">
                  {[
                    { label: "Department", value: e.department },
                    { label: "Start Date", value: new Date(e.start_date).toLocaleDateString() },
                    { label: "Salary", value: `$${e.base_salary.toLocaleString()}/yr` },
                    { label: "Manager", value: e.manager_name ?? "—" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                  {e.performance_score && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Performance</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("w-3.5 h-3.5", i < Math.round(e.performance_score ?? 0) ? "text-amber-500 fill-current" : "text-muted")} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
