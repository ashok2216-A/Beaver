'use client'
import { Loader } from "@/components/ui/loader";

import { useEffect, useState, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Briefcase, Plus, Trash2, Users } from "lucide-react"
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
  const [newTeamCategory, setNewTeamCategory] = useState("AI Workforce")
  const [newTeamPrice, setNewTeamPrice] = useState("$0.00")
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          category: newTeamCategory,
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
        <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-xl font-bold shadow-glow">
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
            <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-xl px-8 h-12 text-lg font-bold shadow-glow">
              <Plus className="mr-2 h-5 w-5" />
              Build First Workforce
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="rounded-3xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-card relative group">
              <button 
                onClick={() => handleDeleteTeam(team.id)}
                className="absolute top-4 right-4 z-20 p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-5 pb-3 flex-1 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Workforce
                    </div>
                  </div>

                  <div className="flex justify-between relative z-10">
                    <h3 className="font-bold text-base leading-tight w-[60%]">
                      {team.name}
                    </h3>
                    <div className="shrink-0 -mt-2">
                      <AgentAvatar id={team.id} size="lg" />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {team.description || "No description provided."}
                  </p>

                  <div className="absolute right-0 bottom-8 w-40 h-40 bg-gray-100 rounded-full blur-3xl opacity-50 pointer-events-none -z-10" />
                  <div className="absolute right-0 top-12 w-40 h-32 bg-gradient-to-br from-gray-100 to-transparent rounded-tl-3xl opacity-30 pointer-events-none -z-10 transform translate-x-4" />
                </div>
                
                <div className="border-t px-5 py-3 flex justify-between items-center bg-gray-50/50">
                  <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                    {team.category} <span className="opacity-50">•</span> <span>{team.modules} agents</span>
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {team.price}
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
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                <Input value={newTeamCategory} onChange={e => setNewTeamCategory(e.target.value)} className="h-11 rounded-xl" />
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
