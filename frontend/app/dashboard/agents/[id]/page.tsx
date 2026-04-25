'use client'

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { 
  Bot, 
  Send, 
  Settings2, 
  Search, 
  Lock, 
  Unlock, 
  ArrowLeft, 
  Rocket, 
  Loader2,
  Database,
  Shield,
  Sparkles,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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
}

interface Endpoint {
  id: number
  method: string
  path: string
  summary: string
  is_locked: boolean
}

const methodColors: Record<string, string> = {
  GET: "text-green-500 bg-green-500/10 border-green-500/20",
  POST: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  PUT: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  DELETE: "text-red-500 bg-red-500/10 border-red-500/20",
  PATCH: "text-purple-500 bg-purple-500/10 border-purple-500/20",
}

export default function AgentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { getToken } = useAuth()
  
  const [agent, setAgent] = useState<Agent | null>(null)
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const token = await getToken()
        if (!token) return

        const headers = { Authorization: `Bearer ${token}` }
        const [agentRes, endpointsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${id}`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${id}/endpoints`, { headers })
        ])

        if (agentRes.ok) setAgent(await agentRes.json())
        if (endpointsRes.ok) {
          const data = await endpointsRes.json()
          setEndpoints(data.items || [])
        }
      } catch (error) {
        console.error("Load error:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, getToken])

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
            } catch (e) { /* partial json */ }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
    } finally {
      setIsSending(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  if (!agent) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold">Agent not found</h2>
      <Button variant="link" onClick={() => router.push('/dashboard/agents')}>Back to agents</Button>
    </div>
  )

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/dashboard/agents')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {agent.name}
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                {agent.status}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground truncate max-w-md">{agent.description}</p>
          </div>
        </div>
        <Button variant="hero" className="rounded-xl shadow-glow" onClick={() => router.push(`/dashboard/agents/${id}/deploy`)}>
          <Rocket className="mr-2 h-4 w-4" />
          Deploy Agent
        </Button>
      </div>

      <div className="flex-1 min-h-0 grid lg:grid-cols-12 gap-6">
        {/* Left: Configuration & Endpoints */}
        <div className="lg:col-span-8 flex flex-col min-h-0">
          <Tabs defaultValue="endpoints" className="flex-1 flex flex-col min-h-0">
            <TabsList className="bg-card w-full justify-start p-1 rounded-xl h-12 border border-border/50">
              <TabsTrigger value="endpoints" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 h-full">
                <Database className="h-4 w-4" />
                Endpoints
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 h-full">
                <Settings2 className="h-4 w-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 h-full">
                <Shield className="h-4 w-4" />
                Auth & Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="flex-1 min-h-0 mt-4 data-[state=active]:flex flex-col">
              <Card className="flex-1 flex flex-col border-none bg-card shadow-sm overflow-hidden rounded-3xl">
                <CardHeader className="py-4 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Parsed Tools ({endpoints.length})</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Filter paths..." 
                        className="h-8 pl-8 text-xs rounded-lg bg-background/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-2">
                    {endpoints.filter(e => e.path.includes(searchQuery)).map((endpoint) => (
                      <div key={endpoint.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30 hover:bg-background/50 transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border shrink-0",
                            methodColors[endpoint.method]
                          )}>
                            {endpoint.method}
                          </span>
                          <span className="font-mono text-sm truncate">{endpoint.path}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground hidden md:block">{endpoint.summary}</p>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            {endpoint.is_locked ? <Lock className="h-4 w-4 text-destructive" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 min-h-0 mt-4 overflow-y-auto">
              <Card className="border-none bg-card shadow-sm rounded-3xl">
                <CardContent className="p-8 space-y-6">
                  <div className="grid gap-2">
                    <label className="text-sm font-bold">System Prompt</label>
                    <p className="text-xs text-muted-foreground">Defines your agent's personality, behavior, and constraints.</p>
                    <Textarea 
                      defaultValue={agent.system_prompt} 
                      className="min-h-[200px] rounded-xl bg-background/50 leading-relaxed"
                      placeholder="You are a helpful assistant..."
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <label className="text-sm font-bold">Base API URL</label>
                      <Input defaultValue={agent.base_url} className="rounded-xl bg-background/50 font-mono text-xs h-11" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-bold">LLM Engine</label>
                      <Input defaultValue={agent.model_id} disabled className="rounded-xl bg-background/50 h-11" />
                    </div>
                  </div>
                  <Button className="rounded-xl font-bold h-11 px-8">Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="flex-1 min-h-0 mt-4">
              <Card className="border-none bg-card shadow-sm rounded-3xl">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">Credential Management</h4>
                      <p className="text-xs text-muted-foreground">Secrets are encrypted at rest and never exposed in frontend responses.</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <label className="text-sm font-bold">Auth Type</label>
                      <Input defaultValue={agent.auth_type} disabled className="rounded-xl bg-background/50 h-11" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-bold">Auth Header</label>
                      <Input defaultValue={agent.auth_header} placeholder="Authorization" className="rounded-xl bg-background/50 h-11" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-bold">Auth Secret</label>
                      <Input type="password" placeholder="••••••••••••••••" className="rounded-xl bg-background/50 h-11" />
                    </div>
                  </div>
                  <Button className="rounded-xl font-bold h-11 px-8">Update Security</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Test Playground */}
        <div className="lg:col-span-4 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col border-none bg-card shadow-xl rounded-3xl overflow-hidden border-t border-primary/10">
            <CardHeader className="py-4 border-b bg-primary/[0.02]">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Live Agent Test
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-10 opacity-40">
                      <Bot className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">Awaiting interaction</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex gap-3",
                      m.role === 'user' ? "justify-end" : "justify-start"
                    )}>
                      {m.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm max-w-[85%] leading-relaxed",
                        m.role === 'user' 
                          ? "bg-primary text-primary-foreground rounded-tr-sm shadow-glow-sm" 
                          : "bg-muted text-foreground rounded-tl-sm prose prose-sm dark:prose-invert max-w-none"
                      )}>
                        {m.role === 'user' ? m.content : (
                          m.content ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                          ) : (
                            <Loader2 className="w-4 h-4 animate-spin opacity-40" />
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-background/50">
                <div className="relative flex items-center">
                  <Input 
                    placeholder="Ask your agent..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-12 h-12 rounded-xl border-border bg-background shadow-inner"
                    disabled={isSending}
                  />
                  <Button 
                    size="icon" 
                    className="absolute right-1.5 h-9 w-9 rounded-lg shadow-glow"
                    onClick={handleSendMessage}
                    disabled={isSending || !input.trim()}
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
