import { useRoute } from "wouter";
import { useGetCandidate, useUpdateCandidate, useAdvanceCandidate, useScoreCandidate, getGetCandidateQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;
const STAGE_COLORS: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700", screening: "bg-purple-100 text-purple-700",
  interview: "bg-amber-100 text-amber-700", offer: "bg-cyan-100 text-cyan-700",
  hired: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
};

type Candidate = { id: string; full_name: string; email: string; phone?: string; stage: string; ai_score?: number | null; job_title?: string | null; experience_years?: number | null; current_company?: string | null; current_title?: string | null; expected_salary?: number | null; skills?: string[]; notes?: string | null; source?: string | null };

export default function CandidateDetailPage() {
  const [, params] = useRoute("/candidates/:id");
  const id = params?.id ?? "";
  const qc = useQueryClient();
  const { toast } = useToast();

  const candidate = useGetCandidate(id, { query: { enabled: !!id, queryKey: getGetCandidateQueryKey(id) } });
  const updateCandidate = useUpdateCandidate();
  const advanceCandidate = useAdvanceCandidate();
  const scoreCandidate = useScoreCandidate();

  const c = candidate.data as Candidate | undefined;

  const handleAdvance = () => {
    if (!c) return;
    const idx = STAGES.indexOf(c.stage as typeof STAGES[number]);
    const next = STAGES[Math.min(idx + 1, STAGES.length - 2)];
    advanceCandidate.mutate({ id, data: { stage: next } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetCandidateQueryKey(id) });
        toast({ title: `Moved to ${next}` });
      },
    });
  };

  const handleReject = () => {
    if (!confirm("Reject this candidate?")) return;
    advanceCandidate.mutate({ id, data: { stage: "rejected" } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetCandidateQueryKey(id) });
        toast({ title: "Candidate rejected" });
      },
    });
  };

  const handleScore = () => {
    scoreCandidate.mutate({ id }, {
      onSuccess: (res) => {
        qc.invalidateQueries({ queryKey: getGetCandidateQueryKey(id) });
        const r = res as { overall_score: number; recommendation: string; strengths?: string[]; weaknesses?: string[] };
        toast({ title: `AI Score: ${r.overall_score} — ${r.recommendation.replace("_", " ")}` });
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/candidates"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Candidates</Button></Link>
        {candidate.isLoading ? <Skeleton className="h-6 w-48" /> : <h1 className="text-xl font-bold text-foreground">{c?.full_name}</h1>}
      </div>

      {candidate.isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : c && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Profile</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", STAGE_COLORS[c.stage] ?? "")}>{c.stage}</span>
                    {c.ai_score && <span className="text-sm font-bold text-primary">{c.ai_score} / 100</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Email", value: c.email },
                    { label: "Phone", value: c.phone ?? "—" },
                    { label: "Current Company", value: c.current_company ?? "—" },
                    { label: "Current Title", value: c.current_title ?? "—" },
                    { label: "Experience", value: c.experience_years ? `${c.experience_years} years` : "—" },
                    { label: "Expected Salary", value: c.expected_salary ? `$${c.expected_salary.toLocaleString()}` : "—" },
                    { label: "Applied For", value: c.job_title ?? "—" },
                    { label: "Source", value: c.source ?? "—" },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
                {c.skills && c.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.skills.map(s => <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{s}</span>)}
                    </div>
                  </div>
                )}
                {c.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground">{c.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button data-testid="button-score" className="w-full" variant="outline" onClick={handleScore} disabled={scoreCandidate.isPending}>
                  <Sparkles className="w-4 h-4 mr-2" />{scoreCandidate.isPending ? "Scoring..." : "Run AI Score"}
                </Button>
                {c.stage !== "hired" && c.stage !== "rejected" && (
                  <>
                    <Button data-testid="button-advance" className="w-full" onClick={handleAdvance} disabled={advanceCandidate.isPending}>
                      <ChevronRight className="w-4 h-4 mr-2" />Advance Stage
                    </Button>
                    <Button data-testid="button-reject" className="w-full" variant="destructive" onClick={handleReject}>
                      <ChevronLeft className="w-4 h-4 mr-2" />Reject
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Pipeline Stage</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {STAGES.filter(s => s !== "rejected").map((stage, i) => {
                    const currentIdx = STAGES.indexOf(c.stage as typeof STAGES[number]);
                    const stageIdx = i;
                    const isActive = c.stage === stage;
                    const isPast = stageIdx < currentIdx;
                    return (
                      <div key={stage} className={cn("flex items-center gap-2 text-xs font-medium py-1 px-2 rounded", isActive ? "bg-primary/10 text-primary" : isPast ? "text-green-600" : "text-muted-foreground")}>
                        <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-primary" : isPast ? "bg-green-500" : "bg-muted-foreground/30")} />
                        <span className="capitalize">{stage}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
