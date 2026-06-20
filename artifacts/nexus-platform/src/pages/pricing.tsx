import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Check, X, ArrowRight, Building2, Users, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For small teams getting started with AI-powered HR.",
    icon: Users,
    badge: null,
    highlight: false,
    cta: "Get started free",
    ctaVariant: "outline" as const,
    features: [
      { label: "Up to 5 employees", included: true },
      { label: "Up to 3 active job postings", included: true },
      { label: "Candidate pipeline", included: true },
      { label: "Basic dashboard", included: true },
      { label: "AI candidate scoring", included: false },
      { label: "Finance & CFO module", included: false },
      { label: "Payroll management", included: false },
      { label: "Custom roles & RBAC", included: false },
      { label: "Audit logs", included: false },
      { label: "Priority support", included: false },
      { label: "SSO / SAML", included: false },
      { label: "SLA guarantee", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For growing companies that need the full AI recruitment & finance stack.",
    icon: Sparkles,
    badge: "Most popular",
    highlight: true,
    cta: "Start 14-day free trial",
    ctaVariant: "default" as const,
    features: [
      { label: "Unlimited employees", included: true },
      { label: "Unlimited job postings", included: true },
      { label: "Candidate pipeline", included: true },
      { label: "Advanced dashboard & KPIs", included: true },
      { label: "AI candidate scoring", included: true },
      { label: "Finance & CFO module", included: true },
      { label: "Payroll management", included: true },
      { label: "Custom roles & RBAC", included: true },
      { label: "Audit logs", included: true },
      { label: "Email support", included: true },
      { label: "SSO / SAML", included: false },
      { label: "SLA guarantee", included: false },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For large organisations needing compliance, SSO, and dedicated support.",
    icon: Building2,
    badge: null,
    highlight: false,
    cta: "Contact sales",
    ctaVariant: "outline" as const,
    features: [
      { label: "Unlimited employees", included: true },
      { label: "Unlimited job postings", included: true },
      { label: "Candidate pipeline", included: true },
      { label: "Advanced dashboard & KPIs", included: true },
      { label: "AI candidate scoring", included: true },
      { label: "Finance & CFO module", included: true },
      { label: "Payroll management", included: true },
      { label: "Custom roles & RBAC", included: true },
      { label: "Audit logs", included: true },
      { label: "Dedicated account manager", included: true },
      { label: "SSO / SAML", included: true },
      { label: "99.9% SLA guarantee", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes — upgrade or downgrade whenever you like. Changes take effect immediately and billing is prorated.",
  },
  {
    q: "What happens when the free trial ends?",
    a: "You'll be asked to enter payment details. If you don't, the account downgrades to the Free plan automatically.",
  },
  {
    q: "Is there a per-seat pricing model?",
    a: "Pro is a flat monthly fee with no per-seat charges. Enterprise can be structured per-seat — contact sales for a custom quote.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit cards (Visa, Mastercard, Amex) and wire transfer for Enterprise annual contracts.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/login">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Nexus AI</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Transparent pricing</Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Simple plans for every stage
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.highlight
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    plan.highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground pb-1 text-sm">/{plan.period}</span>
                  </div>
                </div>

                <Link href="/register">
                  <Button variant={plan.ctaVariant} className="w-full mb-8 gap-2">
                    {plan.cta} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-center gap-3 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={f.included ? "" : "text-muted-foreground/50"}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Feature comparison callout */}
        <div className="rounded-2xl border border-border bg-card p-8 mb-20 text-center">
          <h2 className="text-2xl font-bold mb-2">Everything you need to run HR & Finance</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            All plans include core HR, recruitment pipeline, interview tracking, and real-time dashboards.
            Pro and Enterprise unlock the full AI-powered stack.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            {[
              { label: "AI Candidate Scoring", sub: "GPT-powered fit analysis" },
              { label: "Finance Module", sub: "P&L, cash flow, forecasts" },
              { label: "Payroll Engine", sub: "Full payroll run workflow" },
              { label: "Role-based Access", sub: "6 roles, granular permissions" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-sm font-semibold mb-1">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-border bg-card p-5">
                <p className="font-medium mb-1">{faq.q}</p>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA banner */}
        <div className="rounded-2xl bg-primary text-primary-foreground p-10 text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to get started?</h2>
          <p className="mb-6 opacity-80">
            Join teams already using Nexus AI to hire smarter and run finance with confidence.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/register">
              <Button variant="secondary" size="lg" className="gap-2">
                Start for free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-16 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Nexus AI Platform. All rights reserved.
      </footer>
    </div>
  );
}
