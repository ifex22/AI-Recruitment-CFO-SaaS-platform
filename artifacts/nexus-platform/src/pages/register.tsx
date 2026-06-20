import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";

const schema = z.object({
  full_name: z.string().min(2, "Full name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters"),
  organization_name: z.string().min(2, "Organization name required"),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { setAuth } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "", organization_name: "" },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        const r = res as { access_token: string; user: Parameters<typeof setAuth>[0] };
        setAuth(r.user, r.access_token);
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast({ title: "Registration failed", description: String(err), variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-7">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground">Nexus AI</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create your workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Get started with your organization</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {[
            { id: "full_name", label: "Full Name", placeholder: "Jane Smith", type: "text" },
            { id: "organization_name", label: "Organization Name", placeholder: "Acme Corp", type: "text" },
            { id: "email", label: "Work Email", placeholder: "jane@company.com", type: "email" },
            { id: "password", label: "Password", placeholder: "••••••••", type: "password" },
          ].map(field => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input id={field.id} data-testid={`input-${field.id}`} type={field.type} placeholder={field.placeholder} {...form.register(field.id as keyof FormData)} />
              {form.formState.errors[field.id as keyof FormData] && <p className="text-xs text-destructive">{form.formState.errors[field.id as keyof FormData]?.message}</p>}
            </div>
          ))}
          <Button data-testid="button-submit" type="submit" className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Creating workspace..." : "Create workspace"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
