import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Zap, MapPin, DollarSign, Briefcase, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  requirements: string;
  openings: number;
};

type Props = { params: { id: string } };

export default function ApplyJobPage({ params }: Props) {
  const [, navigate] = useLocation();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    experience_years: "", expected_salary: "",
    skills: "", cover_letter: "",
  });

  useEffect(() => {
    fetch(`/api/public/jobs/${params.id}`)
      .then(r => r.json())
      .then(data => { setJob(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/public/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          job_id: params.id,
          job_title: job?.title,
          experience_years: Number(form.experience_years) || 0,
          expected_salary: Number(form.expected_salary) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit application"); setSubmitting(false); return; }

      navigate(`/apply/${params.id}/interview?cid=${data.candidate_id}&tok=${data.token}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const fmt = (n: number | null) => n ? `$${(n / 1000).toFixed(0)}k` : null;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/apply">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1.5">
              <ArrowLeft className="w-4 h-4" /> All Jobs
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-bold">Nexus AI</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64 bg-white/5" />
            <Skeleton className="h-4 w-40 bg-white/5" />
          </div>
        ) : !job ? (
          <div className="text-center text-slate-400 py-20">Job not found.</div>
        ) : (
          <>
            {/* Job info */}
            <Card className="bg-white/5 border-white/10 mb-8">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">{job.department}</Badge>
                  {job.employment_type && <Badge variant="outline" className="border-slate-600 text-slate-400">{job.employment_type}</Badge>}
                </div>
                <CardTitle className="text-white text-2xl">{job.title}</CardTitle>
                <div className="flex flex-wrap gap-4 text-sm text-slate-400 mt-2">
                  {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
                  {(job.salary_min || job.salary_max) && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{fmt(job.salary_min)} – {fmt(job.salary_max)}</span>}
                </div>
              </CardHeader>
              {job.description && (
                <CardContent>
                  <CardDescription className="text-slate-300 whitespace-pre-line text-sm">{job.description}</CardDescription>
                </CardContent>
              )}
            </Card>

            {/* Process steps */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {["Fill application", "AI interview (5 Qs)", "Get instant score"].map((step, i) => (
                <div key={i} className={`rounded-xl p-3 text-center text-sm border ${i === 0 ? "bg-blue-600/10 border-blue-500/30 text-blue-400" : "bg-white/3 border-white/8 text-slate-500"}`}>
                  <div className={`w-6 h-6 rounded-full mx-auto mb-1.5 flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-blue-600 text-white" : "bg-white/10 text-slate-400"}`}>{i + 1}</div>
                  {step}
                </div>
              ))}
            </div>

            {/* Form */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" /> Your Application
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Full Name *</Label>
                      <Input value={form.full_name} onChange={set("full_name")} required placeholder="Jane Smith" className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Email *</Label>
                      <Input type="email" value={form.email} onChange={set("email")} required placeholder="jane@example.com" className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Phone</Label>
                      <Input value={form.phone} onChange={set("phone")} placeholder="+1 555 000 0000" className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Years of Experience</Label>
                      <Input type="number" min="0" value={form.experience_years} onChange={set("experience_years")} placeholder="3" className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Expected Salary (USD/yr)</Label>
                      <Input type="number" min="0" value={form.expected_salary} onChange={set("expected_salary")} placeholder="80000" className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Key Skills</Label>
                      <Input value={form.skills} onChange={set("skills")} placeholder="React, Python, SQL" className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Cover Letter / Notes</Label>
                    <Textarea value={form.cover_letter} onChange={set("cover_letter")} placeholder="Tell us why you're a great fit..." rows={4} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 resize-none" />
                  </div>

                  {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-slate-300 text-sm">After submitting, you'll complete a <strong className="text-white">5-question AI interview</strong>. The AI will assess your skills and give you an instant score. No scheduling needed.</p>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</> : "Submit & Start AI Interview →"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
