'use client'
import { Loader } from "@/components/ui/loader";

import { useEffect, useState, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Briefcase, Plus, Trash2, Users, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface AgentTeam {
  id: number
  name: string
  description: string
  category: string
  price: string
  modules: number
  created_at: string
  agents: any[]
}

interface Agent {
  id: number
  name: string
}

function AgentTeamsContent() {
  const { getToken } = useAuth()
  const [teams, setTeams] = useState<AgentTeam[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamDesc, setNewTeamDesc] = useState("")

  const [newTeamPrice, setNewTeamPrice] = useState("$0.00")
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      // Fetch teams
      const resTeams = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agent-teams`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (resTeams.ok) {
        setTeams(await resTeams.json())
      }

      // Fetch agents for selection
      const resAgents = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (resAgents.ok) {
        setAgents(await resAgents.json())
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [getToken])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName) return toast.error("Team name is required")
    
    setIsSubmitting(true)
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agent-teams`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDesc,
          category: "AI Workforce",
          price: newTeamPrice,
          agent_ids: selectedAgentIds
        })
      })
      
      if (res.ok) {
        toast.success("Workforce created!")
        setIsCreateModalOpen(false)
        setNewTeamName("")
        setNewTeamDesc("")
        setSelectedAgentIds([])
        fetchData()
      } else {
        toast.error("Failed to create team")
      }
    } catch (err) {
      toast.error("Error creating team")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName || !editingTeamId) return toast.error("Team name is required")
    
    setIsSubmitting(true)
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agent-teams/${editingTeamId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDesc,
          category: "AI Workforce",
          price: newTeamPrice,
          agent_ids: selectedAgentIds
        })
      })
      
      if (res.ok) {
        toast.success("Workforce updated!")
        setIsEditModalOpen(false)
        setEditingTeamId(null)
        setNewTeamName("")
        setNewTeamDesc("")
        setSelectedAgentIds([])
        fetchData()
      } else {
        toast.error("Failed to update team")
      }
    } catch (err) {
      toast.error("Error updating team")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (team: AgentTeam) => {
    setEditingTeamId(team.id)
    setNewTeamName(team.name)
    setNewTeamDesc(team.description || "")
    setNewTeamPrice(team.price || "$0.00")
    setSelectedAgentIds(team.agents ? team.agents.map(a => a.id) : [])
    setIsEditModalOpen(true)
  }

  const handleDeleteTeam = async (id: number) => {
    if (!confirm("Are you sure you want to delete this team?")) return
    
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agent-teams/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        toast.success("Team deleted")
        setTeams(prev => prev.filter(t => t.id !== id))
      } else {
        toast.error("Failed to delete team")
      }
    } catch (err) {
      toast.error("Error deleting team")
    }
  }

  return (
    <div className="space-y-8 relative w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workforce</h1>
          <p className="text-muted-foreground">
            Build and manage specialized AI workforces for your business needs.
          </p>
        </div>
        <Button onClick={() => {
          setEditingTeamId(null)
          setNewTeamName("")
          setNewTeamDesc("")
          setSelectedAgentIds([])
          setIsCreateModalOpen(true)
        }} className="rounded-xl font-bold shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Create Workforce
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : teams.length === 0 ? (
        <Card className="rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No workforce found</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              You haven't built a workforce yet. Combine multiple agents to handle complex workflows.
            </p>
            <Button onClick={() => {
              setEditingTeamId(null)
              setNewTeamName("")
              setNewTeamDesc("")
              setSelectedAgentIds([])
              setIsCreateModalOpen(true)
            }} className="rounded-xl px-8 h-12 text-lg font-bold shadow-glow">
              <Plus className="mr-2 h-5 w-5" />
              Build First Workforce
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-sm hover:shadow-glow-sm transition-all duration-300 overflow-hidden relative group p-0 hover:-translate-y-1">
              <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button 
                  onClick={() => handleEditClick(team)}
                  className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all duration-200"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteTeam(team.id)}
                  className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-6 pb-4 flex-1 relative">
                  <div className="flex justify-between items-start mb-5">
                    <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" /> Workforce
                    </div>
                  </div>

                  <div className="flex justify-between relative z-10">
                    <h3 className="font-bold text-lg leading-tight w-[65%] text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {team.name}
                    </h3>
                    <div className="shrink-0 -mt-2">
                      <AgentAvatar id={team.id} size="lg" />
                    </div>
                  </div>

                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                    {team.description || "No description provided."}
                  </p>

                  <div className="absolute right-0 bottom-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl opacity-50 pointer-events-none -z-10 group-hover:bg-indigo-500/20 transition-all duration-500" />
                  <div className="absolute right-0 top-12 w-40 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-tl-3xl opacity-30 pointer-events-none -z-10 transform translate-x-4 group-hover:scale-110 transition-all duration-500" />
                </div>
                
                <div className="border-t border-slate-200/50 dark:border-slate-800/50 px-6 py-4 flex justify-between items-center bg-white/40 dark:bg-black/20 backdrop-blur-md">
                  <div className="flex -space-x-2 min-h-[32px]">
                    {team.agents && team.agents.length > 0 && team.agents.slice(0, 4).map((agent) => (
                      <div key={agent.id} className="inline-block rounded-lg ring-2 ring-white dark:ring-slate-900 bg-white dark:bg-slate-900 overflow-hidden">
                         <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(agent.name)}`} alt={agent.name} className="w-8 h-8 object-cover bg-slate-50 dark:bg-slate-800" />
                      </div>
                    ))}
                    {team.agents && team.agents.length > 4 && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        +{team.agents.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {team.modules} agents
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-xl font-bold">Build Workforce</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Team Name</label>
                <Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required className="h-11 rounded-xl" placeholder="e.g. Customer Success Squad" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                <Textarea value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} rows={2} className="rounded-xl resize-none" placeholder="What does this team do?" />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Assign Agents ({selectedAgentIds.length} selected)</label>
                <div className="max-h-[160px] overflow-y-auto border rounded-xl p-2 space-y-1 bg-background/50">
                  {agents.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">No agents available.</p>
                  ) : (
                    agents.map(agent => (
                      <div key={agent.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted transition-colors">
                        <Checkbox 
                          id={`agent-${agent.id}`} 
                          checked={selectedAgentIds.includes(agent.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedAgentIds([...selectedAgentIds, agent.id])
                            else setSelectedAgentIds(selectedAgentIds.filter(id => id !== agent.id))
                          }}
                        />
                        <label htmlFor={`agent-${agent.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                          {agent.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl font-bold px-6 shadow-glow">
                  {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : "Build Workforce"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Team Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-xl font-bold">Edit Workforce</h3>
            <form onSubmit={handleUpdateTeam} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Team Name</label>
                <Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required className="h-11 rounded-xl" placeholder="e.g. Customer Success Squad" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                <Textarea value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} rows={2} className="rounded-xl resize-none" placeholder="What does this team do?" />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Assign Agents ({selectedAgentIds.length} selected)</label>
                <div className="max-h-[160px] overflow-y-auto border rounded-xl p-2 space-y-1 bg-background/50">
                  {agents.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">No agents available.</p>
                  ) : (
                    agents.map(agent => (
                      <div key={agent.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted transition-colors">
                        <Checkbox 
                          id={`edit-agent-${agent.id}`} 
                          checked={selectedAgentIds.includes(agent.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedAgentIds([...selectedAgentIds, agent.id])
                            else setSelectedAgentIds(selectedAgentIds.filter(id => id !== agent.id))
                          }}
                        />
                        <label htmlFor={`edit-agent-${agent.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                          {agent.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl font-bold px-6 shadow-glow">
                  {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AgentTeamsPage() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center"><Loader className="w-8 h-8 animate-spin" /></div>}>
      <AgentTeamsContent />
    </Suspense>
  )
}
