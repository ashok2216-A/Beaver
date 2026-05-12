'use client'

import { useEffect, useState, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Bot, 
  Search, 
  MoreHorizontal, 
  Rocket, 
  Terminal, 
  Settings2, 
  Trash2,
  ExternalLink,
  Activity,
  AlertTriangle,
  CheckSquare,
  Square,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { cn, addNotification } from "@/lib/utils"
import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Agent {
  id: number
  name: string
  description: string
  status: string
  base_url: string
  is_authorized: boolean
  created_at: string
}

function AgentsContent() {
  const { getToken } = useAuth()
  const searchParams = useSearchParams()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [deletingAgentId, setDeletingAgentId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  useEffect(() => {
    const q = searchParams.get("query")
    if (q) setSearchQuery(q)
  }, [searchParams])

  useEffect(() => {
    async function fetchAgents() {
      try {
        const token = await getToken()
        if (!token) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          setAgents(await response.json())
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
  }, [getToken])
  
  const handleDeleteAgent = (agentId: number) => {
    setDeletingAgentId(agentId)
  }

  const toggleAgentStatus = async (agent: Agent) => {
    try {
      const token = await getToken()
      const newStatus = agent.status === "live" ? "paused" : "live"
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${agent.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a))
        toast.success(`Agent ${newStatus === "live" ? "enabled" : "disabled"} successfully`)
        addNotification(
          newStatus === "live" ? "🟢 Agent Enabled" : "🟠 Agent Paused",
          `"${agent.name}" state updated to ${newStatus} securely.`
        )
      } else {
        toast.error("Failed to update agent status")
      }
    } catch (error) {
      toast.error("Error updating agent status")
    }
  }

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setIsBulkProcessing(true)
    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/bulk-delete`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ids: selectedIds })
      })
      
      if (response.ok) {
        setAgents(prev => prev.filter(a => !selectedIds.includes(a.id)))
        toast.success(`Successfully deleted ${selectedIds.length} agents`)
        addNotification("🗑️ Bulk Removal Complete", `Cleaned up ${selectedIds.length} agents from your fleet.`)
        setSelectedIds([])
        setIsBulkDeleting(false)
      } else {
        toast.error("Failed to delete agents")
      }
    } catch (err) {
      toast.error("An error occurred during bulk deletion")
    } finally {
      setIsBulkProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agents</h1>
          <p className="text-muted-foreground">
            Manage and monitor your fleet of AI assistants.
          </p>
        </div>
        <Button className="rounded-xl font-bold shadow-glow" asChild>
          <Link href="/dashboard/agents/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            placeholder="Search agents..." 
            className="w-full bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {agents.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (selectedIds.length === filteredAgents.length) setSelectedIds([])
              else setSelectedIds(filteredAgents.map(a => a.id))
            }}
            className="text-xs font-bold text-muted-foreground hover:text-primary"
          >
            {selectedIds.length === filteredAgents.length ? "Deselect All" : "Select All"}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="rounded-3xl bg-white/40 animate-pulse h-[240px] border-none" />
          ))}
        </div>
      ) : filteredAgents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <Card 
              key={agent.id} 
              className={cn(
                "rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-sm hover:shadow-glow-sm transition-all duration-300 overflow-hidden group p-0 relative",
                selectedIds.includes(agent.id) && "shadow-glow-sm bg-primary/10 border-primary/30"
              )}
            >
              <button 
                onClick={() => toggleSelect(agent.id)}
                className={cn(
                  "absolute top-4 left-4 z-10 p-1.5 rounded-lg transition-all border",
                  selectedIds.includes(agent.id) 
                    ? "bg-primary border-primary text-white scale-110" 
                    : "bg-background/80 border-border text-muted-foreground opacity-0 group-hover:opacity-100"
                )}
              >
                {selectedIds.includes(agent.id) ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
              </button>

              <CardContent className="pt-4 px-6 pb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("group-hover:scale-110 transition-transform duration-300", selectedIds.includes(agent.id) ? "ml-8" : "ml-0")}>
                    <AgentAvatar id={agent.id} size="lg" />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl bg-white/60 backdrop-blur-2xl border-white/50 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                      <DropdownMenuLabel>Agent Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => setEditingAgent(agent)}
                      >
                        <Settings2 className="mr-2 h-4 w-4 text-primary" /> Edit Name & Desc
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/dashboard/agents/${agent.id}`}>
                          <Settings2 className="mr-2 h-4 w-4" /> Configure Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/dashboard/playground?id=${agent.id}`}>
                          <Terminal className="mr-2 h-4 w-4" /> Open Playground
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/dashboard/agents/${agent.id}/deploy`}>
                          <Rocket className="mr-2 h-4 w-4" /> Deploy Agent
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/dashboard/logs?id=${agent.id}`}>
                          <Activity className="mr-2 h-4 w-4" /> View Execution Logs
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer font-medium"
                        onClick={() => toggleAgentStatus(agent)}
                      >
                        {agent.status === "live" ? (
                          <span className="flex items-center text-amber-500">
                            <Plus className="mr-2 h-4 w-4 rotate-45" /> Disable Agent
                          </span>
                        ) : (
                          <span className="flex items-center text-emerald-500">
                            <Plus className="mr-2 h-4 w-4" /> Enable Agent
                          </span>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        onClick={() => handleDeleteAgent(agent.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Agent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-bold text-xl mb-1 truncate">{agent.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                  {agent.description || `Auto-discovered agent for ${agent.base_url}`}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      agent.status === 'live' 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-muted/50 text-muted-foreground border-transparent"
                    )}>
                      <div className={cn(
                        "w-1 h-1 rounded-full",
                        agent.status === 'live' ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
                      )} />
                      {agent.status.toUpperCase()}
                    </div>

                    <div className={cn(
                      "flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      agent.is_authorized 
                        ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" 
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {agent.is_authorized ? "AUTH OK" : "NO AUTH"}
                    </div>
                  </div>

                  <Button variant="secondary" size="sm" className="rounded-lg font-bold bg-primary/5 text-primary hover:bg-primary/10" asChild>
                    <Link href={`/dashboard/agents/${agent.id}`}>
                      Configure
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No agents found</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              {searchQuery ? `We couldn't find any agents matching "${searchQuery}"` : "You haven't created any AI agents yet. Start by building your first one."}
            </p>
            <Button className="rounded-xl px-8 h-12 text-lg font-bold shadow-glow" asChild>
              <Link href="/dashboard/agents/new">
                <Plus className="mr-2 h-5 w-5" />
                Create First Agent
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-bold">Edit Agent Profile</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const name = formData.get("name") as string
              const description = formData.get("description") as string
              
              try {
                const token = await getToken()
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${editingAgent.id}`, {
                  method: "PATCH",
                  headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                  },
                  body: JSON.stringify({ name, description })
                })
                
                if (response.ok) {
                  const updated = await response.json()
                  setAgents(prev => prev.map(a => a.id === updated.id ? updated : a))
                  toast.success("Profile updated successfully")
                  addNotification("📝 Profile Updated", `Updated metadata constraints comfortably for ${name}.`)
                  setEditingAgent(null)
                } else {
                  toast.error("Failed to save profile")
                }
              } catch {
                toast.error("An error occurred")
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</label>
                <Input name="name" defaultValue={editingAgent.name} required className="h-11 rounded-xl bg-background/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                <Textarea name="description" defaultValue={editingAgent.description} rows={3} className="rounded-xl bg-background/50 text-xs leading-relaxed resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditingAgent(null)} className="rounded-xl">Cancel</Button>
                <Button type="submit" variant="hero" className="rounded-xl font-bold px-6 shadow-glow">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingAgentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold">Delete AI Agent?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you absolutely sure? This removes the coordinator instance permanently and disrupts tools.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeletingAgentId(null)} className="rounded-xl">Cancel</Button>
              <Button variant="destructive" onClick={async () => {
                const agentId = deletingAgentId
                setDeletingAgentId(null)
                try {
                  const token = await getToken()
                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${agentId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                  })
                  
                  if (response.ok) {
                    setAgents(prev => prev.filter(a => a.id !== agentId))
                    toast.success("Agent deleted successfully")
                    addNotification("🗑️ Agent Removed", `Deleted agent successfully.`)
                  } else {
                    toast.error("Failed to delete agent")
                  }
                } catch {
                  toast.error("An error occurred")
                }
              }} className="rounded-xl font-bold px-6 shadow-glow-sm bg-rose-500 hover:bg-rose-600 text-white">
                Delete Agent
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {isBulkDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold">Mass Delete {selectedIds.length} Agents?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will permanently remove <strong>{selectedIds.length}</strong> AI agents and all associated configurations. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsBulkDeleting(false)} disabled={isBulkProcessing} className="rounded-xl">Cancel</Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkProcessing} className="rounded-xl font-bold px-6 shadow-glow-sm bg-rose-500 hover:bg-rose-600 text-white">
                {isBulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Delete ${selectedIds.length} Agents`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex items-center gap-6 px-6 py-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-primary/20 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-glow">
                {selectedIds.length}
              </div>
              <span className="text-sm font-bold">Agents selected</span>
            </div>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setIsBulkDeleting(true)}
                className="rounded-lg font-bold px-4 bg-rose-500 hover:bg-rose-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AgentsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
        <Bot className="w-12 h-12 text-primary animate-pulse" />
        <h3 className="text-base font-bold text-foreground">Setting up your dashboard</h3>
        <p className="text-xs text-muted-foreground">Preparing your intelligent assistants...</p>
      </div>
    }>
      <AgentsContent />
    </Suspense>
  )
}
