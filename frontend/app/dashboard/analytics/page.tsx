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

interface AnalyticsStats {
  agent_count: number
  message_count: number
  avg_latency_ms: number
  agent_trend: string
  message_trend: string
  latency_trend: string
}

export default function AnalyticsPage() {
  const { getToken } = useAuth()
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = await getToken()
        if (!token) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          setStats(await response.json())
        }
      } catch (error) {
        console.error("Failed to fetch analytics stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [getToken])

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
      value: "1.2 GB",
      trend: "+5%",
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
          <Card key={i} className="rounded-3xl bg-card shadow-sm border-white/5 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg)}>
                  <item.icon className={cn("w-5 h-5", item.color)} />
                </div>
                <div className={cn(
                  "flex items-center text-[10px] font-black px-2 py-0.5 rounded-full",
                  item.trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {item.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {item.trend.replace('+', '').replace('-', '')}
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">
                  {loading ? <div className="h-8 w-16 bg-muted animate-pulse rounded-lg" /> : item.value}
                </h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-[2.5rem] bg-card border-white/5 overflow-hidden shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-bold">Request Velocity</CardTitle>
            <CardDescription>Volume of AI agent tool calls over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
             <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[2rem] bg-muted/20">
               <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                 <BarChart3 className="w-8 h-8 text-primary" />
               </div>
               <h3 className="text-lg font-bold">Accumulating Data</h3>
               <p className="text-sm text-muted-foreground max-w-xs text-center mt-2 leading-relaxed">
                 We're currently gathering baseline usage patterns for your new agents. Visual charts will appear here shortly.
               </p>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] bg-card border-white/5 overflow-hidden shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-bold">Health Snapshot</CardTitle>
            <CardDescription>System status and reliability.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="space-y-4">
               {[
                 { label: "API Availability", value: "99.98%", status: "success" },
                 { label: "LLM Success Rate", value: "98.2%", status: "success" },
                 { label: "Provider Latency", value: "420ms", status: "warning" },
               ].map((metric, i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-white/5">
                   <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                   <div className="flex items-center gap-2">
                     <span className="font-bold text-sm">{metric.value}</span>
                     <div className={cn("w-1.5 h-1.5 rounded-full", metric.status === "success" ? "bg-emerald-500" : "bg-amber-500")} />
                   </div>
                 </div>
               ))}
            </div>
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
               <div className="flex items-center gap-2 text-primary">
                 <Zap className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase tracking-widest">Upgrade Insight</span>
               </div>
               <p className="text-xs text-muted-foreground leading-relaxed">
                 You are currently using <strong>42%</strong> of your free-tier compute credits. Upgrade to Pro for unlimited agents.
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
