'use client'

import React, { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { 
  Send, 
  Sparkles, 
  User, 
  ArrowLeft, 
  Rocket, 
  Settings2, 
  Search, 
  Lock, 
  Unlock,
  Loader2,
  Database,
  Shield,
  Trash2,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"
import Link from "next/link"

interface Agent {
  id: number
  name: string
  description: string
  system_prompt: string
  base_url: string
  status: string
  auth_type: string
  auth_header: string
  auth_secret: string
  model_id: string
  custom_headers?: Record<string, string>
}

interface Endpoint {
  id: number
  method: string
  path: string
  summary: string
  is_locked: boolean
}

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DELETE: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  PUT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  PATCH: "bg-violet-500/10 text-violet-500 border-violet-500/20",
}

export default function AgentBuilderPage() {
  const { id } = useParams()
  const router = useRouter()
  const { getToken } = useAuth()
  
  const [agent, setAgent] = useState<Agent | null>(null)
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("ALL")
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [customHeaders, setCustomHeaders] = useState<[string, string][]>([])
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load Agent & Endpoints
  useEffect(() => {
    async function loadData() {
      try {
        const token = await getToken()
        if (!token) return

        const headers = { Authorization: `Bearer ${token}` }
        const [agentRes, endpointsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${id}`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${id}/endpoints?per_page=200`, { headers })
        ])

        if (agentRes.ok) {
          const agentData = await agentRes.json()
          setAgent(agentData)
          if (agentData.custom_headers) {
            setCustomHeaders(Object.entries(agentData.custom_headers))
          }
          if (messages.length === 0) {
            setMessages([{ role: 'assistant', content: `Hi! I'm ${agentData.name}. How can I help you with the API today?` }])
          }
        }
        if (endpointsRes.ok) {
          const data = await endpointsRes.json()
          setEndpoints(data.items || [])
        }
      } catch (error) {
        console.error("Load error:", error)
        toast.error("Failed to load agent data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, getToken])

  // Scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return
    const userMsg = input
    setInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsSending(true)

    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/${id}?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      })

      if (!response.ok) throw new Error("Failed to send message")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""
      
      setMessages(prev => [...prev, { role: 'assistant', content: "" }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const data = JSON.parse(line)
              if (data.type === 'token') {
                assistantContent += data.text
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1].content = assistantContent
                  return updated
                })
              }
              if (data.type === 'error') {
                toast.error(data.text)
              }
            } catch (e) { /* partial json */ }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
      toast.error("Connection failed")
    } finally {
      setIsSending(false)
    }
  }

  const handleToggleLock = async (endpointId: number) => {
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${id}/endpoints/${endpointId}/toggle-lock`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const updated = await res.json()
        setEndpoints(prev => prev.map(e => e.id === endpointId ? { ...e, is_locked: updated.is_locked } : e))
        toast.success(updated.is_locked ? "Endpoint locked" : "Endpoint unlocked")
      }
    } catch (err) {
      toast.error("Failed to toggle lock")
    }
  }

  const handleBulkLock = async (lock: boolean) => {
    const action = lock ? 'lock-all' : 'unlock-all'
    const confirmMsg = `${lock ? 'Lock' : 'Unlock'} all ${selectedMethod === 'ALL' ? '' : selectedMethod} endpoints?`
    if (!confirm(confirmMsg)) return

    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${id}/endpoints/${action}?method=${selectedMethod}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success(`Endpoints ${lock ? 'locked' : 'unlocked'}`)
        // Refresh endpoints
        const freshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${id}/endpoints?per_page=200`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (freshRes.ok) {
          const data = await freshRes.json()
          setEndpoints(data.items || [])
        }
      }
    } catch (err) {
      toast.error("Bulk action failed")
    }
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agent) return
    setIsSaving(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const updates = Object.fromEntries(formData)
    const headersObj = Object.fromEntries(customHeaders.filter(([k]) => k.trim()))

    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...updates,
          custom_headers: headersObj
        })
      })

      if (res.ok) {
        toast.success("Settings saved successfully")
        const updated = await res.json()
        setAgent(updated)
      } else {
        throw new Error("Save failed")
      }
    } catch (err) {
      toast.error("Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest opacity-40">Loading Builder...</p>
      </div>
    </div>
  )

  if (!agent) return <div className="h-screen flex items-center justify-center">Agent not found</div>

  const filteredEndpoints = endpoints.filter(e => {
    const matchesSearch = e.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.summary.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMethod = selectedMethod === 'ALL' || e.method === selectedMethod
    return matchesSearch && matchesMethod
  })

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-16 shrink-0 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 shrink-0" onClick={() => router.push('/dashboard/agents')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            {/* Beaver Logo */}
            <div className="flex items-center gap-1.5 pr-6 border-r border-border/50">
              <div className="w-10 h-10 shrink-0">
                <img src="/logo.svg" alt="Beaver Logo" className="w-full h-full object-contain dark:invert" />
              </div>
              <span className="font-bold text-2xl tracking-tight">Beaver</span>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-sm font-bold flex items-center gap-2 leading-none">
                  {agent.name}
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase border",
                    agent.status === 'live' 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                      : "bg-muted/50 text-muted-foreground border-transparent"
                  )}>
                    {agent.status}
                  </span>
                </h1>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-medium">Agent Builder · Auto-saved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl font-bold h-10 px-6"
            onClick={() => {
              setMessages([{ role: 'assistant', content: `Hi! I'm ${agent.name}. How can I help you with the API today?` }])
              toast.success("Chat playground reset")
            }}
          >
            Test
          </Button>
          <Button variant="hero" size="sm" className="rounded-xl h-10 px-6 shadow-glow" onClick={() => router.push(`/dashboard/agents/${id}/deploy`)}>
            <Rocket className="mr-2 h-4 w-4" />
            Deploy
          </Button>
        </div>
      </header>

      {/* Main 3-Panel Content */}
      <div className="flex-1 flex min-h-0 divide-x divide-border overflow-hidden">
        
        {/* Left Panel: Endpoints List */}
        <aside className="w-[300px] flex flex-col bg-card/30 shrink-0 h-full overflow-hidden">
          <div className="p-5 space-y-4 border-b border-border/50">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Endpoints</h2>
              <p className="text-xs text-muted-foreground">{endpoints.length} tools discovered</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter tools..." 
                className="h-10 pl-9 rounded-xl bg-background/50 border-border/50 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => {
                const isActive = selectedMethod === m;
                const colorsMap = {
                  ALL: isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border/50",
                  GET: isActive ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/40 shadow-sm" : "bg-background text-muted-foreground border-border/50 hover:border-emerald-500/30",
                  POST: isActive ? "bg-blue-500/20 text-blue-500 border-blue-500/40 shadow-sm" : "bg-background text-muted-foreground border-border/50 hover:border-blue-500/30",
                  PUT: isActive ? "bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-sm" : "bg-background text-muted-foreground border-border/50 hover:border-amber-500/30",
                  PATCH: isActive ? "bg-violet-500/20 text-violet-500 border-violet-500/40 shadow-sm" : "bg-background text-muted-foreground border-border/50 hover:border-violet-500/30",
                  DELETE: isActive ? "bg-rose-500/20 text-rose-500 border-rose-500/40 shadow-sm" : "bg-background text-muted-foreground border-border/50 hover:border-rose-500/30",
                };
                const currentStyles = colorsMap[m as keyof typeof colorsMap];

                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMethod(m)}
                    className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold transition-all border",
                      currentStyles
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Bulk Actions</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleBulkLock(true)}>
                  <Lock className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleBulkLock(false)}>
                  <Unlock className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="p-3 space-y-2">
              {filteredEndpoints.map(ep => (
                <div
                  key={ep.id}
                  onClick={() => {}} // Root div for styling
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all relative group cursor-pointer",
                    ep.is_locked ? "bg-muted/30 border-transparent opacity-60" : "bg-card border-border/50 hover:border-primary/40 shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0",
                      methodColors[ep.method]
                    )}>
                      {ep.method}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleLock(ep.id); }}
                      className={cn(
                        "h-6 w-6 flex items-center justify-center rounded-lg border transition-all",
                        ep.is_locked ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-background border-border text-muted-foreground hover:text-primary"
                      )}
                    >
                      {ep.is_locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] truncate text-foreground/80">{ep.path}</p>
                  {ep.summary && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{ep.summary}</p>}
                </div>
              ))}
              {filteredEndpoints.length === 0 && (
                <div className="py-20 text-center opacity-30">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No tools found</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center Panel: Chat Playground */}
        <main className="flex-1 flex flex-col bg-muted/20 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.03)_0,transparent_100%)] pointer-events-none" />
          
          <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar" ref={scrollRef}>
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex gap-4 animate-in fade-in slide-in-from-bottom-2",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  {m.role === 'user' ? (
                    <div className="w-10 h-10 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <div className="shrink-0">
                      <AgentAvatar id={Number(id)} size="md" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm border",
                    m.role === 'user' 
                      ? "bg-primary text-primary-foreground border-transparent rounded-tr-sm" 
                      : "bg-card text-foreground border-border rounded-tl-sm"
                  )}>
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                        {!m.content && <span className="text-xs text-muted-foreground animate-pulse italic">Thinking...</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isSending && messages[messages.length-1].role === 'user' && (
                <div className="flex gap-4 animate-pulse">
                  <div className="shrink-0">
                    <AgentAvatar id={Number(id)} size="md" />
                  </div>
                  <div className="bg-card border border-border rounded-3xl rounded-tl-sm px-4 py-2">
                    <span className="text-xs text-muted-foreground animate-pulse italic">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 shrink-0 border-t border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto relative">
              <div className="flex items-end gap-3 bg-background border border-border rounded-2xl p-2 shadow-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={`Ask ${agent.name} anything...`}
                  className="flex-1 min-h-[44px] max-h-40 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm py-3 px-3 resize-none"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSending || !input.trim()}
                  className="h-10 w-10 rounded-xl shadow-glow shrink-0"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-center mt-3 text-muted-foreground uppercase tracking-widest font-bold">
                ADK Runner Engine v2.0 · Press Enter to Send
              </p>
            </div>
          </div>
        </main>

        {/* Right Panel: Settings & Configuration */}
        <aside className="w-[340px] flex flex-col bg-card/30 shrink-0 h-full overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">Agent Settings</h2>
            </div>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <form id="agent-settings-form" onSubmit={handleSaveChanges} className="p-6 space-y-8 pb-10">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</label>
                  <Input name="name" defaultValue={agent.name} className="h-11 rounded-xl bg-background/50 border-border/50" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Prompt</label>
                  <Textarea 
                    name="system_prompt" 
                    defaultValue={agent.system_prompt} 
                    className="min-h-[160px] rounded-xl bg-background/50 border-border/50 text-xs leading-relaxed resize-none"
                    placeholder="Defines the agent's behavior..."
                  />
                  <p className="text-[10px] text-muted-foreground italic">Personality, rules, and constraints.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Base API URL</label>
                  <Input name="base_url" defaultValue={agent.base_url} className="h-11 rounded-xl bg-background/50 border-border/50 font-mono text-xs" />
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-border/50">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Authentication</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/70">Auth Type</label>
                    <select 
                      name="auth_type" 
                      defaultValue={agent.auth_type} 
                      className="w-full h-11 rounded-xl border border-border/50 bg-background/50 px-4 text-xs outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                    >
                      <option value="none">None</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="apikey">Custom Header (API Key)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/70">Custom Header Name</label>
                    <Input name="auth_header" defaultValue={agent.auth_header} placeholder="Authorization" className="h-11 rounded-xl bg-background/50 border-border/50 font-mono text-xs" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/70">Auth Secret / Token</label>
                    <Input type="password" name="auth_secret" defaultValue={agent.auth_secret} placeholder="sk-••••••••••••" className="h-11 rounded-xl bg-background/50 border-border/50 font-mono text-xs" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground/70">Global Headers</label>
                    <button 
                      type="button" 
                      onClick={() => setCustomHeaders([...customHeaders, ['', '']])}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      + Add Pair
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customHeaders.map(([k, v], idx) => (
                      <div key={idx} className="flex gap-2 group">
                        <Input 
                          placeholder="Key" 
                          value={k} 
                          onChange={(e) => {
                            const newHeaders = [...customHeaders];
                            newHeaders[idx][0] = e.target.value;
                            setCustomHeaders(newHeaders);
                          }}
                          className="h-8 rounded-lg bg-background/50 border-border/50 text-[10px] font-mono px-2"
                        />
                        <Input 
                          placeholder="Value" 
                          value={v}
                          onChange={(e) => {
                            const newHeaders = [...customHeaders];
                            newHeaders[idx][1] = e.target.value;
                            setCustomHeaders(newHeaders);
                          }}
                          className="h-8 rounded-lg bg-background/50 border-border/50 text-[10px] font-mono px-2"
                        />
                        <button 
                          type="button"
                          onClick={() => setCustomHeaders(customHeaders.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-border/50">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Engine</h3>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/70">Model ID</label>
                  <select 
                    name="model_id" 
                    defaultValue={agent.model_id} 
                    className="w-full h-11 rounded-xl border border-border/50 bg-background/50 px-4 text-xs outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    <option value="mistral/mistral-small-latest">mistral-small (Mistral)</option>
                    <option value="mistral/mistral-large-latest">mistral-large (Mistral)</option>
                    <option value="gemini/gemini-2.0-flash-lite">gemini-2.0-flash (Google)</option>
                    <option value="openai/gpt-4o-mini">gpt-4o-mini (OpenAI)</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          <div className="p-5 border-t border-border/50 bg-card/30">
            <Button type="submit" form="agent-settings-form" variant="hero" className="w-full h-11 rounded-xl shadow-glow font-bold" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
