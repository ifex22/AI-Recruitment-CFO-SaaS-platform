import { useState } from "react";
import { useListCandidates, useCreateCandidate, useDeleteCandidate, useAdvanceCandidate, useScoreCandidate, getListCandidatesQueryKey } from "@workspace/api-client-react";
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
import { Plus, Search, Trash2, ExternalLink, Sparkles, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;
const STAGE_COLORS: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  screening: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  interview: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  offer: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  hired: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const schema = z.object({
  full_name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  job_id: z.string().optional(),
  stage: z.string().default("applied"),
  experience_years: z.number().min(0).optional(),
  current_company: z.string().optional(),
  expected_salary: z.number().min(0).optional(),
  skills: z.string().optional(),
});
type CandidateForm = z.infer<typeof schema>;

type Candidate = {
  id: string;
  full_name: string;
  email: string;
  stage: string;
  ai_score?: number | null;
  job_title?: string | null;
  experience_years?: number | null;
  current_company?: string | null;
  expected_salary?: number | null;
  skills?: string[];
};

function ScoreBadge({ score }: { score?: number | null }) {
  if (!score) return null;
  const color = score >= 85 ? "bg-green-100 text-green-700" : score >= 70 ? "bg-blue-100 text-blue-700" : score >= 55 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", color)}>{score}</span>;
}

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const candidates = useListCandidates(undefined, { query: { queryKey: getListCandidatesQueryKey() } });
  const createCandidate = useCreateCandidate();
  const deleteCandidate = useDeleteCandidate();
  const advanceCandidate = useAdvanceCandidate();
  const scoreCandidate = useScoreCandidate();

  const form = useForm<CandidateForm>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", stage: "applied", experience_years: 0, current_company: "", expected_salary: 0, skills: "" },
  });

  const data = candidates.data as Candidate[] | undefined ?? [];
  const filtered = data.filter(c => {
    const matchSearch = !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || c.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const onSubmit = (form_data: CandidateForm) => {
    const skills = form_data.skills ? form_data.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
    createCandidate.mutate({ data: { ...form_data, skills, job_id: form_data.job_id ?? "" } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Candidate added" });
      },
      onError: () => toast({ title: "Failed to add candidate", variant: "destructive" }),
    });
  };

  const handleAdvance = (id: string, currentStage: string) => {
    const idx = STAGES.indexOf(currentStage as typeof STAGES[number]);
    const nextStage = STAGES[Math.min(idx + 1, STAGES.length - 2)];
    if (!nextStage) return;
    advanceCandidate.mutate({ id, data: { stage: nextStage } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
        toast({ title: `Candidate moved to ${nextStage}` });
      },
    });
  };

  const handleScore = (id: string) => {
    scoreCandidate.mutate({ id }, {
      onSuccess: (res) => {
        qc.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
        const r = res as { overall_score: number; recommendation: string };
        toast({ title: `AI Score: ${r.overall_score} — ${r.recommendation.replace("_", " ")}` });
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    deleteCandidate.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
        toast({ title: "Candidate deleted" });
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Candidates</h1>
          <p className="text-sm text-muted-foreground">Manage your recruitment pipeline</p>
        </div>
        <Button data-testid="button-add-candidate" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Candidate
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input data-testid="input-search" placeholder="Search candidates..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {candidates.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No candidates found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Card key={c.id} data-testid={`card-candidate-${c.id}`} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{c.full_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-sm">{c.full_name}</span>
                      <ScoreBadge score={c.ai_score} />
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STAGE_COLORS[c.stage] ?? "")}>{c.stage}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.email} {c.job_title ? `· ${c.job_title}` : ""} {c.current_company ? `· ${c.current_company}` : ""}</p>
                    {c.skills && c.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.skills.slice(0, 4).map(s => <span key={s} className="text-xs bg-muted px-1.5 py-0.5 rounded">{s}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button data-testid={`button-score-${c.id}`} variant="ghost" size="sm" onClick={() => handleScore(c.id)} title="AI Score">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </Button>
                    {c.stage !== "hired" && c.stage !== "rejected" && (
                      <Button data-testid={`button-advance-${c.id}`} variant="ghost" size="sm" onClick={() => handleAdvance(c.id, c.stage)} title="Advance stage">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                    <Link href={`/candidates/${c.id}`}>
                      <Button data-testid={`button-view-${c.id}`} variant="ghost" size="sm"><ExternalLink className="w-4 h-4" /></Button>
                    </Link>
                    <Button data-testid={`button-delete-${c.id}`} variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
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
          <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name</Label>
                <Input data-testid="input-full-name" {...form.register("full_name")} placeholder="Jane Smith" />
                {form.formState.errors.full_name && <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Email</Label>
                <Input data-testid="input-email" {...form.register("email")} placeholder="jane@company.com" />
                {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Current Company</Label>
                <Input data-testid="input-current-company" {...form.register("current_company")} placeholder="Google" />
              </div>
              <div className="space-y-1.5">
                <Label>Experience (years)</Label>
                <Input data-testid="input-experience" type="number" {...form.register("experience_years", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Expected Salary</Label>
                <Input data-testid="input-salary" type="number" {...form.register("expected_salary", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Select value={form.watch("stage")} onValueChange={v => form.setValue("stage", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Skills (comma separated)</Label>
                <Input data-testid="input-skills" {...form.register("skills")} placeholder="React, TypeScript, Node.js" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button data-testid="button-save-candidate" type="submit" disabled={createCandidate.isPending}>{createCandidate.isPending ? "Adding..." : "Add Candidate"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
