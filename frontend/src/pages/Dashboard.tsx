import { Link } from "react-router-dom";
import {
  Bot,
  MessageSquare,
  Zap,
  TrendingUp,
  MoreHorizontal,
  ArrowUpRight,
  Trash2,
  Loader2,
  ExternalLink,
  BarChart3,
  Rocket
} from "lucide-react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading: loadingAgents, isError, error } = useQuery({
    queryKey: ["agents"],
    queryFn: () => api.get<any[]>("/agents"),
  });

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.get<any>("/agents/stats"),
  });

  const recentAgents = [...agents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const { mutate: deleteAgent, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => api.delete(`/agents/${id}`),
    onSuccess: () => {
      toast.success("Agent deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete agent");
    },
  });

  const stats = [
    { label: "Active agents", value: agents.length.toString(), change: statsData?.agent_trend || "+0 this week", icon: Bot },
    { label: "Messages total", value: statsData?.message_count?.toString() || "0", change: statsData?.message_trend || "+0%", icon: MessageSquare },
    { label: "API calls", value: statsData?.message_count?.toString() || "0", change: statsData?.message_trend || "+0%", icon: Zap },
    { label: "Avg. response", value: `${statsData?.avg_latency_ms || 0}ms`, change: statsData?.latency_trend || "-0ms", icon: TrendingUp },
  ];

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      deleteAgent(id);
    }
  };

  return (
    <AppShell
      title={`Welcome back, ${user?.firstName || "User"} 👋`}
      subtitle="Here's what's happening across your agents today."
      actions={
        <Button asChild variant="hero">
          <Link to="/agents/new">Create Agent</Link>
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="group rounded-3xl bg-card p-6 shadow-soft transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <s.icon className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-success bg-success/10 px-2 py-1 rounded-lg">{s.change}</span>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-bold tracking-tight">{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Agents grid */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Recent Agents</h2>
            <p className="text-sm text-muted-foreground/60 font-medium mt-1">The latest bots joined to your workspace.</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="rounded-xl font-bold hover:bg-primary/5 text-primary">
            <Link to="/agents" className="flex items-center gap-2">View all agents <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loadingAgents ? (
            <div className="col-span-full py-24 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary/40" />
              <p className="mt-4 text-sm text-muted-foreground font-medium">Loading your ecosystem...</p>
            </div>
          ) : isError ? (
            <div className="col-span-full py-12 text-center rounded-3xl border border-destructive/20 bg-destructive/5 text-destructive font-bold">
              Failed to load agent data
            </div>
          ) : recentAgents.length === 0 ? (
            <div className="col-span-full py-20 text-center rounded-[2.5rem] border-2 border-dashed border-border/50 bg-secondary/5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <Bot className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-lg font-bold text-foreground">No agents found</p>
              <p className="text-sm text-muted-foreground mt-1 mb-8">Start by creating your first intelligent agent.</p>
              <Button asChild variant="hero" size="lg" className="rounded-2xl px-8 shadow-glow">
                <Link to="/agents/new">Create Agent</Link>
              </Button>
            </div>
          ) : (
            recentAgents.map((a) => (
              <div
                key={a.id}
                className="group relative rounded-[2rem] bg-card p-6 shadow-soft transition-all duration-500 hover:shadow-elevated hover:-translate-y-1 hover:ring-1 hover:ring-primary/20"
              >
                <div className="flex items-start justify-between">
                  <AgentAvatar id={a.id} size="lg" className="rounded-2xl" />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-elevated border-white/5">
                      <DropdownMenuLabel className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary py-2.5">
                        <Link to={`/agents/builder?id=${a.id}`} className="cursor-pointer font-semibold">
                          <ExternalLink className="mr-3 h-4 w-4" /> Open Builder
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary py-2.5">
                        <Link to={`/deploy?id=${a.id}`} className="cursor-pointer font-semibold">
                          <Rocket className="mr-3 h-4 w-4" /> Deployment
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">{a.name}</h3>
                  <p className="text-sm text-muted-foreground/70 mt-2 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                    {a.description || "No description provided for this agent."}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <StatusPill status={a.status} color={a.status === "live" ? "success" : "muted"} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30">
                    {new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="mt-8">
                  <Button asChild size="lg" variant="soft" className="w-full rounded-2xl font-semibold group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Link to={`/agents/builder?id=${a.id}`}>Configure Agent</Link>
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
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default Dashboard;
