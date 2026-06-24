import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Zap, MapPin, Briefcase, DollarSign, Clock, Search, ArrowRight, Building2, Users, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 20 }}>Nexus AI</span>
        </div>
        <Link href="/login">
          <button style={{ backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Staff Login — Post Jobs
          </button>
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "72px 24px 56px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#1e3a5f", border: "1px solid #2563eb55", borderRadius: 999, padding: "8px 18px", marginBottom: 32 }}>
          <Star style={{ width: 14, height: 14, color: "#60a5fa", fill: "#60a5fa" }} />
          <span style={{ color: "#93c5fd", fontSize: 14, fontWeight: 500 }}>AI interviews · instant results · no waiting</span>
        </div>

        <h1 style={{ color: "#ffffff", fontSize: 64, fontWeight: 800, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-1px" }}>
          Your next job<br />
          <span style={{ color: "#3b82f6" }}>starts here.</span>
        </h1>

        <p style={{ color: "#94a3b8", fontSize: 18, lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
          Browse open roles, apply in minutes, and complete an AI interview instantly —
          no scheduling, no waiting weeks for a callback.
        </p>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto 32px" }}>
          <Search style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: "#64748b" }} />
          <input
            placeholder="Search roles, departments, or locations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              paddingLeft: 52, paddingRight: 20, height: 56,
              backgroundColor: "#1e293b", border: "1px solid #334155",
              borderRadius: 14, color: "#ffffff", fontSize: 15,
              outline: "none",
            }}
          />
        </div>

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 36, flexWrap: "wrap" }}>
          {[
            { icon: <Briefcase style={{ width: 15, height: 15, color: "#3b82f6" }} />, label: `${jobs.length} open roles` },
            { icon: <Users style={{ width: 15, height: 15, color: "#3b82f6" }} />, label: "12,400+ placed" },
            { icon: <Clock style={{ width: 15, height: 15, color: "#3b82f6" }} />, label: "Avg. 18-day hire" },
          ].map(s => (
            <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 14 }}>
              {s.icon}{s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Jobs */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>
        {loading ? (
          <div style={{ display: "grid", gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 140, borderRadius: 16, backgroundColor: "#1e293b", opacity: 0.6 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
            <Briefcase style={{ width: 48, height: 48, margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: 18, margin: 0 }}>{search ? "No jobs match your search" : "No open positions right now"}</p>
            <p style={{ fontSize: 14, marginTop: 6, color: "#334155" }}>Check back soon</p>
          </div>
        ) : (
          <>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
              {filtered.length} open position{filtered.length !== 1 ? "s" : ""}
            </p>
            <div style={{ display: "grid", gap: 16 }}>
              {filtered.map(job => (
                <div
                  key={job.id}
                  style={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: 16,
                    padding: 28,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 20,
                  }}
                >
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ backgroundColor: "#1e3a5f", color: "#93c5fd", border: "1px solid #2563eb44", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                        {job.department || "General"}
                      </span>
                      {job.employment_type && (
                        <span style={{ color: "#64748b", border: "1px solid #334155", borderRadius: 6, padding: "3px 10px", fontSize: 12 }}>
                          {job.employment_type}
                        </span>
                      )}
                    </div>
                    <h2 style={{ color: "#ffffff", fontSize: 20, fontWeight: 700, margin: "0 0 10px", lineHeight: 1.3 }}>
                      {job.title}
                    </h2>
                    {job.description && (
                      <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 14px", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {job.description}
                      </p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontSize: 13, color: "#64748b" }}>
                      {job.location && (
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <MapPin style={{ width: 13, height: 13 }} /> {job.location}
                        </span>
                      )}
                      {(job.salary_min || job.salary_max) && (
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <DollarSign style={{ width: 13, height: 13 }} /> {fmt(job.salary_min)} – {fmt(job.salary_max)}
                        </span>
                      )}
                      {job.openings > 1 && (
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Building2 style={{ width: 13, height: 13 }} /> {job.openings} openings
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Clock style={{ width: 13, height: 13 }} />
                        {new Date(job.posted_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <Link href={`/apply/${job.id}`}>
                      <button style={{
                        backgroundColor: "#2563eb", color: "#ffffff",
                        border: "none", borderRadius: 10,
                        padding: "12px 24px", fontSize: 15, fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                        whiteSpace: "nowrap",
                      }}>
                        Apply Now <ArrowRight style={{ width: 16, height: 16 }} />
                      </button>
                    </Link>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#475569" }}>
                      <Zap style={{ width: 11, height: 11, color: "#3b82f6" }} /> AI interview included
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1e293b", backgroundColor: "#090f1a", padding: "40px 24px", textAlign: "center" }}>
        <h3 style={{ color: "#ffffff", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Don't see the right role?</h3>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>New positions open regularly. Check back soon.</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#475569", fontSize: 12 }}>
          <Zap style={{ width: 13, height: 13, color: "#3b82f6" }} />
          Powered by Nexus AI Recruitment
          <ChevronRight style={{ width: 12, height: 12 }} />
          <Link href="/login">
            <span style={{ color: "#3b82f6", cursor: "pointer" }}>Staff access</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
