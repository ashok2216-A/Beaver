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
    { label: "Active agents", value: agents.length.toString(), change: "+0 this week", icon: Bot },
    { label: "Messages today", value: statsData?.message_count?.toString() || "0", change: "+0%", icon: MessageSquare },
    { label: "API calls", value: statsData?.message_count?.toString() || "0", change: "+0%", icon: Zap },
    { label: "Avg. response", value: `${statsData?.avg_latency_ms || 0}ms`, change: "-0ms", icon: TrendingUp },
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Recent Agents</h2>
            <p className="text-sm text-muted-foreground">The latest bots joined to your workspace.</p>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
            <Link to="/agents">View all agents <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loadingAgents ? (
            <div className="col-span-full py-20 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
            </div>
          ) : isError ? (
            <div className="col-span-full py-10 text-center rounded-2xl border border-destructive/20 bg-destructive/5">
              <p className="text-destructive font-semibold">Failed to load data</p>
            </div>
          ) : recentAgents.length === 0 ? (
            <div className="col-span-full py-16 text-center rounded-2xl border border-dashed border-border bg-secondary/20">
              <Bot className="mx-auto h-10 w-10 text-muted-foreground opacity-20" />
              <p className="mt-4 text-sm text-muted-foreground font-medium">No agents yet.</p>
              <Button asChild variant="soft" className="mt-6" size="sm">
                <Link to="/agents/new">Create your first agent</Link>
              </Button>
            </div>
          ) : (
            recentAgents.map((a) => (
              <div
                key={a.id}
                className="group relative rounded-2xl border border-border bg-card p-5 transition-base hover:-translate-y-0.5 hover:shadow-elevated hover:border-primary/30"
              >
                <div className="flex items-start justify-between">
                  <AgentAvatar id={a.id} />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground transition-base hover:bg-secondary">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={`/agents/builder?id=${a.id}`} className="cursor-pointer">
                          <ExternalLink className="mr-2 h-4 w-4" /> Open Builder
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/deploy?id=${a.id}`} className="cursor-pointer">
                          <Rocket className="mr-2 h-4 w-4" /> Deployment
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="mt-4 font-semibold">{a.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate pr-8">{a.description || "No description."}</p>
                <div className="mt-4 flex items-center gap-3 text-xs">
                  <StatusPill status={a.status} color={a.status === "live" ? "success" : "muted"} />
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <Button asChild size="sm" variant="soft" className="w-full">
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
      {status}
    </span>
  );
};

export default Dashboard;
