import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Zap, MapPin, Briefcase, DollarSign, Clock, Search, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Nexus AI</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-slate-300 border-slate-600 text-xs">
              SPA with a REST API backed by BaaS
            </Badge>
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-400">
                Staff Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-blue-400 text-sm font-medium">AI-Powered Recruitment</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Find Your Next Role
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
          Apply in minutes. Complete an AI interview and get scored instantly.
        </p>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search roles, departments, locations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12 rounded-xl"
          />
        </div>
      </div>

      {/* Jobs */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl bg-white/5" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">{search ? "No jobs match your search" : "No open positions right now"}</p>
            <p className="text-sm mt-1">Check back soon</p>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-4">{filtered.length} open position{filtered.length !== 1 ? "s" : ""}</p>
            <div className="grid gap-4">
              {filtered.map(job => (
                <Card key={job.id} className="bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20 transition-all group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-xs">
                            {job.department || "General"}
                          </Badge>
                          {job.employment_type && (
                            <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                              {job.employment_type}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-white text-xl">{job.title}</CardTitle>
                      </div>
                      <Link href={`/apply/${job.id}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-1.5">
                          Apply <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {job.description && (
                      <CardDescription className="text-slate-400 text-sm mb-3 line-clamp-2">
                        {job.description}
                      </CardDescription>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
