import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, Eye, EyeOff, Briefcase } from "lucide-react";
import { Link } from "wouter";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setAuth } = useAuth();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const loginMutation = useLogin();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        const r = res as { access_token: string; user: Parameters<typeof setAuth>[0] };
        setAuth(r.user, r.access_token);
        setLocation("/dashboard");
      },
      onError: () => {
        toast({ title: "Login failed", description: "Invalid email or password", variant: "destructive" });
      },
    });
  };

  const loginAsDemo = () => {
    loginMutation.mutate({ data: { email: "demo@nexus.ai", password: "demo123" } }, {
      onSuccess: (res) => {
        const r = res as { access_token: string; user: Parameters<typeof setAuth>[0] };
        setAuth(r.user, r.access_token);
        setLocation("/dashboard");
      },
      onError: () => {
        toast({ title: "Demo login failed", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-sidebar p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">Nexus AI</span>
        </div>
        <div>
          <blockquote className="text-2xl font-light text-sidebar-foreground leading-relaxed mb-6">
            "The intelligence layer every modern executive team needs."
          </blockquote>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Candidates Processed", value: "12,400+" },
              { label: "Payroll Accuracy", value: "99.98%" },
              { label: "Avg. Time-to-Hire", value: "18 days" },
              { label: "Cost Savings", value: "$2.4M" },
            ].map(stat => (
              <div key={stat.label} className="bg-sidebar-accent rounded-lg p-3">
                <p className="text-lg font-bold text-sidebar-primary">{stat.value}</p>
                <p className="text-xs text-sidebar-foreground/60 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/40">&copy; 2026 Nexus AI Platform. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-7">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your Nexus AI workspace</p>
          </div>

          <button
            data-testid="button-demo-account"
            type="button"
            onClick={loginAsDemo}
            disabled={loginMutation.isPending}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left disabled:opacity-60"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Use demo account</p>
              <p className="text-xs text-muted-foreground">demo@nexus.ai / demo123</p>
            </div>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                data-testid="input-email"
                type="email"
                placeholder="you@company.com"
                {...form.register("email")}
                className={form.formState.errors.email ? "border-destructive" : ""}
              />
              {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  data-testid="input-password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  {...form.register("password")}
                  className={form.formState.errors.password ? "border-destructive pr-10" : "pr-10"}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            <Button data-testid="button-submit" type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="flex flex-col gap-2 items-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="hover:text-foreground transition-colors">Forgot your password?</Link>
            <span>Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">Create one</Link>
            </span>
            <Link href="/pricing" className="hover:text-foreground transition-colors">View pricing plans</Link>
          </div>

          <div className="border-t border-border pt-5">
            <Link href="/apply">
              <button className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-sm font-medium text-foreground">
                <Briefcase className="w-4 h-4 text-primary" />
                Looking for a job? Browse open positions &amp; apply
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
