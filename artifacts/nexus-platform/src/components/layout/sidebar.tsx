import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, Users, Calendar, Building2,
  DollarSign, CreditCard, Settings, Shield, LogOut, Zap, Menu, X, HelpCircle, Tag
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "recruiter", "hr_manager", "cfo", "manager", "viewer"] },
  { href: "/jobs", label: "Jobs", icon: Briefcase, roles: ["admin", "recruiter", "manager"] },
  { href: "/candidates", label: "Candidates", icon: Users, roles: ["admin", "recruiter", "manager"] },
  { href: "/interviews", label: "Interviews", icon: Calendar, roles: ["admin", "recruiter", "manager"] },
  { href: "/employees", label: "Employees", icon: Building2, roles: ["admin", "hr_manager", "manager"] },
  { href: "/finance", label: "Finance", icon: DollarSign, roles: ["admin", "cfo"] },
  { href: "/payroll", label: "Payroll", icon: CreditCard, roles: ["admin", "cfo", "hr_manager"] },
  { href: "/admin", label: "Admin", icon: Shield, roles: ["admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "recruiter", "hr_manager", "cfo", "manager", "viewer"] },
  { href: "/help", label: "Help & Docs", icon: HelpCircle, roles: ["admin", "recruiter", "hr_manager", "cfo", "manager", "viewer"] },
  { href: "/pricing", label: "Pricing Plans", icon: Tag, roles: ["admin", "recruiter", "hr_manager", "cfo", "manager", "viewer"] },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, clearAuth } = useAuth();
  const { toast } = useToast();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearAuth();
        window.location.href = "/login";
      },
    });
  };

  const visibleItems = navItems.filter(item =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
            <Zap className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground leading-none">Nexus AI</p>
            <p className="text-xs text-sidebar-foreground/50 mt-0.5">{user?.organization_name ?? "Platform"}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map(item => {
          const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <div
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors">
          <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-sidebar-primary">
              {user?.full_name?.charAt(0).toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.full_name}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{user?.role?.replace("_", " ")}</p>
          </div>
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="text-sidebar-foreground/40 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-sidebar-primary flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-bold text-sidebar-foreground">Nexus AI</span>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
