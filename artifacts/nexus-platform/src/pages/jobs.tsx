import { useState } from "react";
import { useListJobs, useCreateJob, useDeleteJob, useGetJobStats, getListJobsQueryKey, getGetJobStatsQueryKey } from "@workspace/api-client-react";
import type { JobInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, MapPin, DollarSign, Briefcase, Trash2, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  on_hold: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  draft: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const jobSchema = z.object({
  title: z.string().min(1, "Required"),
  department: z.string().min(1, "Required"),
  location: z.string().min(1, "Required"),
  employment_type: z.string().min(1, "Required"),
  status: z.string().min(1, "Required"),
  salary_min: z.number().min(0),
  salary_max: z.number().min(0),
  description: z.string().optional(),
});
type JobForm = z.infer<typeof jobSchema>;

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const jobs = useListJobs(undefined, { query: { queryKey: getListJobsQueryKey() } });
  const stats = useGetJobStats({ query: { queryKey: getGetJobStatsQueryKey() } });
  const createJob = useCreateJob();
  const deleteJob = useDeleteJob();

  const form = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: { title: "", department: "", location: "", employment_type: "full_time", status: "open", salary_min: 0, salary_max: 0 },
  });

  const jobsData = jobs.data as { id: string; title: string; department: string; location: string; employment_type: string; status: string; salary_min: number; salary_max: number; candidate_count: number; created_at: string }[] | undefined;
  const statsData = stats.data as { total_open?: number; total_closed?: number; avg_time_to_fill?: number } | undefined;

  const filtered = (jobsData ?? []).filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const onSubmit = (data: JobForm) => {
    createJob.mutate({ data: data as JobInput }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListJobsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetJobStatsQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Job created successfully" });
      },
      onError: () => toast({ title: "Failed to create job", variant: "destructive" }),
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteJob.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListJobsQueryKey() });
        toast({ title: "Job deleted" });
      },
    });
  };

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Job Postings</h1>
          <p className="text-sm text-muted-foreground">Manage open positions and recruitment pipeline</p>
        </div>
        <Button data-testid="button-create-job" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />) : (
          <>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Open Positions</p><p className="text-2xl font-bold text-foreground mt-1">{statsData?.total_open ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Closed Positions</p><p className="text-2xl font-bold text-foreground mt-1">{statsData?.total_closed ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Time to Fill</p><p className="text-2xl font-bold text-foreground mt-1">{statsData?.avg_time_to_fill ?? 0} <span className="text-sm font-normal">days</span></p></CardContent></Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input data-testid="input-search" placeholder="Search jobs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger data-testid="select-status" className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs list */}
      {jobs.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <Card key={job.id} data-testid={`card-job-${job.id}`} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{job.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[job.status] ?? ""}`}>{job.status.replace("_", " ")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 font-medium">{job.department}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{fmt(job.salary_min)} – {fmt(job.salary_max)}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.employment_type.replace("_", " ")}</span>
                      <span className="text-primary font-medium">{job.candidate_count} candidates</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/jobs/${job.id}`}>
                      <Button data-testid={`button-view-job-${job.id}`} variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button data-testid={`button-delete-job-${job.id}`} variant="ghost" size="sm" onClick={() => handleDelete(job.id, job.title)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Create New Job</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Job Title</Label>
                <Input data-testid="input-job-title" placeholder="e.g. Senior Engineer" {...form.register("title")} />
                {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input data-testid="input-department" placeholder="e.g. Engineering" {...form.register("department")} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input data-testid="input-location" placeholder="e.g. Remote" {...form.register("location")} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.watch("employment_type")} onValueChange={v => form.setValue("employment_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.watch("status")} onValueChange={v => form.setValue("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Min Salary ($)</Label>
                <Input data-testid="input-salary-min" type="number" {...form.register("salary_min", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Salary ($)</Label>
                <Input data-testid="input-salary-max" type="number" {...form.register("salary_max", { valueAsNumber: true })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button data-testid="button-save-job" type="submit" disabled={createJob.isPending}>{createJob.isPending ? "Creating..." : "Create Job"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
