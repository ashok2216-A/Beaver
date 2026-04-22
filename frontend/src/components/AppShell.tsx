import { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import { Grid2X2, Cpu, FileCode2, Settings2, Plus, Search, Bell } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Grid2X2 },
  { to: "/agents", label: "Agents", icon: Cpu },
  { to: "/logs", label: "Logs", icon: FileCode2 },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const AppShell = ({ children, title, subtitle, actions }: AppShellProps) => {
  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar shadow-[4px_0_24px_rgba(0,0,0,0.02),1px_0_0_rgba(0,0,0,0.05)] z-50">
        <div className="h-16 flex items-center px-6">
          <Logo />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-base",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    isActive ? "bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--primary),0.1)]" : "bg-secondary/40 text-muted-foreground group-hover:bg-secondary group-hover:text-foreground"
                  )}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3">
          <div className="rounded-xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
            <p className="text-sm font-semibold">Upgrade to Pro</p>
            <p className="mt-1 text-xs text-primary-foreground/80">Unlimited agents & priority support.</p>
            <Button size="sm" variant="secondary" className="mt-3 w-full">Upgrade</Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-background/80 backdrop-blur sticky top-0 z-40 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
          <div className="h-full flex items-center justify-between gap-4 px-6">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search agents, logs..."
                  className="h-9 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm outline-none focus:bg-background focus:border-primary/40 transition-base"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/agents/new"><Plus className="h-4 w-4" /> Create Agent</Link>
              </Button>
              <div className="ml-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </header>

        {(title || actions) && (
          <div className="px-6 py-6 bg-gradient-card shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              {actions}
            </div>
          </div>
        )}

        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
};
