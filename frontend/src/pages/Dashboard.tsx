import { Link } from "react-router-dom";
import { Bot, MessageSquare, Zap, TrendingUp, MoreHorizontal, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const Dashboard = () => {
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: () => api.get<any[]>("/agents"),
  });

  const stats = [
    { label: "Active agents", value: agents.length.toString(), change: "+0 this week", icon: Bot },
    { label: "Messages today", value: "0", change: "+0%", icon: MessageSquare },
    { label: "API calls", value: "0", change: "+0%", icon: Zap },
    { label: "Avg. response", value: "0ms", change: "-0ms", icon: TrendingUp },
  ];
  return (
    <AppShell
      title="Welcome back, Jamie 👋"
      subtitle="Here's what's happening across your agents today."
      actions={
        <Button asChild variant="hero">
          <Link to="/agents/new">Create Agent</Link>
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-gradient-card p-5 shadow-sm transition-base hover:shadow-soft">
            <div className="flex items-center justify-between">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <s.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-success">{s.change}</span>
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Agents grid */}
      <div className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Your agents</h2>
            <p className="text-sm text-muted-foreground">Manage and monitor every agent in your workspace.</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/agents">View all <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading agents...</p>
          ) : agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agents created yet.</p>
          ) : (
            agents.map((a) => (
              <div
                key={a.id}
                className="group rounded-2xl border border-border bg-card p-5 transition-base hover:-translate-y-0.5 hover:shadow-elevated hover:border-primary/30"
              >
                <div className="flex items-start justify-between">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                    <Bot className="h-5 w-5" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-base">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="mt-4 font-semibold">{a.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Connected to {a.base_url || "Local API"}</p>
                <div className="mt-4 flex items-center gap-3 text-xs">
                  <StatusPill status={a.status} color={a.status === "live" ? "success" : "muted"} />
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Endpoints</p>
                    <p className="text-sm font-semibold">{a.endpoint_count}</p>
                  </div>
                  <Button asChild size="sm" variant="soft">
                    <Link to={`/agents/builder?id=${a.id}`}>Open</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
};

const StatusPill = ({ status, color }: { status: string; color: string }) => {
  const colorMap: Record<string, string> = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[color]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${color === "success" ? "bg-success animate-pulse-soft" : color === "warning" ? "bg-warning" : "bg-muted-foreground"}`} />
      {status}
    </span>
  );
};

export default Dashboard;
