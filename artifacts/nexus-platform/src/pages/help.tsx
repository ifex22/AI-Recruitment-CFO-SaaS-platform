import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, Users, Calendar, Building2,
  DollarSign, CreditCard, Shield, Settings, ChevronRight,
  ArrowRight, CheckCircle2, Info, Zap, BookOpen, HelpCircle,
  User, LogIn, UserPlus, KeyRound, Search, Plus, Edit,
  Trash2, Filter, Download, TrendingUp, BarChart3, FileText,
  Globe, MessageSquare, Bell, Mail, Phone, Bot, Send,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
  group?: string;
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
  { id: "overview",        label: "Platform Overview",      icon: BookOpen,        group: "Getting Started" },
  { id: "auth",            label: "Authentication",         icon: KeyRound,        group: "Getting Started" },
  { id: "dashboard",       label: "Dashboard & AI Inbox",   icon: LayoutDashboard, group: "Features" },
  { id: "ai-portal",       label: "AI Job Board & Apply",   icon: Globe,           group: "Features" },
  { id: "ai-interview",    label: "AI Interview Flow",      icon: Bot,             group: "Features" },
  { id: "communications",  label: "Communications Setup",   icon: Mail,            group: "Features" },
  { id: "notifications",   label: "Recruiter Notifications",icon: Bell,            group: "Features" },
  { id: "recruitment",     label: "Recruitment (Internal)", icon: Briefcase,       group: "Modules" },
  { id: "interviews",      label: "Interviews",             icon: Calendar,        group: "Modules" },
  { id: "hr",              label: "HR Management",          icon: Building2,       group: "Modules" },
  { id: "finance",         label: "Finance & CFO",          icon: DollarSign,      group: "Modules" },
  { id: "payroll",         label: "Payroll",                icon: CreditCard,      group: "Modules" },
  { id: "admin",           label: "Admin & Settings",       icon: Shield,          group: "Reference" },
  { id: "roles",           label: "Roles & Permissions",    icon: User,            group: "Reference" },
  { id: "faq",             label: "FAQ",                    icon: HelpCircle,      group: "Reference" },
];

const recruitmentFlow: FlowStep[] = [
  { step: 1, title: "Create a Job Posting", description: "Go to Jobs → New Job. Fill in title, department, description, requirements, and salary range. Set status to 'open' to make it active and appear on the public job board.", icon: Plus },
  { step: 2, title: "Candidates Apply via Job Board", description: "Candidates visit the public job board at the root URL (/). They see all open jobs, click Apply, fill in their details, then complete a 5-question AI interview automatically.", icon: Globe },
  { step: 3, title: "AI Scores Each Candidate", description: "After the interview GPT-4o-mini analyzes the conversation and produces a score (0–100), recommendation label, 2-sentence summary, and bullet-point strengths.", icon: Zap },
  { step: 4, title: "Recruiter Reviews in Dashboard", description: "The AI Recruiter Inbox on the Dashboard shows every scored candidate in real time. Strong Hire / Hire picks appear in the Top AI Picks panel for instant shortlisting.", icon: LayoutDashboard },
  { step: 5, title: "Schedule an Interview", description: "Go to Interviews → New Interview. Select the candidate, choose interviewer, date, type (Video / Phone / On-site / Technical), and add questions for the human interview round.", icon: Calendar },
  { step: 6, title: "Advance Through Stages", description: "On the candidate record, use 'Advance Stage' to move them: Applied → Screening → Interview → Offer → Hired (or Rejected at any point).", icon: ArrowRight },
  { step: 7, title: "Close the Job", description: "Once you've hired, go to Jobs → edit the posting → change status to 'closed'. The open job count on the dashboard will update immediately.", icon: CheckCircle2 },
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

const aiPortalFlow: FlowStep[] = [
  { step: 1, title: "Candidate Visits the Job Board", description: "The public-facing job board lives at the root URL (e.g. nexusai.app/). No login required. It shows all jobs with status = open, including title, department, location, salary range, and employment type.", icon: Globe },
  { step: 2, title: "Candidate Clicks Apply", description: "They click 'Apply Now' on any job card. The application form collects: full name, email, phone, years of experience, expected salary, key skills (comma-separated), and an optional cover letter.", icon: Edit },
  { step: 3, title: "Application is Submitted", description: "On submit the system creates a candidate record linked to the job, issues a unique interview token, and redirects the candidate to the AI interview. No recruiter action is needed at this point.", icon: CheckCircle2 },
  { step: 4, title: "AI Conducts the Interview", description: "The AI asks exactly 5 questions, one at a time: typically covering technical skills, a past project, testing approach, relevant tools/stack, and a behavioural question. The candidate types their answers.", icon: Bot },
  { step: 5, title: "Score & Notify", description: "After the 5th answer the system scores the interview (see AI Interview Flow section) and — if configured — sends the recruiter an email/SMS with the full AI report.", icon: Send },
];

const aiInterviewFlow: FlowStep[] = [
  { step: 1, title: "Conversation starts", description: "The AI introduces itself as a recruiter and asks question 1 of 5. Questions are tailored to the specific job title and requirements stored in the job posting.", icon: MessageSquare },
  { step: 2, title: "5 questions across key dimensions", description: "Q1: Technical skills / stack experience. Q2: Challenging project or problem solved. Q3: Testing / quality approach. Q4: Relevant tooling (databases, cloud, etc.). Q5: Behavioural / cultural fit.", icon: Bot },
  { step: 3, title: "AI detects final answer", description: "After the 5th user message, the AI thanks the candidate, tells them the interview is complete, and explains they'll receive results by email. The session is locked — no further messages accepted.", icon: CheckCircle2 },
  { step: 4, title: "Scoring prompt sent to GPT-4o-mini", description: "The full conversation transcript is sent to GPT-4o-mini with a structured scoring prompt. The model returns JSON with: overall_score (0–100), individual dimension scores, recommendation, 2-sentence summary, and strengths/improvements lists.", icon: Zap },
  { step: 5, title: "Score saved to candidate record", description: "The result is persisted to the candidate's record. The Dashboard AI Recruiter Inbox and Recruitment Notifications endpoint reflect the new score immediately.", icon: FileText },
  { step: 6, title: "Recruiter notified", description: "If admin_email or admin_phone are configured under Admin → Communications → Recruiter Notifications, an email and/or SMS is sent with the full score report.", icon: Bell },
];

const commsSetupFlow: FlowStep[] = [
  { step: 1, title: "Open Communications Settings", description: "Log in as Admin → go to Admin → click the 'Communications' tab. You'll see four configuration cards.", icon: Settings },
  { step: 2, title: "Set up Email (Resend)", description: "Get a free Resend API key at resend.com. Paste it into 'Resend API Key'. Enter your verified From Email (must be a domain you own or a Resend sandbox address). Save.", icon: Mail },
  { step: 3, title: "Set up SMS (Twilio) — optional", description: "Get Twilio Account SID, Auth Token, and a Twilio phone number from console.twilio.com. Paste all three into the SMS card. Save. SMS alerts are only sent if all three values are present.", icon: Phone },
  { step: 4, title: "Set AI Model (OpenAI) — optional", description: "The system uses the built-in Replit OpenAI integration by default — no key needed. To use your own OpenAI account instead, paste your sk-... API key into the AI Model card.", icon: Bot },
  { step: 5, title: "Set Recruiter Notification Targets", description: "Enter the recruiter's email address and/or phone number (E.164 format, e.g. +1 555 000 1234) in the 'Admin & Recruiter Notifications' card. Save. From this point every new application and scored interview triggers an alert.", icon: Bell },
];

const roleTable = [
  { role: "Admin",      dashboard: "✅", jobs: "✅", candidates: "✅", interviews: "✅", employees: "✅", finance: "✅", payroll: "✅", admin: "✅", settings: "✅" },
  { role: "HR Manager", dashboard: "✅", jobs: "–",  candidates: "–",  interviews: "–",  employees: "✅", finance: "–",  payroll: "✅", admin: "–",  settings: "✅" },
  { role: "Recruiter",  dashboard: "✅", jobs: "✅", candidates: "✅", interviews: "✅", employees: "–",  finance: "–",  payroll: "–",  admin: "–",  settings: "✅" },
  { role: "CFO",        dashboard: "✅", jobs: "–",  candidates: "–",  interviews: "–",  employees: "–",  finance: "✅", payroll: "✅", admin: "–",  settings: "✅" },
  { role: "Manager",    dashboard: "✅", jobs: "✅", candidates: "✅", interviews: "✅", employees: "✅", finance: "–",  payroll: "–",  admin: "–",  settings: "✅" },
  { role: "Viewer",     dashboard: "✅", jobs: "–",  candidates: "–",  interviews: "–",  employees: "–",  finance: "–",  payroll: "–",  admin: "–",  settings: "✅" },
];

const faqs: FAQ[] = [
  { question: "How does the AI interview work?", answer: "When a candidate applies via the public job board they're redirected to an AI chat interface. GPT-4o-mini asks exactly 5 questions tailored to the job role (technical skills, past projects, testing, tooling, and a behavioural question). After the 5th answer it scores the full transcript and saves a score (0–100), recommendation (Strong Hire / Hire / Maybe / No Hire), summary, and strengths to the candidate's record." },
  { question: "Do I need an OpenAI API key?", answer: "No. The platform uses the built-in Replit OpenAI integration (gpt-4o-mini) with no setup required. If you prefer to use your own OpenAI account, paste your sk-... key into Admin → Communications → AI Model card. The stored key must start with 'sk-' and be longer than 20 characters — anything else is ignored and the built-in integration is used." },
  { question: "How do I receive recruiter notifications?", answer: "Go to Admin → Communications → 'Admin & Recruiter Notifications' card. Enter your email and/or phone number, then save. You'll receive an alert for every new application (with candidate details) and every completed AI interview (with score, recommendation, and summary). Requires Resend configured for email, Twilio for SMS." },
  { question: "Why is the AI Recruiter Inbox empty?", answer: "The inbox shows candidates who applied via the public job board and completed the AI interview. If no one has applied yet, it will be empty. Go to the root URL (public job board), apply for an open role, complete the 5-question interview, and you'll see the scored result appear in the inbox immediately." },
  { question: "How do I reset my password?", answer: "On the login screen, click 'Forgot your password?' and enter your work email. You'll receive a reset link. The link expires after 1 hour. If you don't see the email, check your spam folder." },
  { question: "Can I change my role?", answer: "Only Admins can change user roles. Go to Admin → Users → click the user → Edit → change Role. The change takes effect on their next login." },
  { question: "Dashboard KPIs show 0 — why?", answer: "The dashboard reads live data. If you just started, add some employees (HR), create a job posting (Jobs), and add a few finance transactions. The numbers will populate immediately." },
  { question: "Can I delete a payroll run after processing?", answer: "No — completed payroll runs are locked for audit integrity. You can delete runs that are still in 'pending' status from the payroll list." },
  { question: "How do I invite a team member?", answer: "Go to Admin → Users → Add User. Enter their name, email, and assign a role. They'll be created in Supabase Auth and can log in immediately (no email invite is sent — share the login URL with them)." },
  { question: "What does 'cash runway' mean on the dashboard?", answer: "Cash runway is how many months your current cash balance would last at the current monthly burn rate. Formula: (Total Revenue − Total Expenses) ÷ Monthly Burn Rate." },
  { question: "How do I close a job posting?", answer: "Go to Jobs → open the job → click Edit → change Status to 'closed'. It will no longer count in the 'Open Jobs' KPI on the dashboard and will disappear from the public job board." },
  { question: "Is the demo account safe for production?", answer: "No. The demo account (demo@nexus.ai / demo123) is for exploration only. Disable it in production by setting DEMO_MODE=false in your environment." },
  { question: "What AI recommendation labels mean?", answer: "Strong Hire (score ~85–100): Excellent match, move to human interview immediately. Hire (65–84): Good match, worth interviewing. Maybe (45–64): Some gaps, use judgment. No Hire (<45): Significant skill or experience mismatch." },
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

function InfoBox({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warn" | "success" }) {
  return (
    <div className={cn(
      "flex gap-2.5 rounded-lg p-3.5 text-sm mb-5",
      variant === "info"    ? "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"   :
      variant === "success" ? "bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-300" :
                              "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
    )}>
      <Info className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function RecommendationBadge({ label, score, color, desc }: { label: string; score: string; color: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
      <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5", color)}>{label}</span>
      <div>
        <p className="text-xs font-medium text-foreground">{score}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [active, setActive] = useState("overview");

  const groups = ["Getting Started", "Features", "Modules", "Reference"];

  return (
    <div className="flex h-full">
      {/* Left nav */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-muted/20 py-4 overflow-y-auto">
        {groups.map(group => {
          const groupSections = sections.filter(s => s.group === group);
          return (
            <div key={group} className="mb-3">
              <p className="px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{group}</p>
              {groupSections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-1.5 text-sm transition-colors text-left w-full",
                    active === s.id
                      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <s.icon className="w-3.5 h-3.5 shrink-0" />
                  {s.label}
                </button>
              ))}
            </div>
          );
        })}
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
              Nexus AI is a full-stack AI Recruitment & CFO SaaS platform. It gives your team a single workspace for hiring (including an AI-powered public job board), people management, and financial oversight — all backed by real-time Supabase data.
            </p>

            <h3 className="text-sm font-semibold text-foreground mb-3">Core Modules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {[
                { icon: Globe,          title: "Public Job Board",  desc: "Candidates self-apply; AI interviews them automatically — no recruiter time required" },
                { icon: Bot,            title: "AI Interview",       desc: "GPT-4o-mini conducts 5-question interviews and scores each candidate 0–100" },
                { icon: LayoutDashboard,title: "Dashboard",          desc: "Live KPIs + AI Recruiter Inbox: every scored applicant appears here in real time" },
                { icon: Briefcase,      title: "Jobs",               desc: "Post and manage job openings; published jobs appear on the public board" },
                { icon: Users,          title: "Candidates",         desc: "Pipeline management with AI scores and manual stage advancement" },
                { icon: Calendar,       title: "Interviews",         desc: "Schedule human interview rounds; link to candidates" },
                { icon: Building2,      title: "Employees",          desc: "Full employee directory with performance tracking" },
                { icon: DollarSign,     title: "Finance",            desc: "Transaction ledger, income statement, cash flow, AI forecast" },
                { icon: CreditCard,     title: "Payroll",            desc: "Payroll runs with per-employee breakdowns and processing" },
                { icon: Shield,         title: "Admin",              desc: "User management, org settings, communications config, audit logs" },
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
                "Sign in (or use demo@nexus.ai / demo123 to explore)",
                "Admin → Communications: add Resend API key + recruiter email/phone for alerts",
                "Create a Job Posting (Jobs → New Job) — set status to 'open'",
                "Share the public job board URL with candidates or test it yourself",
                "Watch scored applications appear in Dashboard → AI Recruiter Inbox",
                "Add employees in HR Management with their salaries",
                "Add Finance transactions to populate the CFO dashboard",
                "Run Payroll under the Payroll module",
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
            </div>
          </div>
        )}

        {/* ── Dashboard ── */}
        {active === "dashboard" && (
          <div>
            <SectionHeading icon={LayoutDashboard} title="Dashboard & AI Recruiter Inbox" subtitle="Real-time executive overview + live candidate feed" />

            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              The dashboard has two sections: the top KPI cards and charts (finance / people data) and the AI Recruiter Inbox below — a live feed of every candidate who has applied and been scored by the AI.
            </p>

            <h3 className="text-sm font-semibold text-foreground mb-3">KPI Cards</h3>
            <div className="space-y-2 mb-6">
              {[
                { label: "Total Employees",      source: "Count of employees with status = active (HR module)" },
                { label: "Open Jobs",            source: "Count of job postings with status = open (Jobs module)" },
                { label: "Active Candidates",    source: "Candidates not in 'hired' or 'rejected' stage" },
                { label: "Interviews Scheduled", source: "Interviews with status = scheduled" },
                { label: "Monthly Revenue",      source: "Sum of revenue transactions in the current calendar month" },
                { label: "Monthly Expenses",     source: "Sum of expense transactions in the current calendar month" },
                { label: "Net Profit",           source: "Monthly Revenue minus Monthly Expenses" },
                { label: "Payroll This Month",   source: "Sum of active employee salaries ÷ 12" },
                { label: "Cash Runway",          source: "(Total Revenue – Total Expenses) ÷ Monthly Burn Rate, in months" },
                { label: "Attrition Rate",       source: "Percentage of employees whose status is not 'active'" },
              ].map(k => (
                <div key={k.label} className="flex gap-3 text-sm">
                  <span className="font-medium text-foreground w-44 shrink-0">{k.label}</span>
                  <span className="text-muted-foreground">{k.source}</span>
                </div>
              ))}
            </div>

            <InfoBox>If KPI cards show 0, add data to the relevant modules. Each card's source is listed above.</InfoBox>

            <h3 className="text-sm font-semibold text-foreground mb-3 mt-6">AI Recruiter Inbox (bottom panels)</h3>
            <div className="space-y-3 mb-5">
              {[
                { label: "Scored Interviews (left panel)", desc: "Every candidate who completed the AI interview appears here with their score badge, recommendation label, summary, and strengths. Sorted by score descending." },
                { label: "Top AI Picks (right top)",       desc: "Filters to only 'Strong Hire' and 'Hire' candidates — your instant shortlist." },
                { label: "Awaiting Interview (right mid)", desc: "Candidates who applied but haven't finished the AI interview yet. 'Live' badge if they're actively chatting right now." },
                { label: "Recruiter Alert Status",         desc: "Shows whether admin_email and admin_phone notifications are configured. Links to Admin → Communications to set them up." },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg border border-border text-sm">
                  <p className="font-medium text-foreground mb-0.5">{item.label}</p>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-3">Charts</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Revenue vs Expenses (6 months)</span> — Bar chart from Finance transactions, grouped by calendar month.</p>
              <p><span className="font-medium text-foreground">Recruitment Funnel</span> — Percentage breakdown of candidates by pipeline stage.</p>
              <p><span className="font-medium text-foreground">Recent Activity</span> — Latest 15 events across employees, candidates, and payroll runs.</p>
            </div>
          </div>
        )}

        {/* ── AI Portal ── */}
        {active === "ai-portal" && (
          <div>
            <SectionHeading icon={Globe} title="AI Job Board & Apply Flow" subtitle="The public-facing candidate experience" />
            <InfoBox variant="success">No login required for candidates. The entire apply + interview flow is public.</InfoBox>
            <FlowCard steps={aiPortalFlow} />

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">Application Form Fields</h3>
              <div className="space-y-2">
                {[
                  { field: "Full Name",           required: true,  notes: "Stored as candidate name" },
                  { field: "Email",               required: true,  notes: "Must be unique per candidate; used for notifications" },
                  { field: "Phone",               required: false, notes: "E.164 format recommended for SMS (e.g. +15550001234)" },
                  { field: "Years of Experience", required: true,  notes: "Used in AI scoring context" },
                  { field: "Expected Salary",     required: true,  notes: "Displayed in recruiter notifications" },
                  { field: "Key Skills",          required: true,  notes: "Comma-separated; provided as context to the AI interviewer" },
                  { field: "Cover Letter",        required: false, notes: "Optional; included in application summary" },
                ].map(f => (
                  <div key={f.field} className="flex gap-3 text-sm items-start">
                    <span className="font-medium text-foreground w-40 shrink-0">{f.field} {f.required && <span className="text-red-500">*</span>}</span>
                    <span className="text-muted-foreground">{f.notes}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2"><span className="text-red-500">*</span> Required field</p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Which jobs appear on the board?</h3>
              <p className="text-sm text-muted-foreground">Only jobs where <Badge>status = open</Badge> are shown. Closed or draft jobs are hidden. To publish a job: Jobs → edit → set status to "open" → save.</p>
            </div>
          </div>
        )}

        {/* ── AI Interview ── */}
        {active === "ai-interview" && (
          <div>
            <SectionHeading icon={Bot} title="AI Interview Flow" subtitle="How GPT-4o-mini interviews and scores candidates" />
            <InfoBox>AI model: gpt-4o-mini via Replit OpenAI integration. No API key needed unless you want to use your own account.</InfoBox>

            <FlowCard steps={aiInterviewFlow} />

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">Score Dimensions</h3>
              <div className="space-y-2 text-sm">
                {[
                  { dim: "Overall Score",        range: "0–100",  desc: "Composite score across all dimensions" },
                  { dim: "Technical Skills",      range: "0–100",  desc: "Depth and relevance of technical knowledge" },
                  { dim: "Experience",            range: "0–100",  desc: "Years and quality of relevant experience" },
                  { dim: "Problem Solving",       range: "0–100",  desc: "Approach to challenges described in interview" },
                  { dim: "Communication",         range: "0–100",  desc: "Clarity, structure, and professionalism" },
                  { dim: "Cultural Fit",          range: "0–100",  desc: "Alignment with stated values and team dynamics" },
                ].map(d => (
                  <div key={d.dim} className="flex gap-3 items-start">
                    <span className="font-medium text-foreground w-36 shrink-0">{d.dim}</span>
                    <Badge color="blue">{d.range}</Badge>
                    <span className="text-muted-foreground">{d.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Recommendation Labels</h3>
              <div className="space-y-2">
                <RecommendationBadge label="Strong Hire" score="~85–100" color="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"   desc="Excellent match. Move to human interview immediately." />
                <RecommendationBadge label="Hire"        score="~65–84"  color="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"         desc="Good match. Worth a human interview round." />
                <RecommendationBadge label="Maybe"       score="~45–64"  color="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"      desc="Some gaps. Use judgment based on role urgency." />
                <RecommendationBadge label="No Hire"     score="<45"     color="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"               desc="Significant mismatch with requirements." />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">What the recruiter receives (if notifications configured)</h3>
              <div className="bg-muted/40 rounded-lg p-4 text-sm font-mono text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Email subject: 🎯 Interview Scored: Jane E2E — Senior Full-Stack Engineer</p>
                <p>Score: 85/100</p>
                <p>Recommendation: Hire</p>
                <p>Summary: The candidate demonstrates strong technical skills...</p>
                <p>Strengths: Strong technical proficiency, Collaborative approach</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Communications Setup ── */}
        {active === "communications" && (
          <div>
            <SectionHeading icon={Mail} title="Communications Setup" subtitle="Configure email, SMS, AI model, and recruiter alerts" />
            <InfoBox>All settings are saved in the database — they persist across server restarts and are masked (only last 4 chars shown) after saving.</InfoBox>

            <FlowCard steps={commsSetupFlow} />

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-4">Configuration Cards at a Glance</h3>
              <div className="space-y-3">
                {[
                  {
                    title: "Email (Resend)",
                    icon: Mail,
                    fields: ["Resend API Key (re_...)","From Email (must be a verified domain or Resend sandbox address)"],
                    trigger: "Candidate application confirmation, AI score report to recruiter",
                    note: "Free Resend tier: 100 emails/day. Get a key at resend.com.",
                  },
                  {
                    title: "SMS (Twilio)",
                    icon: Phone,
                    fields: ["Twilio Account SID","Twilio Auth Token","Twilio From Number (E.164 format)"],
                    trigger: "Same events as email — sent in addition to email if configured",
                    note: "All three Twilio fields must be present — any missing field disables SMS.",
                  },
                  {
                    title: "AI Model (OpenAI)",
                    icon: Bot,
                    fields: ["OpenAI API Key (sk-...)"],
                    trigger: "Used for AI interview questions and scoring",
                    note: "Leave blank to use the built-in Replit integration (gpt-4o-mini, no key needed).",
                  },
                  {
                    title: "Recruiter Notifications",
                    icon: Bell,
                    fields: ["Admin/Recruiter Email","Admin/Recruiter Phone (E.164)"],
                    trigger: "Fired on: new application received, AI interview scored",
                    note: "At least one of email or phone is required. Requires the corresponding service (Resend or Twilio) to be configured.",
                  },
                ].map(card => (
                  <div key={card.title} className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">{card.title}</h4>
                    </div>
                    <div className="space-y-1 mb-2">
                      {card.fields.map(f => (
                        <p key={f} className="text-xs text-muted-foreground flex items-center gap-1.5"><ChevronRight className="w-3 h-3 shrink-0" />{f}</p>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Triggers: </span>{card.trigger}</p>
                    <p className="text-xs text-muted-foreground mt-1"><span className="font-medium text-foreground">Note: </span>{card.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Testing your setup</h3>
              <p className="text-sm text-muted-foreground">After saving your settings, the status badges on each card turn green. To confirm emails are sending: apply for a job via the public job board and complete the AI interview — if notifications are configured you'll receive the score email within seconds.</p>
            </div>
          </div>
        )}

        {/* ── Notifications ── */}
        {active === "notifications" && (
          <div>
            <SectionHeading icon={Bell} title="Recruiter Notifications" subtitle="What events trigger alerts and what they contain" />

            <InfoBox variant="success">Notifications are automatic — no polling or manual trigger needed. Each event fires the moment it occurs.</InfoBox>

            <h3 className="text-sm font-semibold text-foreground mb-3">Notification Events</h3>
            <div className="space-y-3 mb-6">
              {[
                {
                  event: "New Application",
                  when: "Candidate submits the apply form",
                  channel: "Email + SMS (if configured)",
                  contains: ["Candidate name, email, phone", "Job title they applied for", "Years of experience", "Expected salary", "Listed skills", "Cover letter excerpt"],
                },
                {
                  event: "AI Interview Scored",
                  when: "Candidate finishes the 5th interview question",
                  channel: "Email + SMS (if configured)",
                  contains: ["Overall score (0–100)", "Recommendation label (Strong Hire / Hire / Maybe / No Hire)", "2-sentence AI summary", "Bullet-point strengths", "Improvement areas"],
                },
              ].map(n => (
                <div key={n.event} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">{n.event}</h4>
                    <Badge color="blue">{n.channel}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2"><span className="font-medium text-foreground">When: </span>{n.when}</p>
                  <p className="text-xs font-medium text-foreground mb-1">Includes:</p>
                  <ul className="space-y-0.5">
                    {n.contains.map(c => (
                      <li key={c} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-3">Dashboard AI Recruiter Inbox</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Even without email/SMS configured, the Dashboard shows a live recruiter inbox with every scored candidate. The inbox updates in real time — refresh the dashboard after a candidate finishes their interview and they appear immediately.
            </p>
            <div className="space-y-2 text-sm">
              {[
                { label: "Scored Interviews panel",  desc: "All candidates with a completed AI score, sorted best-first" },
                { label: "Top AI Picks",             desc: "Only Strong Hire and Hire — your instant shortlist" },
                { label: "Awaiting Interview",       desc: "Applied but not yet finished the AI chat" },
                { label: "Recruiter Alert Status",   desc: "Green = notifications active, amber = not configured (click to set up)" },
              ].map(item => (
                <div key={item.label} className="flex gap-3">
                  <span className="font-medium text-foreground w-44 shrink-0 text-sm">{item.label}</span>
                  <span className="text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Setup checklist for notifications</h3>
              <div className="space-y-2">
                {[
                  "Admin → Communications → Email card: add Resend API key + From Email",
                  "Admin → Communications → Recruiter Notifications card: add recruiter email",
                  "Optionally: add Twilio SID/token/number + recruiter phone for SMS",
                  "Save — status badges turn green when configured correctly",
                  "Test by applying for a job via the public job board",
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Recruitment ── */}
        {active === "recruitment" && (
          <div>
            <SectionHeading icon={Briefcase} title="Recruitment (Internal)" subtitle="Managing the pipeline once candidates are in the system" />
            <InfoBox>Roles with access: Admin, Recruiter, Manager</InfoBox>
            <InfoBox variant="warn">The AI-driven inbound flow (job board → apply → AI interview → score) is documented under "AI Job Board & Apply" and "AI Interview Flow". This section covers the internal candidate management that follows.</InfoBox>

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
              <h3 className="text-sm font-semibold text-foreground mb-3">AI Score — What Each Field Means</h3>
              <p className="text-sm text-muted-foreground mb-2">Scores are produced by GPT-4o-mini after the candidate completes the AI interview. Manual "Score with AI" on a candidate card uses a simpler formula based on skills count and experience years (for candidates added manually without an interview).</p>
              <div className="bg-muted/50 rounded-lg p-4 text-sm font-mono space-y-1 text-muted-foreground">
                <p className="text-xs text-foreground font-semibold mb-1">Manual scoring formula (no interview transcript):</p>
                <p>skillsScore = min(100, skills.length × 12 + 40)</p>
                <p>expScore   = min(100, experienceYears × 10 + 20)</p>
                <p className="text-foreground font-semibold">aiScore = (skillsScore × 0.5 + expScore × 0.5)</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Interviews ── */}
        {active === "interviews" && (
          <div>
            <SectionHeading icon={Calendar} title="Interviews (Human Rounds)" subtitle="Scheduling and evaluation of human interview rounds" />
            <InfoBox>Roles with access: Admin, Recruiter, Manager. This section is for human-conducted interviews scheduled after the AI pre-screen.</InfoBox>

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Scheduling an Interview</h3>
                <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Go to Interviews → New Interview</li>
                  <li>Select the <strong>Candidate</strong> from the dropdown (pulled live from your candidate list)</li>
                  <li>Enter interviewer name, date & time, and interview type (Video / Phone / On-site / Technical)</li>
                  <li>Add up to 5 evaluation questions in the Questions field</li>
                  <li>Save — the interview appears in the calendar view and the candidate's timeline</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Edit className="w-4 h-4" /> Interview Types</h3>
                <div className="grid grid-cols-2 gap-2">
                  {["Video Call", "Phone Screen", "On-site", "Technical / Coding"].map(t => (
                    <div key={t} className="text-sm p-2.5 rounded-md border border-border text-muted-foreground">{t}</div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Marking Outcomes</h3>
                <p className="text-sm text-muted-foreground">Open the interview record → click Edit → change Status to <Badge>completed</Badge> and add notes. Then advance the candidate stage from the Candidates screen.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Filter className="w-4 h-4" /> Filtering</h3>
                <p className="text-sm text-muted-foreground">Use the search box to filter by candidate name or interviewer. Use the status dropdown to show only scheduled / completed / cancelled interviews.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── HR ── */}
        {active === "hr" && (
          <div>
            <SectionHeading icon={Building2} title="HR Management" subtitle="Employee directory, org structure, and performance" />
            <InfoBox>Roles with access: Admin, HR Manager, Manager</InfoBox>

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Adding an Employee</h3>
                <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Go to HR Management → New Employee</li>
                  <li>Fill in: full name, email, department, position/title, salary, start date, and status</li>
                  <li>Save — they immediately appear in headcount KPIs and payroll calculations</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Performance Tracking</h3>
                <p className="text-sm text-muted-foreground">Open an employee record to view their performance score (0–100), review notes, last review date, and attendance rate. Edit the record to update performance data after a review cycle.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Search className="w-4 h-4" /> Org Chart</h3>
                <p className="text-sm text-muted-foreground">The Org Chart tab shows a hierarchical view of all active employees grouped by department. It auto-generates from the department field — no manual structure needed.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Offboarding</h3>
                <p className="text-sm text-muted-foreground">To offboard: edit the employee → change Status to 'inactive' or 'terminated'. They'll be removed from headcount KPIs and payroll calculations but their record is retained for audit purposes.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Finance ── */}
        {active === "finance" && (
          <div>
            <SectionHeading icon={DollarSign} title="Finance & CFO" subtitle="Transaction ledger, statements, and AI forecasting" />
            <InfoBox>Roles with access: Admin, CFO</InfoBox>
            <FlowCard steps={financeFlow} />

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">Transaction Categories</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="font-medium text-foreground mb-1.5">Revenue</p>
                  {["Client Payment", "Consulting", "License Fee", "Service Revenue"].map(c => (
                    <p key={c} className="text-muted-foreground">{c}</p>
                  ))}
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1.5">Expenses</p>
                  {["Salary", "Software", "Marketing", "Infrastructure", "Office", "Legal"].map(c => (
                    <p key={c} className="text-muted-foreground">{c}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Payroll ── */}
        {active === "payroll" && (
          <div>
            <SectionHeading icon={CreditCard} title="Payroll" subtitle="Run and manage payroll cycles" />
            <InfoBox>Roles with access: Admin, CFO, HR Manager</InfoBox>
            <FlowCard steps={payrollFlow} />

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">Tax & Deduction Estimates</h3>
              <div className="bg-muted/50 rounded-lg p-4 text-sm font-mono space-y-1 text-muted-foreground">
                <p>grossPay = employeeSalary / 12 (monthly)</p>
                <p>taxRate  = 25%</p>
                <p>taxes    = grossPay × 0.25</p>
                <p className="text-foreground font-semibold">netPay   = grossPay − taxes</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">These are estimates for display purposes. Consult your payroll provider for actual tax calculations.</p>
            </div>
          </div>
        )}

        {/* ── Admin ── */}
        {active === "admin" && (
          <div>
            <SectionHeading icon={Shield} title="Admin & Settings" subtitle="User management, org config, audit, and communications" />
            <InfoBox variant="warn">Admin role required for all features in this section.</InfoBox>

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><UserPlus className="w-4 h-4" /> User Management</h3>
                <p className="text-sm text-muted-foreground mb-2">Admin → Users tab. Add, edit, or deactivate platform users. Assign one of six roles. Changes take effect on the user's next login.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Building2 className="w-4 h-4" /> Organization Settings</h3>
                <p className="text-sm text-muted-foreground">Admin → Organization tab. Set your company name, industry, size, website, and address. These details appear in email footers and org-level reports.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Mail className="w-4 h-4" /> Communications Tab</h3>
                <p className="text-sm text-muted-foreground mb-2">Admin → Communications tab. Four cards:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 shrink-0" /><strong>Email (Resend)</strong> — API key + sender address</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 shrink-0" /><strong>SMS (Twilio)</strong> — Account SID, Auth Token, From number</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 shrink-0" /><strong>AI Model (OpenAI)</strong> — Optional custom key; defaults to built-in</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 shrink-0" /><strong>Recruiter Notifications</strong> — Recruiter email and phone targets</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">See the <button onClick={() => setActive("communications")} className="text-primary underline underline-offset-2">Communications Setup</button> section for full details.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Audit Logs</h3>
                <p className="text-sm text-muted-foreground">Admin → Audit tab. Shows a timestamped log of all create / update / delete operations across the platform, with the user who performed each action.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Roles ── */}
        {active === "roles" && (
          <div>
            <SectionHeading icon={User} title="Roles & Permissions" subtitle="What each role can access" />

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 font-semibold text-foreground">Role</th>
                    {["Dash", "Jobs", "Cands", "Intv", "Empl", "Fin", "Pay", "Admin", "Settings"].map(h => (
                      <th key={h} className="text-center py-2 px-1 font-semibold text-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roleTable.map(row => (
                    <tr key={row.role} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 pr-3 font-medium text-foreground">{row.role}</td>
                      {[row.dashboard, row.jobs, row.candidates, row.interviews, row.employees, row.finance, row.payroll, row.admin, row.settings].map((v, i) => (
                        <td key={i} className="text-center py-2 px-1 text-muted-foreground">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Admin</span> — Full access including user management, communications config, and audit logs.</p>
              <p><span className="font-medium text-foreground">HR Manager</span> — Employee lifecycle + payroll. No recruiting or financial access.</p>
              <p><span className="font-medium text-foreground">Recruiter</span> — Full recruiting pipeline: jobs, candidates, interviews. No HR or finance.</p>
              <p><span className="font-medium text-foreground">CFO</span> — Finance and payroll oversight only.</p>
              <p><span className="font-medium text-foreground">Manager</span> — People + recruiting visibility. No finance or admin.</p>
              <p><span className="font-medium text-foreground">Viewer</span> — Dashboard only. Read-only overview for stakeholders.</p>
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        {active === "faq" && (
          <div>
            <SectionHeading icon={HelpCircle} title="FAQ" subtitle="Common questions and answers" />
            <div className="space-y-2">
              {faqs.map(f => <FAQItem key={f.question} {...f} />)}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
