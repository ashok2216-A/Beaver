'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart3, 
  Zap, 
  Clock, 
  Bot, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  MousePointer2,
  Cpu
} from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"


interface AnalyticsStats {
  agent_count: number
  message_count: number
  avg_latency_ms: number
  agent_trend: string
  message_trend: string
  latency_trend: string
}

interface HealthStats {
  api_availability: string
  llm_success: string
  latency_ms: string
  upgrade_percentage: number
  plan_type?: string
}

interface VelocityItem {
  date: string
  requests: number
}

export default function AnalyticsPage() {
  const { getToken } = useAuth()
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null)
  const [velocityData, setVelocityData] = useState<VelocityItem[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    async function fetchStats() {
      try {
        const token = await getToken()
        if (!token) {
          setLoading(false)
          return
        }

        const headers = { Authorization: `Bearer ${token}` }

        await Promise.allSettled([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/stats`, { headers })
            .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`))
            .then(data => setStats(data))
            .catch(err => console.warn("Stats fetch failed:", err.message || err)),
            
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/stats/health`, { headers })
            .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`))
            .then(data => setHealthStats(data))
            .catch(err => console.warn("Health stats fetch failed:", err.message || err)),

          fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/stats/velocity`, { headers })
            .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`))
            .then(data => setVelocityData(data?.items || []))
            .catch(err => console.warn("Velocity fetch failed:", err.message || err)),

          fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`, { headers })
            .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`))
            .then(data => setAgents(data))
            .catch(err => console.warn("Agents fetch failed:", err.message || err))
        ])

      } catch (error) {
        console.error("Critical error in fetchStats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [getToken])

  const getAgentTrendData = () => {
    if (agents.length === 0) return Array(7).fill({ v: 0 });
    const now = new Date();
    const dates = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - idx));
      d.setHours(23, 59, 59, 999);
      return d;
    });
    return dates.map(date => {
      const count = agents.filter(a => new Date(a.created_at) <= date).length;
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

  const getComputeTrendData = () => {
    const usage = healthStats?.upgrade_percentage ?? 0;
    if (usage === 0) return Array(7).fill({ v: 0 });
    return [
      { v: Math.max(0, Math.round(usage * 0.9)) },
      { v: Math.max(0, Math.round(usage * 0.95)) },
      { v: Math.max(0, Math.round(usage * 0.92)) },
      { v: Math.max(0, Math.round(usage * 1.02)) },
      { v: Math.max(0, Math.round(usage * 0.97)) },
      { v: Math.max(0, Math.round(usage * 0.99)) },
      { v: usage }
    ];
  };

  const statItems = [
    {
      title: "Total Requests",
      value: stats?.message_count ?? "0",
      trend: stats?.message_trend ?? "+0%",
      icon: MousePointer2,
      description: "API calls made by agents",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Active Agents",
      value: stats?.agent_count ?? "0",
      trend: stats?.agent_trend ?? "+0 this week",
      icon: Cpu,
      description: "Total deployed assistants",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      title: "Avg. Latency",
      value: stats?.avg_latency_ms ? `${stats.avg_latency_ms}ms` : "0ms",
      trend: stats?.latency_trend ?? "-0ms",
      icon: Clock,
      description: "Average response time",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Compute Usage",
      value: `${((healthStats?.upgrade_percentage ?? 0) * 1.2 / 100).toFixed(2)} GB`,
      trend: `${healthStats?.upgrade_percentage ?? 0}%`,
      icon: Activity,
      description: "Memory footprint",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Usage Analytics</h1>
        <p className="text-muted-foreground">
          Real-time performance metrics and usage trends for your AI fleet.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item, i) => (
          <Card key={i} className="rounded-2xl bg-white/20 backdrop-blur-xl shadow-sm border border-white/40 overflow-hidden group transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bg)}>
                  <item.icon className={cn("w-4 h-4", item.color)} />
                </div>
                <div className={cn(
                  "flex items-center text-[9px] font-black px-2 py-0.5 rounded-full",
                  item.trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {item.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {item.trend.replace('+', '').replace('-', '')}
                </div>
              </div>
              
              <div className="flex items-end justify-between gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-xl font-bold tracking-tight">
                    {loading ? <div className="h-7 w-12 bg-muted animate-pulse rounded-lg" /> : item.value}
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.title}</p>
                </div>
                
                {/* Mini Sparkline */}
                <div className="h-10 w-24 shrink-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={
                      i === 0 
                        ? getMessageTrendData()
                        : i === 1 
                          ? getAgentTrendData()
                          : i === 2
                            ? getLatencyTrendData()
                            : getComputeTrendData()
                    }>
                      <defs>
                        <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={item.color.includes('blue') ? '#3b82f6' : item.color.includes('purple') ? '#a855f7' : item.color.includes('emerald') ? '#10b981' : '#f59e0b'} stopOpacity={0.2}/>
                          <stop offset="100%" stopColor={item.color.includes('blue') ? '#3b82f6' : item.color.includes('purple') ? '#a855f7' : item.color.includes('emerald') ? '#10b981' : '#f59e0b'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="v" 
                        stroke={item.color.includes('blue') ? '#3b82f6' : item.color.includes('purple') ? '#a855f7' : item.color.includes('emerald') ? '#10b981' : '#f59e0b'} 
                        strokeWidth={1.5} 
                        fill={`url(#grad-${i})`}
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/40 overflow-hidden shadow-2xl">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-lg font-bold">Request Velocity</CardTitle>
            <CardDescription className="text-xs">Volume of AI agent tool calls over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {loading ? (
              <div className="h-[250px] w-full mt-4 flex items-center justify-center bg-muted/20 rounded-xl border border-white/5">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
              </div>
            ) : velocityData.length === 0 ? (
              <div className="h-[250px] w-full mt-4 flex items-center justify-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-white/5">
                No velocity data available
              </div>
            ) : (
              <div className="h-[250px] min-h-[250px] w-full mt-4 animate-in fade-in duration-500">
                <ResponsiveContainer width="100%" height={250} minHeight={250}>
                  <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value, index) => (index % 5 === 0 ? value : "")}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`}
                      allowDecimals={false}
                      domain={[0, 'dataMax + 5']}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card/90 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-3 animate-in fade-in zoom-in-95 duration-200">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                              <p className="text-sm font-bold text-foreground">
                                requests : <span className="text-indigo-500">{payload[0].value}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="#6366f1" 
                      fillOpacity={1} 
                      fill="url(#velocityGrad)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-white/20 backdrop-blur-xl border border-white/40 overflow-hidden shadow-2xl">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-lg font-bold">Health Snapshot</CardTitle>
            <CardDescription className="text-xs">System status and reliability.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <div className="space-y-3">
                {[
                  { label: "API Availability", value: healthStats?.api_availability ?? "100%", status: "success" },
                  { label: "LLM Success", value: healthStats?.llm_success ?? "100%", status: "success" },
                  { label: "Latency", value: healthStats?.latency_ms ?? "0ms", status: "warning" },
                ].map((metric, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/20 border border-white/30 transition-colors">
                    <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{metric.value}</span>
                      <div className={cn("w-1 h-1 rounded-full", metric.status === "success" ? "bg-emerald-500" : "bg-amber-500")} />
                    </div>
                  </div>
                ))}
             </div>
              <div className={cn(
                "p-4 rounded-xl space-y-2 border",
                healthStats?.plan_type === 'pro' 
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                  : "bg-primary/5 border-primary/10"
              )}>
                <div className={cn(
                  "flex items-center gap-2",
                  healthStats?.plan_type === 'pro' ? "text-emerald-500" : "text-primary"
                )}>
                  <Zap className="w-3 h-3 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">
                    {healthStats?.plan_type === 'pro' ? 'Pro Plan Active' : 'Upgrade Insight'}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {healthStats?.plan_type === 'pro' ? (
                    <>
                      You are using the <strong className="text-emerald-600 dark:text-emerald-400">Pro Plan</strong> with unlimited agents and premium orchestration speeds.
                    </>
                  ) : (
                    <>
                      Using <strong>{healthStats?.upgrade_percentage ?? 0}%</strong> of free-tier compute credits. Upgrade to Pro for unlimited agents.
                    </>
                  )}
                </p>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
