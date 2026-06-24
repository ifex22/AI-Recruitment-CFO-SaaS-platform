import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Zap, MapPin, Briefcase, DollarSign, Clock, Search, ArrowRight, Building2, Users, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  openings: number;
  posted_date: string;
};

export default function ApplyPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/public/jobs")
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.department?.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number | null) => n ? `$${(n / 1000).toFixed(0)}k` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">

      {/* Thin top nav — only Staff Login, no badge */}
      <nav className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Nexus AI</span>
        </div>
        <Link href="/login">
          <Button variant="outline" className="border-slate-500 text-slate-200 hover:text-white hover:border-white hover:bg-white/10 font-semibold">
            Staff Login — Post Jobs
          </Button>
        </Link>
      </nav>

      {/* HERO — full attention, obvious CTA */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-14 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5 mb-8">
          <Star className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
          <span className="text-blue-300 text-sm font-medium">AI interviews · instant results · no waiting</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
          Your next job<br />
          <span className="text-blue-400">starts here.</span>
        </h1>

        <p className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Browse open roles, apply in minutes, and complete an AI interview instantly —
          no scheduling, no waiting weeks for a callback.
        </p>

        {/* Big search bar */}
        <div className="relative max-w-2xl mx-auto mb-6">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search roles, departments, or locations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-14 pr-6 bg-white/10 border-white/20 text-white placeholder:text-slate-400 h-16 rounded-2xl text-base focus:bg-white/15 focus:border-blue-400/50"
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-8 text-sm text-slate-400 mt-8">
          <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-blue-400" /> {jobs.length} open roles</span>
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-400" /> 12,400+ placed</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-400" /> Avg. 18-day hire</span>
        </div>
      </div>

      {/* Jobs list */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">{search ? "No jobs match your search" : "No open positions right now"}</p>
            <p className="text-sm mt-1">Check back soon</p>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-5">
              Showing {filtered.length} open position{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="grid gap-4">
              {filtered.map(job => (
                <div
                  key={job.id}
                  className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 rounded-2xl p-6 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 text-xs font-medium">
                          {job.department || "General"}
                        </Badge>
                        {job.employment_type && (
                          <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                            {job.employment_type}
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-white text-xl font-bold mb-3 group-hover:text-blue-300 transition-colors">
                        {job.title}
                      </h2>
                      {job.description && (
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        {job.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> {job.location}
                          </span>
                        )}
                        {(job.salary_min || job.salary_max) && (
                          <span className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" />
                            {fmt(job.salary_min)} – {fmt(job.salary_max)}
                          </span>
                        )}
                        {job.openings > 1 && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" /> {job.openings} openings
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(job.posted_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Right: Apply CTA */}
                    <div className="shrink-0 flex flex-col items-end gap-3">
                      <Link href={`/apply/${job.id}`}>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-5 rounded-xl text-base gap-2 shadow-lg shadow-blue-900/30">
                          Apply Now <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-blue-500" /> AI interview included
                      </span>
                    </div>
                  </div>

                  {/* Full card link overlay */}
                  <Link href={`/apply/${job.id}`}>
                    <span className="absolute inset-0 rounded-2xl" aria-hidden />
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA banner */}
      <div className="border-t border-white/5 bg-black/20 py-12 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h3 className="text-white text-xl font-bold mb-2">Don't see the right role?</h3>
          <p className="text-slate-400 text-sm mb-6">New positions open regularly. Check back soon or reach out directly.</p>
          <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            Powered by Nexus AI Recruitment Platform
            <ChevronRight className="w-3 h-3" />
            <Link href="/login">
              <span className="text-blue-400 hover:text-blue-300 cursor-pointer">Staff access</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
