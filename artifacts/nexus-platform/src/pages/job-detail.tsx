import { useRoute } from "wouter";
import { useGetJob, useUpdateJob, useListCandidates, getGetJobQueryKey, getListCandidatesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, MapPin, DollarSign, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700", screening: "bg-purple-100 text-purple-700",
  interview: "bg-amber-100 text-amber-700", offer: "bg-cyan-100 text-cyan-700",
  hired: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
};

const schema = z.object({
  title: z.string().min(1), department: z.string().min(1),
  location: z.string().min(1), status: z.string(),
  salary_min: z.number(), salary_max: z.number(),
});
type JobForm = z.infer<typeof schema>;
type Job = { id: string; title: string; department: string; location: string; employment_type: string; status: string; salary_min: number; salary_max: number; description?: string; candidate_count: number };
type Candidate = { id: string; full_name: string; email: string; stage: string; ai_score?: number | null };

export default function JobDetailPage() {
  const [, params] = useRoute("/jobs/:id");
  const id = params?.id ?? "";
  const qc = useQueryClient();
  const { toast } = useToast();

  const job = useGetJob(id, { query: { enabled: !!id, queryKey: getGetJobQueryKey(id) } });
  const candidates = useListCandidates({ job_id: id }, { query: { enabled: !!id, queryKey: getListCandidatesQueryKey({ job_id: id }) } });
  const updateJob = useUpdateJob();

  const j = job.data as Job | undefined;
  const form = useForm<JobForm>({
    resolver: zodResolver(schema),
    values: { title: j?.title ?? "", department: j?.department ?? "", location: j?.location ?? "", status: j?.status ?? "open", salary_min: j?.salary_min ?? 0, salary_max: j?.salary_max ?? 0 },
  });

  const onSubmit = (data: JobForm) => {
    updateJob.mutate({ id, data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetJobQueryKey(id) });
        toast({ title: "Job updated" });
      },
    });
  };

  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}K`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/jobs"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Jobs</Button></Link>
        {job.isLoading ? <Skeleton className="h-6 w-48" /> : <h1 className="text-xl font-bold text-foreground">{j?.title}</h1>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Edit Job Details</CardTitle></CardHeader>
            <CardContent>
              {job.isLoading ? <Skeleton className="h-48" /> : (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><Input data-testid="input-title" placeholder="Job title" {...form.register("title")} /></div>
                    <Input data-testid="input-dept" placeholder="Department" {...form.register("department")} />
                    <Input data-testid="input-loc" placeholder="Location" {...form.register("location")} />
                    <Input data-testid="input-salary-min" type="number" placeholder="Min salary" {...form.register("salary_min", { valueAsNumber: true })} />
                    <Input data-testid="input-salary-max" type="number" placeholder="Max salary" {...form.register("salary_max", { valueAsNumber: true })} />
                    <Select value={form.watch("status")} onValueChange={v => form.setValue("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button data-testid="button-save-job" type="submit" disabled={updateJob.isPending}>{updateJob.isPending ? "Saving..." : "Save Changes"}</Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Candidates ({(candidates.data as Candidate[] | undefined)?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              {candidates.isLoading ? <Skeleton className="h-32" /> : (candidates.data as Candidate[] | undefined)?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No candidates for this job</p>
              ) : (
                <div className="space-y-2">
                  {(candidates.data as Candidate[] | undefined)?.map(c => (
                    <div key={c.id} data-testid={`candidate-row-${c.id}`} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{c.full_name.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STAGE_COLORS[c.stage] ?? "")}>{c.stage}</span>
                      {c.ai_score && <span className="text-xs font-bold text-primary">{c.ai_score}</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              {job.isLoading ? <Skeleton className="h-40" /> : j && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" />{j.location}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="w-4 h-4" />{fmt(j.salary_min)} – {fmt(j.salary_max)}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Briefcase className="w-4 h-4" />{j.employment_type?.replace("_", " ")}</div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Candidate Count</p>
                    <p className="text-2xl font-bold text-primary">{j.candidate_count}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
