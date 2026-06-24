import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import AppLayout from "@/components/layout/app-layout";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import ApplyPage from "@/pages/apply";
import ApplyJobPage from "@/pages/apply-job";
import ApplyInterviewPage from "@/pages/apply-interview";
import DashboardPage from "@/pages/dashboard";
import JobsPage from "@/pages/jobs";
import JobDetailPage from "@/pages/job-detail";
import CandidatesPage from "@/pages/candidates";
import CandidateDetailPage from "@/pages/candidate-detail";
import InterviewsPage from "@/pages/interviews";
import EmployeesPage from "@/pages/employees";
import EmployeeDetailPage from "@/pages/employee-detail";
import FinancePage from "@/pages/finance";
import PayrollPage from "@/pages/payroll";
import AdminPage from "@/pages/admin";
import SettingsPage from "@/pages/settings";
import HelpPage from "@/pages/help";
import PricingPage from "@/pages/pricing";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Redirect to="/login" />;
  return <AppLayout><Component /></AppLayout>;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (user) return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ApplyPage} />
      <Route path="/apply" component={ApplyPage} />
      <Route path="/apply/:id/interview" component={(props: { params: { id: string } }) => <ApplyInterviewPage {...props} />} />
      <Route path="/apply/:id" component={(props: { params: { id: string } }) => <ApplyJobPage {...props} />} />
      <Route path="/login" component={() => <PublicRoute component={LoginPage} />} />
      <Route path="/register" component={() => <PublicRoute component={RegisterPage} />} />
      <Route path="/forgot-password" component={() => <PublicRoute component={ForgotPasswordPage} />} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/jobs" component={() => <ProtectedRoute component={JobsPage} />} />
      <Route path="/jobs/:id" component={() => <ProtectedRoute component={JobDetailPage} />} />
      <Route path="/candidates" component={() => <ProtectedRoute component={CandidatesPage} />} />
      <Route path="/candidates/:id" component={() => <ProtectedRoute component={CandidateDetailPage} />} />
      <Route path="/interviews" component={() => <ProtectedRoute component={InterviewsPage} />} />
      <Route path="/employees" component={() => <ProtectedRoute component={EmployeesPage} />} />
      <Route path="/employees/:id" component={() => <ProtectedRoute component={EmployeeDetailPage} />} />
      <Route path="/finance" component={() => <ProtectedRoute component={FinancePage} />} />
      <Route path="/payroll" component={() => <ProtectedRoute component={PayrollPage} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route path="/help" component={() => <ProtectedRoute component={HelpPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
