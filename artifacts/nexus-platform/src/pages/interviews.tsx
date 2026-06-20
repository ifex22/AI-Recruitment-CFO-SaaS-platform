import { useState } from "react";
import { useListInterviews, useCreateInterview, useDeleteInterview, useEvaluateInterview, useListCandidates, getListInterviewsQueryKey } from "@workspace/api-client-react";
import type { InterviewInput, InterviewEvaluation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Search, Trash2, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  no_show: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const schema = z.object({
  candidate_id: z.string().min(1, "Required"),
  type: z.string().default("screening"),
  scheduled_at: z.string().min(1, "Required"),
  duration_minutes: z.number().default(60),
  notes: z.string().optional(),
});
type InterviewForm = z.infer<typeof schema>;

const evalSchema = z.object({
  overall_rating: z.number().min(1).max(5),
  technical_score: z.number().min(1).max(5).optional(),
  communication_score: z.number().min(1).max(5).optional(),
  hire_recommendation: z.string().default("maybe"),
  notes: z.string().optional(),
});
type EvalForm = z.infer<typeof evalSchema>;

type Interview = { id: string; candidate_name?: string | null; job_title?: string | null; type: string; scheduled_at: string; status: string; overall_rating?: number | null; duration_minutes?: number; interviewer_name?: string | null };

type Candidate = { id: string; full_name: string; stage?: string };

export default function InterviewsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [evalId, setEvalId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const interviews = useListInterviews(undefined, { query: { queryKey: getListInterviewsQueryKey() } });
  const candidatesQ = useListCandidates(undefined, { query: { queryKey: ["candidates-for-interviews"], staleTime: 60000 } });
  const candidatesList = (candidatesQ.data as Candidate[] | undefined) ?? [];
  const createInterview = useCreateInterview();
  const deleteInterview = useDeleteInterview();
  const evaluateInterview = useEvaluateInterview();

  const form = useForm<InterviewForm>({
    resolver: zodResolver(schema),
    defaultValues: { candidate_id: "", type: "screening", scheduled_at: "", duration_minutes: 60 },
  });

  const evalForm = useForm<EvalForm>({
    resolver: zodResolver(evalSchema),
    defaultValues: { overall_rating: 3, technical_score: 3, communication_score: 3, hire_recommendation: "maybe" },
  });

  const data = interviews.data as Interview[] | undefined ?? [];
  const filtered = data.filter(i => {
    return !search || (i.candidate_name ?? "").toLowerCase().includes(search.toLowerCase()) || i.type.includes(search.toLowerCase());
  });

  const onSubmit = (d: InterviewForm) => {
    createInterview.mutate({ data: { ...d, job_id: "" } as InterviewInput }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Interview scheduled" });
      },
      onError: () => toast({ title: "Failed to schedule", variant: "destructive" }),
    });
  };

  const onEval = (d: EvalForm) => {
    if (!evalId) return;
    evaluateInterview.mutate({ id: evalId, data: d as InterviewEvaluation }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
        setEvalId(null);
        evalForm.reset();
        toast({ title: "Evaluation saved" });
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Cancel this interview?")) return;
    deleteInterview.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
        toast({ title: "Interview cancelled" });
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Interviews</h1>
          <p className="text-sm text-muted-foreground">Schedule and manage interview pipeline</p>
        </div>
        <Button data-testid="button-schedule-interview" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Schedule Interview
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input data-testid="input-search" placeholder="Search interviews..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {interviews.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No interviews scheduled</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(interview => (
            <Card key={interview.id} data-testid={`card-interview-${interview.id}`} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{interview.candidate_name ?? "Unknown Candidate"}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLORS[interview.status] ?? "")}>{interview.status}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{interview.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{interview.job_title ?? "No position"} &middot; {new Date(interview.scheduled_at).toLocaleString()} &middot; {interview.duration_minutes ?? 60} min</p>
                    {interview.overall_rating && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("w-3.5 h-3.5", i < (interview.overall_rating ?? 0) ? "text-amber-500 fill-current" : "text-muted")} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {interview.status === "scheduled" && (
                      <Button data-testid={`button-evaluate-${interview.id}`} variant="outline" size="sm" onClick={() => setEvalId(interview.id)}>
                        Evaluate
                      </Button>
                    )}
                    <Button data-testid={`button-delete-${interview.id}`} variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(interview.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Candidate</Label>
              <Select value={form.watch("candidate_id")} onValueChange={v => form.setValue("candidate_id", v)}>
                <SelectTrigger data-testid="input-candidate-id">
                  <SelectValue placeholder="Select a candidate…" />
                </SelectTrigger>
                <SelectContent>
                  {candidatesList.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.candidate_id && <p className="text-xs text-destructive">{form.formState.errors.candidate_id.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.watch("type")} onValueChange={v => form.setValue("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["screening", "technical", "behavioral", "final", "panel"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input data-testid="input-duration" type="number" {...form.register("duration_minutes", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Scheduled At</Label>
              <Input data-testid="input-scheduled-at" type="datetime-local" {...form.register("scheduled_at")} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input data-testid="input-notes" {...form.register("notes")} placeholder="Interview focus areas..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button data-testid="button-save-interview" type="submit" disabled={createInterview.isPending}>{createInterview.isPending ? "Scheduling..." : "Schedule"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Evaluate Dialog */}
      <Dialog open={!!evalId} onOpenChange={() => setEvalId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Evaluate Interview</DialogTitle></DialogHeader>
          <form onSubmit={evalForm.handleSubmit(onEval)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Overall Rating (1-5)</Label>
                <Input data-testid="input-overall-rating" type="number" min={1} max={5} {...evalForm.register("overall_rating", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Technical (1-5)</Label>
                <Input data-testid="input-technical-score" type="number" min={1} max={5} {...evalForm.register("technical_score", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Communication (1-5)</Label>
                <Input data-testid="input-communication-score" type="number" min={1} max={5} {...evalForm.register("communication_score", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Recommendation</Label>
                <Select value={evalForm.watch("hire_recommendation")} onValueChange={v => evalForm.setValue("hire_recommendation", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong_hire">Strong Hire</SelectItem>
                    <SelectItem value="hire">Hire</SelectItem>
                    <SelectItem value="maybe">Maybe</SelectItem>
                    <SelectItem value="no_hire">No Hire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input data-testid="input-eval-notes" {...evalForm.register("notes")} placeholder="Feedback notes..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEvalId(null)}>Cancel</Button>
              <Button data-testid="button-save-evaluation" type="submit" disabled={evaluateInterview.isPending}>{evaluateInterview.isPending ? "Saving..." : "Save Evaluation"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
