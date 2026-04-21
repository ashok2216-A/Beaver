import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Cpu, 
  Zap, 
  Sparkles, 
  Ghost, 
  Smile, 
  Terminal, 
  Code, 
  Database, 
  Pencil,
  Bot, 
  MoreHorizontal, 
  Trash2, 
  Loader2,
  ExternalLink,
  BarChart3,
  Rocket,
  Search,
  Plus
} from "lucide-react";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Agents = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingAgent, setEditingAgent] = useState<any>(null);
  
  const { data: agents = [], isLoading: loadingAgents, isError, error } = useQuery({
    queryKey: ["agents"],
    queryFn: () => api.get<any[]>("/agents"),
  });

  const { mutate: deleteAgent } = useMutation({
    mutationFn: (id: number) => api.delete(`/agents/${id}`),
    onSuccess: () => {
      toast.success("Agent deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete agent");
    },
  });

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      deleteAgent(id);
    }
  };

  const { mutate: updateAgent, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, ...updates }: { id: number; name: string; description: string }) => 
      api.patch(`/agents/${id}`, updates),
    onSuccess: () => {
      toast.success("Agent updated successfully");
      setEditingAgent(null);
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update agent");
    },
  });

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell
      title="Agents Management"
      subtitle="Create, configure, and monitor your AI fleet."
      actions={
        <Button asChild variant="hero">
          <Link to="/agents/new"><Plus className="mr-2 h-4 w-4" /> Create Agent</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search agents..." 
            className="pl-9 bg-secondary/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Agents grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loadingAgents ? (
            <div className="col-span-full py-20 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Loading agents...</p>
            </div>
          ) : isError ? (
            <div className="col-span-full py-20 text-center rounded-2xl border border-destructive/20 bg-destructive/5">
              <p className="text-destructive font-semibold">Failed to load agents</p>
              <p className="mt-1 text-sm text-muted-foreground">Error: {error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="col-span-full py-20 text-center rounded-2xl border border-dashed border-border bg-secondary/20">
              <Bot className="mx-auto h-10 w-10 text-muted-foreground opacity-20" />
              <p className="mt-4 text-sm text-muted-foreground font-medium">
                {searchQuery ? `No agents found matching "${searchQuery}"` : "No agents found in your workspace."}
              </p>
              {!searchQuery && (
                <Button asChild variant="soft" className="mt-6" size="sm">
                  <Link to="/agents/new">Create your first agent</Link>
                </Button>
              )}
            </div>
          ) : (
            filteredAgents.map((a) => (
              <div
                key={a.id}
                className="group relative rounded-2xl border border-border bg-card p-5 transition-base hover:-translate-y-0.5 hover:shadow-elevated hover:border-primary/30"
              >
                <div className="flex items-start justify-between">
                  <AgentAvatar id={a.id} name={a.name} />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground transition-base hover:bg-secondary">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setEditingAgent(a)}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit Details
                      </DropdownMenuItem>
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
                      <DropdownMenuItem asChild>
                        <Link to={`/logs?id=${a.id}`} className="cursor-pointer">
                          <BarChart3 className="mr-2 h-4 w-4" /> View Logs
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(a.id, a.name)}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Agent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="mt-4 font-semibold">{a.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate pr-8">{a.description || "No description provided."}</p>
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
                    <Link to={`/agents/builder?id=${a.id}`}>Configure</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Agent Details</DialogTitle>
            <DialogDescription>
              Update your agent's name and descriptive mission.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateAgent({
                id: editingAgent.id,
                name: formData.get("name") as string,
                description: formData.get("description") as string,
              });
            }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input id="name" name="name" defaultValue={editingAgent?.name} required placeholder="e.g. Finance Assistant" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={editingAgent?.description} 
                placeholder="What does this agent do?"
                rows={3}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setEditingAgent(null)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

// --- Sub-components ---

const Check = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

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

export default Agents;
