'use client'

import { useEffect, useState } from "react"
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
  Activity
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { AgentAvatar } from "@/components/dashboard/agent-avatar"
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
  created_at: string
}

export default function AgentsPage() {
  const { getToken } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

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

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
            Create New Agent
          </Link>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input 
          placeholder="Search agents..." 
          className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="rounded-3xl bg-card animate-pulse h-[240px]" />
          ))}
        </div>
      ) : filteredAgents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="rounded-3xl bg-card shadow-sm hover:shadow-glow-sm transition-all duration-300 overflow-hidden group p-0">
              <CardContent className="pt-4 px-6 pb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    <AgentAvatar id={agent.id} size="lg" />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                      <DropdownMenuLabel>Agent Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
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
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border",
                    agent.status === 'live' 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                      : "bg-muted/50 text-muted-foreground border-transparent"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      agent.status === 'live' ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
                    )} />
                    {agent.status.toUpperCase()}
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
        <Card className="rounded-3xl bg-card shadow-sm overflow-hidden">
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
    </div>
  )
}
