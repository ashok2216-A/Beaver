"use client"

import React, { useState, useEffect } from "react"
import { 
  Terminal, 
  Search, 
  Filter, 
  Download, 
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Database
} from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@clerk/nextjs"
import { AgentAvatar } from "@/components/dashboard/agent-avatar"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"

interface LogEntry {
  id: number
  agent_id: number
  agent_name?: string
  user_input: string
  matched_path: string
  method: string
  status_code: number
  latency_ms: number
  api_response: string
  llm_thought: string
  error: string
  created_at: string
}

const truncate = (text: string, maxLength: number) => {
  if (!text) return ""
  const singleLine = text.replace(/\n/g, " ")
  if (singleLine.length <= maxLength) return singleLine
  return singleLine.slice(0, maxLength) + "..."
}

export default function LogsPage() {
  const { getToken } = useAuth()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const response = await fetch("/api/v1/chat/logs/all", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Error ${response.status}: ${errorData.detail || "Failed to fetch logs"}`)
      }
      const data = await response.json()
      setLogs(data.items || [])
    } catch (error: any) {
      console.error("Error fetching logs:", error)
      toast.error(error.message || "Failed to load activity logs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(log => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      (log.user_input?.toLowerCase() || "").includes(searchLower) ||
      log.matched_path.toLowerCase().includes(searchLower) ||
      (log.agent_name?.toLowerCase() || "").includes(searchLower)
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "success" && log.status_code >= 200 && log.status_code < 300) ||
      (statusFilter === "error" && log.status_code >= 400)
    
    return matchesSearch && matchesStatus
  })

  const safeFormatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return "Invalid date"
      return format(d, "MMM d, HH:mm:ss")
    } catch (e) {
      return "Invalid date"
    }
  }

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) {
      return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Success {code}</Badge>
    }
    if (code >= 400) {
      return <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">Error {code}</Badge>
    }
    return <Badge variant="outline" className="text-muted-foreground">{code || 'N/A'}</Badge>
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Terminal className="h-8 w-8 text-primary" />
            Activity Logs
          </h1>
          <p className="text-muted-foreground">
            Monitor real-time interactions and API calls across all your agents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by input, path, or agent name..."
                className="pl-9 bg-background border-border/50 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-background border-border/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Errors Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>User Input</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={7} className="h-16 bg-muted/10" />
                    </TableRow>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Database className="h-8 w-8 opacity-20" />
                        <p>No activity logs found matching your filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50 transition-colors group border-border/40">
                      <TableCell className="text-xs font-mono text-muted-foreground" suppressHydrationWarning>
                        {safeFormatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AgentAvatar id={log.agent_id} size="sm" />
                          <span className="text-sm font-semibold text-foreground truncate max-w-[150px]">
                            {log.agent_name || `Agent #${log.agent_id}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground/90 max-w-[300px]" title={log.user_input}>
                          {truncate(log.user_input, 60)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.method && (
                            <Badge variant="outline" className="text-[10px] uppercase py-0 px-1 font-bold h-4 bg-primary/10 text-primary border-primary/20">
                              {log.method}
                            </Badge>
                          )}
                          <span className="text-xs font-mono text-muted-foreground truncate max-w-[150px] flex items-center gap-1.5">
                            {!log.matched_path && <Terminal className="h-3 w-3 opacity-50" />}
                            {log.matched_path || 'Direct Reply'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status_code)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground/70">
                          <Clock className="h-3 w-3" />
                          {log.latency_ms}ms
                        </div>
                      </TableCell>
                      <TableCell>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setSelectedLog(log)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-full md:w-[40%] border-l border-border bg-background shadow-2xl overflow-y-auto p-0">
                            <div className="p-6 space-y-8">
                              <SheetHeader>
                                <SheetTitle className="flex items-center gap-2 text-2xl font-bold">
                                  <Terminal className="h-6 w-6 text-primary" />
                                  Execution Detail
                                </SheetTitle>
                                <SheetDescription>
                                  Deep dive into the request and response cycle.
                                </SheetDescription>
                              </SheetHeader>

                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/50">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Status</span>
                                    <div>{getStatusBadge(log.status_code)}</div>
                                  </div>
                                  <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/50">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Latency</span>
                                    <div className="flex items-center gap-1 font-mono text-sm font-bold text-foreground">
                                      <Clock className="h-3 w-3 text-primary" />
                                      {log.latency_ms}ms
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">User Input</span>
                                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50 text-sm leading-relaxed text-foreground/90 italic shadow-sm">
                                    "{log.user_input}"
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">API Endpoint</span>
                                  <div className="p-3 rounded-xl bg-background border border-border/60 flex items-center gap-3 shadow-sm">
                                    {log.method && (
                                      <Badge className="font-mono text-[10px] uppercase px-2 py-0.5 font-bold">{log.method}</Badge>
                                    )}
                                    <code className="text-xs font-mono text-primary font-medium flex-1 truncate flex items-center gap-2">
                                      {!log.matched_path && <Terminal className="h-3 w-3 opacity-50" />}
                                      {log.matched_path || 'Internal Coordinator'}
                                    </code>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Raw API Response</span>
                                  <pre 
                                    className="p-4 rounded-xl !bg-[#020617] border border-border/50 text-[11px] font-mono !text-[#34d399] overflow-x-auto whitespace-pre-wrap max-h-[300px] shadow-inner"
                                    style={{ backgroundColor: '#020617', color: '#34d399' }}
                                  >
                                    {(() => {
                                      if (!log.api_response) return '// No data returned';
                                      try {
                                        return JSON.stringify(JSON.parse(log.api_response), null, 2);
                                      } catch (e) {
                                        return log.api_response;
                                      }
                                    })()}
                                  </pre>
                                </div>

                                <div className="space-y-3">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1 text-primary">AI Internal Trace</span>
                                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground/80 leading-relaxed font-mono italic whitespace-pre-wrap shadow-sm">
                                    {log.llm_thought || 'No trace data available for this execution.'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
