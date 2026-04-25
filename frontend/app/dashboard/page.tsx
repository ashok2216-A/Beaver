"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Bot, Zap, Clock, ArrowUpRight, Search, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

interface DashboardStats {
  agent_count: number
  message_count: number
  avg_latency_ms: number
  agent_trend: string
  message_trend: string
  latency_trend: string
}

interface Agent {
  id: number
  name: string
  description: string
  status: string
  base_url: string
  created_at: string
}

export default function DashboardPage() {
  const { getToken } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        console.error("NEXT_PUBLIC_API_URL is not defined in environment variables")
        setLoading(false)
        return
      }

      try {
        const token = await getToken()
        if (!token) {
          console.debug("Waiting for authentication token...")
          return
        }

        const headers = { Authorization: `Bearer ${token}` }
        
        // Fetch stats
        console.debug(`Fetching stats from: ${apiUrl}/agents/stats`)
        const statsRes = await fetch(`${apiUrl}/agents/stats`, { headers })
        if (statsRes.ok) {
          setStats(await statsRes.json())
        } else {
          console.error(`Stats fetch failed with status: ${statsRes.status}`)
        }

        // Fetch agents
        const agentsRes = await fetch(`${apiUrl}/agents`, { headers })
        if (agentsRes.ok) {
          setAgents(await agentsRes.json())
        }

      } catch (error) {
        console.error("Dashboard fetch error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [getToken])

  const statCards = [
    {
      label: "Active Agents",
      value: stats?.agent_count ?? "0",
      trend: stats?.agent_trend ?? "+0 this week",
      icon: Bot,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      label: "Messages Total",
      value: stats?.message_count ?? "0",
      trend: stats?.message_trend ?? "+0%",
      icon: MessageSquare,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      label: "API Calls",
      value: stats?.message_count ?? "0", 
      trend: stats?.message_trend ?? "+0%",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      label: "Avg. Response",
      value: stats?.avg_latency_ms ? `${stats.avg_latency_ms}ms` : "--",
      trend: stats?.latency_trend ?? "-0ms",
      icon: Clock,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Welcome back, Ashok <span className="animate-bounce-subtle">👋</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening across your agents today.
            </p>
          </div>
          <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
            <Link href="/dashboard/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <Card key={i} className="rounded-3xl border-none bg-card shadow-sm hover:shadow-md transition-shadow group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-8">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", card.bg)}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
                <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold tracking-tight">
                  {card.trend.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold tracking-tight mb-1">
                  {loading ? (
                    <div className="h-9 w-16 bg-muted animate-pulse rounded-lg" />
                  ) : (
                    card.value
                  )}
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{card.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Agents Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Recent Agents</h2>
            <p className="text-muted-foreground text-sm">The latest bots joined to your workspace.</p>
          </div>
          <Link href="/dashboard/agents" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            View all agents <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-card animate-pulse rounded-3xl border border-border/50" />
            ))}
          </div>
        ) : agents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.slice(0, 3).map((agent) => (
              <Card key={agent.id} className="rounded-3xl border-none bg-card shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
                <CardContent className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Plus className="h-5 w-5 rotate-45" />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 line-clamp-1">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                    {agent.description || `Auto-discovered from ${agent.base_url}`}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 text-[10px] font-bold text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                      {agent.status.toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                      {new Date(agent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </CardContent>
                
                <div className="px-6 pb-6 mt-auto">
                  <Button variant="secondary" className="w-full rounded-xl bg-primary/5 text-primary hover:bg-primary/10 font-bold" asChild>
                    <Link href={`/dashboard/agents/${agent.id}`}>
                      Configure Agent
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border-none bg-card shadow-sm overflow-hidden">
            <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px] border-2 border-dashed border-muted rounded-3xl m-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No agents yet</h2>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Create your first AI agent by uploading an OpenAPI specification or using a template.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" className="rounded-xl px-6">
                  View Templates
                </Button>
                <Button className="rounded-xl px-6" asChild>
                  <Link href="/dashboard/agents">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Agent
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

    </div>
  )
}
