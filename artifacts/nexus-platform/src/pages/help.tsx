import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, Users, Calendar, Building2,
  DollarSign, CreditCard, Shield, Settings, ChevronRight,
  ArrowRight, CheckCircle2, Info, Zap, BookOpen, HelpCircle,
  User, LogIn, UserPlus, KeyRound, Search, Plus, Edit,
  Trash2, Filter, Download, TrendingUp, BarChart3, FileText
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface FlowStep {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

interface FAQ {
  question: string;
  answer: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const sections: Section[] = [
  { id: "overview", label: "Platform Overview", icon: BookOpen },
  { id: "auth", label: "Authentication", icon: KeyRound },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "recruitment", label: "Recruitment Flow", icon: Briefcase },
  { id: "interviews", label: "Interviews", icon: Calendar },
  { id: "hr", label: "HR Management", icon: Building2 },
  { id: "finance", label: "Finance & CFO", icon: DollarSign },
  { id: "payroll", label: "Payroll", icon: CreditCard },
  { id: "admin", label: "Admin & Settings", icon: Shield },
  { id: "roles", label: "Roles & Permissions", icon: User },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

const recruitmentFlow: FlowStep[] = [
  { step: 1, title: "Create a Job Posting", description: "Go to Jobs → New Job. Fill in title, department, description, requirements, and salary range. Set status to 'open' to make it active.", icon: Plus },
  { step: 2, title: "Add Candidates", description: "Go to Candidates → New Candidate. Link the candidate to a job posting. Add their skills, experience years, expected salary, and contact details.", icon: UserPlus },
  { step: 3, title: "Run AI Scoring", description: "Open a candidate record and click 'Score with AI'. The system calculates a score based on skills count and years of experience. Higher scores = stronger match.", icon: Zap },
  { step: 4, title: "Schedule an Interview", description: "Go to Interviews → New Interview. Select the candidate from the dropdown, choose the interviewer, date, type (video/phone/on-site), and questions.", icon: Calendar },
  { step: 5, title: "Advance Through Stages", description: "On the candidate record, use 'Advance Stage' to move them: Applied → Screening → Interview → Offer → Hired (or Rejected at any point).", icon: ArrowRight },
  { step: 6, title: "Close the Job", description: "Once you've hired, go to Jobs → edit the posting → change status to 'closed'. The open job count on the dashboard will update.", icon: CheckCircle2 },
];

const financeFlow: FlowStep[] = [
  { step: 1, title: "Add a Transaction", description: "Go to Finance → New Transaction. Choose type (Revenue or Expense), enter amount, category (e.g. Salary, Software, Client Payment), and date.", icon: Plus },
  { step: 2, title: "Review the Ledger", description: "The transactions list shows all entries sorted by date. Filter by type or date range. Each row shows order ID, amount, type, category, and status.", icon: FileText },
  { step: 3, title: "View Income Statement", description: "The Income Statement tab aggregates all revenue and expense transactions, shows gross profit, operating expenses, and net profit with margin.", icon: BarChart3 },
  { step: 4, title: "Cash Flow Analysis", description: "Cash Flow tab shows monthly inflows vs outflows. Positive months are surplus, negative are deficit. The running balance updates in real-time.", icon: TrendingUp },
  { step: 5, title: "AI Forecast", description: "Click 'Generate AI Forecast' on the Finance page. It projects next 3 months of revenue and expenses based on the trailing 6-month trend.", icon: Zap },
];

const payrollFlow: FlowStep[] = [
  { step: 1, title: "Add Employees to HR", description: "Before running payroll, ensure all employees exist in HR Management with their salary, department, and 'active' status.", icon: Building2 },
  { step: 2, title: "Create a Payroll Run", description: "Go to Payroll → New Run. Enter the period (e.g. June 2026), type (monthly/bi-weekly), and notes. The system auto-calculates total from active employee salaries.", icon: Plus },
  { step: 3, title: "Review the Run", description: "Open the payroll run to see a breakdown by employee: base salary, taxes estimated at 25%, and net pay. Verify totals before processing.", icon: FileText },
  { step: 4, title: "Process the Run", description: "Click 'Process' on a pending run. Status changes to 'processing' then 'completed'. Once completed, it cannot be modified.", icon: CheckCircle2 },
];

const roleTable = [
  { role: "Admin", dashboard: "✅", jobs: "✅", candidates: "✅", interviews: "✅", employees: "✅", finance: "✅", payroll: "✅", admin: "✅", settings: "✅" },
  { role: "HR Manager", dashboard: "✅", jobs: "–", candidates: "–", interviews: "–", employees: "✅", finance: "–", payroll: "✅", admin: "–", settings: "✅" },
  { role: "Recruiter", dashboard: "✅", jobs: "✅", candidates: "✅", interviews: "✅", employees: "–", finance: "–", payroll: "–", admin: "–", settings: "✅" },
  { role: "CFO", dashboard: "✅", jobs: "–", candidates: "–", interviews: "–", employees: "–", finance: "✅", payroll: "✅", admin: "–", settings: "✅" },
  { role: "Manager", dashboard: "✅", jobs: "✅", candidates: "✅", interviews: "✅", employees: "✅", finance: "–", payroll: "–", admin: "–", settings: "✅" },
  { role: "Viewer", dashboard: "✅", jobs: "–", candidates: "–", interviews: "–", employees: "–", finance: "–", payroll: "–", admin: "–", settings: "✅" },
];

const faqs: FAQ[] = [
  { question: "How do I reset my password?", answer: "On the login screen, click 'Forgot your password?' and enter your work email. You'll receive a reset link. The link expires after 1 hour. If you don't see the email, check your spam folder." },
  { question: "Can I change my role?", answer: "Only Admins can change user roles. Go to Admin → Users → click the user → Edit → change Role. The change takes effect on their next login." },
  { question: "Why is my AI score low?", answer: "The AI score is based on two factors: number of skills listed (each adds ~12 points) and years of experience (each year adds ~10 points). Add more skills to the candidate profile to improve the score." },
  { question: "Dashboard KPIs show 0 — why?", answer: "The dashboard reads live data. If you just started, add some employees (HR), create a job posting (Jobs), and add a few finance transactions. The numbers will populate immediately." },
  { question: "Can I delete a payroll run after processing?", answer: "No — completed payroll runs are locked for audit integrity. You can delete runs that are still in 'pending' status from the payroll list." },
  { question: "How do I invite a team member?", answer: "Go to Admin → Users → Add User. Enter their name, email, and assign a role. They'll be created in Supabase Auth and can log in immediately (no email invite is sent — share the login URL with them)." },
  { question: "What does 'cash runway' mean on the dashboard?", answer: "Cash runway is how many months your current cash balance would last at the current monthly burn rate. Formula: (Total Revenue − Total Expenses) ÷ Monthly Burn Rate." },
  { question: "Can I export data to CSV?", answer: "Currently, data export is not built into the UI. You can query your Supabase project directly at supabase.com/dashboard for full data export." },
  { question: "How do I close a job posting?", answer: "Go to Jobs → open the job → click Edit → change Status to 'closed'. It will no longer count in the 'Open Jobs' KPI on the dashboard." },
  { question: "Is the demo account safe for production?", answer: "No. The demo account (demo@nexus.ai / demo123) should be disabled in production. Set the DEMO_MODE=false environment variable to remove it completely." },
];

// ─── Components ───────────────────────────────────────────────────────────────

function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "amber" | "purple" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  };
  return <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium", colors[color])}>{children}</span>;
}

function SectionHeading({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4.5 h-4.5 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function FlowCard({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={s.step} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-xs font-bold text-primary-foreground">
              {s.step}
            </div>
            {i < steps.length - 1 && <div className="w-px flex-1 bg-border mt-1 mb-0" />}
          </div>
          <div className={cn("pb-5", i === steps.length - 1 && "pb-0")}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FAQItem({ question, answer }: FAQ) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="text-sm font-medium text-foreground">{question}</span>
        <ChevronRight className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform ml-3", open && "rotate-90")} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

function InfoBox({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warn" }) {
  return (
    <div className={cn(
      "flex gap-2.5 rounded-lg p-3.5 text-sm mb-5",
      variant === "info" ? "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300" : "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
    )}>
      <Info className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [active, setActive] = useState("overview");

  return (
    <div className="flex h-full">
      {/* Left nav */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-border bg-muted/20 py-4 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contents</p>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-left",
              active === s.id
                ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <s.icon className="w-3.5 h-3.5 shrink-0" />
            {s.label}
          </button>
        ))}
      </aside>

      {/* Mobile section picker */}
      <div className="md:hidden px-4 pt-4 pb-0 w-full">
        <select
          value={active}
          onChange={e => setActive(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-4"
        >
          {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-3xl">

        {/* ── Overview ── */}
        {active === "overview" && (
          <div>
            <SectionHeading icon={BookOpen} title="Platform Overview" subtitle="Everything you need to know to get started" />

            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Nexus AI is a full-stack AI Recruitment & CFO SaaS platform. It gives your executive team a single workspace for hiring, people management, and financial oversight — all backed by real-time data from your Supabase database.
            </p>

            <h3 className="text-sm font-semibold text-foreground mb-3">Core Modules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {[
                { icon: LayoutDashboard, title: "Dashboard", desc: "Live KPIs: headcount, open roles, revenue, expenses, runway" },
                { icon: Briefcase, title: "Jobs", desc: "Post and manage job openings; track applicant counts per role" },
                { icon: Users, title: "Candidates", desc: "Pipeline management with AI scoring and stage advancement" },
                { icon: Calendar, title: "Interviews", desc: "Schedule and evaluate interviews; link to candidates" },
                { icon: Building2, title: "Employees", desc: "Full employee directory with performance tracking" },
                { icon: DollarSign, title: "Finance", desc: "Transaction ledger, income statement, cash flow, AI forecast" },
                { icon: CreditCard, title: "Payroll", desc: "Payroll runs with per-employee breakdowns and processing" },
                { icon: Shield, title: "Admin", desc: "User management, org settings, role assignment, audit logs" },
              ].map(m => (
                <div key={m.title} className="flex gap-3 p-3.5 rounded-lg border border-border bg-card">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <m.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-3">Quick Start Checklist</h3>
            <div className="space-y-2">
              {[
                "Sign in with your account (or use the demo account to explore)",
                "Go to Admin → Organization and fill in your company details",
                "Add team members under Admin → Users and assign their roles",
                "Create your first Job Posting under Jobs",
                "Add Employees under HR Management with their salaries",
                "Add Finance Transactions to populate the CFO dashboard",
                "Run your first Payroll under the Payroll module",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Auth ── */}
        {active === "auth" && (
          <div>
            <SectionHeading icon={KeyRound} title="Authentication" subtitle="Login, registration, and password management" />

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><LogIn className="w-4 h-4" /> Signing In</h3>
                <p className="text-sm text-muted-foreground mb-3">Navigate to the login page. Enter your work email and password. You can also use the <Badge>Use demo account</Badge> button to explore with sample data.</p>
                <InfoBox variant="warn">The demo account (demo@nexus.ai / demo123) is for exploration only. Disable it in production by setting DEMO_MODE=false in your environment.</InfoBox>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Creating an Account</h3>
                <p className="text-sm text-muted-foreground">Click "Create one" on the login screen. You'll need your full name, organization name, work email, and a password. Your account is created immediately — no email confirmation delay.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><KeyRound className="w-4 h-4" /> Forgot Password</h3>
                <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Click "Forgot your password?" on the login page</li>
                  <li>Enter your work email address</li>
                  <li>Check your inbox for the reset link (valid for 1 hour)</li>
                  <li>Click the link and set a new password</li>
                  <li>Sign in with your new credentials</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Settings className="w-4 h-4" /> Changing Your Password</h3>
                <p className="text-sm text-muted-foreground">Go to Settings → Security. Enter your current password, then your new password (minimum 8 characters). Save changes. You'll remain logged in.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Dashboard ── */}
        {active === "dashboard" && (
          <div>
            <SectionHeading icon={LayoutDashboard} title="Dashboard" subtitle="Your real-time executive overview" />

            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              The dashboard aggregates live data from all modules into a single executive view. Every number is computed in real time — there are no cached or static values.
            </p>

            <h3 className="text-sm font-semibold text-foreground mb-3">KPI Cards</h3>
            <div className="space-y-2 mb-6">
              {[
                { label: "Total Employees", source: "Count of employees with status = active (HR module)" },
                { label: "Open Jobs", source: "Count of job postings with status = open (Jobs module)" },
                { label: "Active Candidates", source: "Candidates not in 'hired' or 'rejected' stage" },
                { label: "Interviews Scheduled", source: "Interviews with status = scheduled" },
                { label: "Monthly Revenue", source: "Sum of revenue transactions in the current calendar month" },
                { label: "Monthly Expenses", source: "Sum of expense transactions in the current calendar month" },
                { label: "Net Profit", source: "Monthly Revenue minus Monthly Expenses" },
                { label: "Payroll This Month", source: "Sum of active employee salaries ÷ 12" },
                { label: "Cash Runway", source: "(Total Revenue – Total Expenses) ÷ Monthly Burn Rate, in months" },
                { label: "Attrition Rate", source: "Percentage of employees whose status is not 'active'" },
              ].map(k => (
                <div key={k.label} className="flex gap-3 text-sm">
                  <span className="font-medium text-foreground w-40 shrink-0">{k.label}</span>
                  <span className="text-muted-foreground">{k.source}</span>
                </div>
              ))}
            </div>

            <InfoBox>If KPI cards show 0, you need to add data to the relevant modules. Each card's source is listed above.</InfoBox>

            <h3 className="text-sm font-semibold text-foreground mb-3">Charts</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Revenue vs Expenses (6 months)</span> — Bar chart from Finance transactions, grouped by calendar month.</p>
              <p><span className="font-medium text-foreground">Recruitment Funnel</span> — Percentage breakdown of candidates by pipeline stage.</p>
              <p><span className="font-medium text-foreground">Recent Activity</span> — Latest 15 events across employees, candidates, and payroll runs.</p>
            </div>
          </div>
        )}

        {/* ── Recruitment ── */}
        {active === "recruitment" && (
          <div>
            <SectionHeading icon={Briefcase} title="Recruitment Flow" subtitle="End-to-end hiring workflow" />
            <InfoBox>Roles with access: Admin, Recruiter, Manager</InfoBox>
            <FlowCard steps={recruitmentFlow} />

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">Candidate Pipeline Stages</h3>
              <div className="flex flex-wrap gap-2">
                {["applied", "screening", "interview", "offer", "hired", "rejected"].map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <Badge color={s === "hired" ? "green" : s === "rejected" ? "amber" : "blue"}>{s}</Badge>
                    {i < 5 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">AI Scoring Formula</h3>
              <div className="bg-muted/50 rounded-lg p-4 text-sm font-mono space-y-1 text-muted-foreground">
                <p>skillsScore = min(100, skills.length × 12 + 40)</p>
                <p>expScore = min(100, experienceYears × 10 + 20)</p>
                <p className="text-foreground font-semibold">aiScore = (skillsScore × 0.5 + expScore × 0.5)</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Score is out of 100. Add more skills to the candidate profile to improve their score.</p>
            </div>
          </div>
        )}

        {/* ── Interviews ── */}
        {active === "interviews" && (
          <div>
            <SectionHeading icon={Calendar} title="Interviews" subtitle="Scheduling and evaluation workflow" />
            <InfoBox>Roles with access: Admin, Recruiter, Manager</InfoBox>

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Scheduling an Interview</h3>
                <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Go to Interviews → New Interview</li>
                  <li>Select the <strong>Candidate</strong> from the dropdown (pulled live from your candidate list)</li>
                  <li>Enter interviewer name, date & time, and interview type (Video / Phone / On-site / Technical)</li>
                  <li>Add preparation questions in the Questions field</li>
                  <li>Set status to <Badge>scheduled</Badge></li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Edit className="w-4 h-4" /> Evaluating an Interview</h3>
                <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Open an interview record</li>
                  <li>Click <strong>Evaluate</strong></li>
                  <li>Enter a score (0–10), outcome (passed/failed/pending), and feedback notes</li>
                  <li>Save — the evaluation is stored against the interview record</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Interview Types</h3>
                <div className="flex flex-wrap gap-2">
                  {["video", "phone", "on-site", "technical", "final"].map(t => <Badge key={t}>{t}</Badge>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HR ── */}
        {active === "hr" && (
          <div>
            <SectionHeading icon={Building2} title="HR Management" subtitle="Employee directory and lifecycle" />
            <InfoBox>Roles with access: Admin, HR Manager, Manager</InfoBox>

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Adding an Employee</h3>
                <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Go to Employees → New Employee</li>
                  <li>Enter full name, email, department, job title, and start date</li>
                  <li>Set their annual salary — this feeds directly into Payroll calculations</li>
                  <li>Set status to <Badge color="green">active</Badge> — only active employees are counted in headcount KPIs</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Employee Statuses</h3>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p><Badge color="green">active</Badge> — Currently employed, counted in headcount and payroll</p>
                  <p><Badge color="amber">on_leave</Badge> — On leave, still counted in headcount</p>
                  <p><Badge>probation</Badge> — Probation period, counted in headcount</p>
                  <p><Badge color="amber">terminated</Badge> — No longer employed, excluded from KPIs</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Search className="w-4 h-4" /> Searching & Filtering</h3>
                <p className="text-sm text-muted-foreground">Use the search bar to filter by name. Use the department or status dropdowns to narrow the list. Click an employee row to view their full profile.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Performance Tracking</h3>
                <p className="text-sm text-muted-foreground">Employee detail pages show performance score (0–100), last review date, and skills. Update these during quarterly reviews to keep records current.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Finance ── */}
        {active === "finance" && (
          <div>
            <SectionHeading icon={DollarSign} title="Finance & CFO" subtitle="Transaction ledger, statements, and forecasting" />
            <InfoBox>Roles with access: Admin, CFO</InfoBox>
            <FlowCard steps={financeFlow} />

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">Transaction Categories</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-foreground mb-1.5">Revenue</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {["Client Payment", "Consulting", "Subscription", "License", "Other Revenue"].map(c => <li key={c} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3" />{c}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1.5">Expenses</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {["Salary", "Software", "Marketing", "Office", "Travel", "Other Expense"].map(c => <li key={c} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3" />{c}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Payroll ── */}
        {active === "payroll" && (
          <div>
            <SectionHeading icon={CreditCard} title="Payroll" subtitle="Run and process employee payroll" />
            <InfoBox>Roles with access: Admin, CFO, HR Manager</InfoBox>
            <FlowCard steps={payrollFlow} />

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">Payroll Run Statuses</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3"><Badge>draft</Badge><span className="text-muted-foreground">Created but not submitted for processing</span></div>
                <div className="flex items-center gap-3"><Badge color="amber">pending</Badge><span className="text-muted-foreground">Submitted, awaiting processing</span></div>
                <div className="flex items-center gap-3"><Badge color="purple">processing</Badge><span className="text-muted-foreground">Currently being processed</span></div>
                <div className="flex items-center gap-3"><Badge color="green">completed</Badge><span className="text-muted-foreground">Processed and locked — no further edits</span></div>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold text-foreground mb-2">How Totals Are Calculated</h3>
                <div className="bg-muted/50 rounded-lg p-4 text-sm font-mono space-y-1 text-muted-foreground">
                  <p>grossPay = employee.annual_salary / 12</p>
                  <p>taxes = grossPay × 0.25</p>
                  <p className="text-foreground font-semibold">netPay = grossPay − taxes</p>
                  <p className="mt-2">runTotal = Σ grossPay (all active employees)</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Tax rate is estimated at 25%. Update employee salaries in HR Management to keep payroll accurate.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Admin ── */}
        {active === "admin" && (
          <div>
            <SectionHeading icon={Shield} title="Admin & Settings" subtitle="User management, org config, and audit logs" />
            <InfoBox variant="warn">Admin panel is only accessible to users with the Admin role.</InfoBox>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> User Management</h3>
                <p className="text-sm text-muted-foreground mb-2">All users are stored in Supabase Auth — not in memory. Changes persist across server restarts.</p>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /><span><strong>Add User</strong> — Creates a confirmed account immediately. Share the login URL with the new team member.</span></p>
                  <p className="flex items-center gap-2"><Edit className="w-3.5 h-3.5" /><span><strong>Edit Role</strong> — Change role takes effect on next login.</span></p>
                  <p className="flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /><span><strong>Delete</strong> — Permanently removes the user from Supabase Auth.</span></p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Settings className="w-4 h-4" /> Organization Settings</h3>
                <p className="text-sm text-muted-foreground">Set your organization name, industry, company size, currency, and country. These settings are stored in the database and shown in the sidebar header.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Audit Logs</h3>
                <p className="text-sm text-muted-foreground">The audit log shows the 50 most recent changes across employees, candidates, interviews, payroll runs, and finance transactions. Sorted by most recent first.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Roles ── */}
        {active === "roles" && (
          <div>
            <SectionHeading icon={User} title="Roles & Permissions" subtitle="Who can access what" />

            <p className="text-sm text-muted-foreground mb-5">Role-based access is enforced on both the server (API returns 403 for unauthorized roles) and the frontend (nav items are hidden). Assign roles in Admin → Users.</p>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2.5 font-semibold text-foreground">Role</th>
                    {["Dashboard", "Jobs", "Candidates", "Interviews", "Employees", "Finance", "Payroll", "Admin", "Settings"].map(h => (
                      <th key={h} className="px-2 py-2.5 font-semibold text-foreground text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roleTable.map((row, i) => (
                    <tr key={row.role} className={cn("border-t border-border", i % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                      <td className="px-3 py-2.5 font-medium text-foreground">{row.role}</td>
                      {[row.dashboard, row.jobs, row.candidates, row.interviews, row.employees, row.finance, row.payroll, row.admin, row.settings].map((v, j) => (
                        <td key={j} className={cn("px-2 py-2.5 text-center", v === "✅" ? "text-green-600" : "text-muted-foreground/40")}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-2">
              {[
                { role: "Admin", desc: "Full access to everything including user management and org settings" },
                { role: "HR Manager", desc: "Manages employees and payroll; no access to finance or recruitment" },
                { role: "Recruiter", desc: "Full recruitment pipeline — jobs, candidates, interviews; no finance" },
                { role: "CFO", desc: "Finance and payroll only; no HR or recruitment" },
                { role: "Manager", desc: "Operational view — dashboard, recruitment pipeline, employees; no finance" },
                { role: "Viewer", desc: "Dashboard and settings only; read-only operational awareness" },
              ].map(r => (
                <div key={r.role} className="flex gap-2.5 text-sm">
                  <Badge color="blue">{r.role}</Badge>
                  <span className="text-muted-foreground">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        {active === "faq" && (
          <div>
            <SectionHeading icon={HelpCircle} title="Frequently Asked Questions" subtitle="Common questions and answers" />
            <div className="space-y-2">
              {faqs.map(f => <FAQItem key={f.question} {...f} />)}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
