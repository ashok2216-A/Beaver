import { ReactNode, useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { Grid2X2, Cpu, FileCode2, Settings2, Plus, Search, Bell, ChevronLeft, ChevronRight, X } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  const [showUpgradeCard, setShowUpgradeCard] = useState(() => {
    const saved = localStorage.getItem("show-upgrade-card");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-sidebar shadow-[4px_0_24px_rgba(0,0,0,0.02),1px_0_0_rgba(0,0,0,0.05)] z-50 transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-20" : "w-64 shrink-0"
      )}>
        <div className={cn(
          "h-16 flex items-center transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "px-6"
        )}>
          <Logo compact={isCollapsed} />
        </div>
        
        <nav className="flex-1 p-3 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold transition-all duration-200 group",
                  isActive
                    ? "bg-primary/5 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  isCollapsed ? "justify-center" : ""
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                    isActive ? "bg-primary text-white shadow-glow" : "bg-secondary/40 text-muted-foreground group-hover:bg-secondary group-hover:text-foreground"
                  )}>
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {!isCollapsed && showUpgradeCard && (
          <div className="p-3">
            <div className="relative rounded-[1.5rem] bg-gradient-primary p-5 text-primary-foreground shadow-glow">
              <button 
                onClick={() => {
                  setShowUpgradeCard(false);
                  localStorage.setItem("show-upgrade-card", "false");
                }}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="text-sm font-bold">Upgrade to Pro</p>
              <p className="mt-1.5 text-[11px] text-primary-foreground/70 leading-relaxed">Unlimited agents & priority support.</p>
              <Button size="sm" variant="secondary" className="mt-4 w-full rounded-xl font-bold shadow-sm">Upgrade</Button>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 h-6 w-6 bg-white border border-border rounded-full flex items-center justify-center shadow-soft hover:scale-110 transition-transform z-[60]"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
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
