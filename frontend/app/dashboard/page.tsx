"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Bot, Zap, Clock, ArrowUpRight, Search, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useAuth, useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { toast } from "sonner"
import { ResponsiveContainer, AreaChart, Area } from "recharts"

interface DashboardStats {
  agent_count: number
  message_count: number
  avg_latency_ms: number
  agent_trend: string
  message_trend: string
  latency_trend: string
}

interface VelocityItem {
  date: string
  requests: number
}

interface Agent {
  id: number
  name: string
  description: string
  status: string
  base_url: string
  is_authorized: boolean
  created_at: string
}

export default function DashboardPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [allAgents, setAllAgents] = useState<Agent[]>([])
  const [velocityData, setVelocityData] = useState<VelocityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setLoading(false)
      return
    }

    async function fetchData() {
      const start = Date.now()
      console.warn(`[TIMER] Starting fetchData sequence...`)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        console.error("NEXT_PUBLIC_API_URL is not defined in environment variables")
        setLoading(false)
        return
      }

      try {
        console.warn(`[TIMER] Calling getToken()...`)
        const token = await getToken()
        if (!token) {
          console.debug("Failed to get auth token")
          setLoading(false)
          return
        }

        const headers = { Authorization: `Bearer ${token}` }
        
        console.warn(`[TIMER] Fetching dashboard data... (auth took ${Date.now() - start}ms)`)
        
        const fetchStart = Date.now()
        // Fetch all data concurrently
        const [statsRes, agentsRes, velocityRes] = await Promise.all([
          fetch(`${apiUrl}/agents/stats`, { headers }).then(res => { console.warn(`[TIMER] /stats finished in ${Date.now() - fetchStart}ms`); return res; }),
          fetch(`${apiUrl}/agents`, { headers }).then(res => { console.warn(`[TIMER] /agents finished in ${Date.now() - fetchStart}ms`); return res; }),
          fetch(`${apiUrl}/agents/stats/velocity`, { headers }).then(res => { console.warn(`[TIMER] /velocity finished in ${Date.now() - fetchStart}ms`); return res; })
        ])
        console.warn(`[TIMER] All API calls finished in ${Date.now() - fetchStart}ms total`)

        if (statsRes.ok) {
          setStats(await statsRes.json())
        } else {
          console.error(`Stats fetch failed with status: ${statsRes.status}`)
        }

        if (agentsRes.ok) {
          const agentsData = await agentsRes.json()
          setAgents(agentsData || [])
          setAllAgents(agentsData || [])
        }

        if (velocityRes.ok) {
          const data = await velocityRes.json()
          setVelocityData(data?.items || [])
        }

      } catch (error) {
        console.error("Dashboard fetch error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [getToken, isLoaded, isSignedIn])
  
  const handleRemoveRecentAgent = (agentId: number) => {
    setAgents(prev => prev.filter(a => a.id !== agentId))
  }

  const getAgentTrendData = () => {
    if (allAgents.length === 0) return Array(7).fill({ v: 0 });
    const now = new Date();
    const dates = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - idx));
      d.setHours(23, 59, 59, 999);
      return d;
    });
    return dates.map(date => {
      const count = allAgents.filter(a => new Date(a.created_at) <= date).length;
      return { v: count };
    });
  };

  const getMessageTrendData = () => {
    if (velocityData.length === 0) return Array(7).fill({ v: 0 });
    const last7 = velocityData.slice(-7);
    if ((stats?.message_count ?? 0) === 0) return Array(7).fill({ v: 0 });
    
    let cumulative = (stats?.message_count ?? 0) - last7.reduce((sum, d) => sum + d.requests, 0);
    return last7.map(d => {
      cumulative += d.requests;
      return { v: Math.max(0, cumulative) };
    });
  };

  const getApiCallTrendData = () => {
    if (velocityData.length === 0) return Array(7).fill({ v: 0 });
    return velocityData.slice(-7).map(d => ({ v: d.requests }));
  };

  const getLatencyTrendData = () => {
    const avg = stats?.avg_latency_ms ?? 0;
    if (avg === 0) return Array(7).fill({ v: 0 });
    return [
      { v: Math.round(avg * 0.95) },
      { v: Math.round(avg * 1.02) },
      { v: Math.round(avg * 0.98) },
      { v: Math.round(avg * 1.05) },
      { v: Math.round(avg * 0.97) },
      { v: Math.round(avg * 1.01) },
      { v: avg }
    ];
  };

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
      value: stats && typeof stats.avg_latency_ms === 'number' ? `${stats.avg_latency_ms}ms` : "--",
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
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''} <span className="animate-bounce-subtle">👋</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening across your agents today.
            </p>
          </div>
          <Button asChild className="rounded-xl shadow-xl bg-slate-950 text-white hover:bg-slate-900 border-none px-6 h-11">
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
          <Card key={i} className="rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-sm hover:shadow-glow-sm transition-all group">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", card.bg)}>
                  <card.icon className={cn("h-4 w-4", card.color)} />
                </div>
                <div className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[9px] font-bold tracking-tight">
                  {card.trend.toUpperCase()}
                </div>
              </div>
              
              <div className="flex items-end justify-between gap-2">
                <div>
                  <div className="text-2xl font-bold tracking-tight mb-0.5">
                    {loading ? (
                      <div className="h-7 w-12 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      card.value
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{card.label}</div>
                </div>

                {/* Mini Sparkline */}
                <div className="h-10 w-20 shrink-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={
                      i === 0 
                        ? getAgentTrendData()
                        : i === 1
                          ? getMessageTrendData()
                          : i === 2
                            ? getApiCallTrendData()
                            : getLatencyTrendData()
                    }>
                      <defs>
                        <linearGradient id={`grad-dash-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={card.color.includes('blue') ? '#3b82f6' : card.color.includes('purple') ? '#a855f7' : card.color.includes('emerald') ? '#10b981' : '#f59e0b'} stopOpacity={0.2}/>
                          <stop offset="100%" stopColor={card.color.includes('blue') ? '#3b82f6' : card.color.includes('purple') ? '#a855f7' : card.color.includes('emerald') ? '#10b981' : '#f59e0b'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="v" 
                        stroke={card.color.includes('blue') ? '#3b82f6' : card.color.includes('purple') ? '#a855f7' : card.color.includes('emerald') ? '#10b981' : '#f59e0b'} 
                        strokeWidth={1.5} 
                        fill={`url(#grad-dash-${i})`}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
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
              <Card key={agent.id} className="rounded-3xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-sm hover:shadow-glow-sm transition-all group overflow-hidden flex flex-col p-0">
                <CardContent className="pt-4 px-6 pb-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="group-hover:scale-110 transition-transform duration-300">
                      <div className="h-12 w-12 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 shadow-lg border-t border-white/40 dark:border-white/10">
                        <img 
                          src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(agent.name)}`} 
                          alt={agent.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                    <button 
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      onClick={() => handleRemoveRecentAgent(agent.id)}
                    >
                      <Plus className="h-5 w-5 rotate-45" />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 line-clamp-1">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                    {agent.description || `Auto-discovered from ${agent.base_url}`}
                  </p>
                  
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
          <Card className="rounded-3xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm overflow-hidden">
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
