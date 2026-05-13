'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Bot, User, Server, ArrowRight, ChevronDown, Plus, Trash2, Terminal, Activity } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { cn, addNotification } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { A2InputForm } from "@/components/a2ui/components"

interface MessageChunk {
  type: 'text' | 'a2ui'
  content: string | Record<string, any>
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  chunks?: MessageChunk[]
  latency_ms?: number
  status_code?: number
  matched_endpoint?: {
    path: string
    method: string
  }
  agent_name?: string
}

interface Agent {
  id: number
  name: string
  description: string
  status: string
}

export default function PlaygroundPage() {
  const { getToken } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isOrchestratorMode, setIsOrchestratorMode] = useState(true)
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AI Core Assistant. Select an active agent endpoint above, or enable Multi-Agent Orchestration to automate tool execution across your entire fleet.'
    }
  ])
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)
  const [history, setHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [sessionId, setSessionId] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchHistory = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data || [])
      }
    } catch (err) {
      console.error("Failed to load conversation history:", err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [getToken])

  useEffect(() => {
    async function fetchAgents() {
      try {
        const token = await getToken()
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setAgents(data || [])
          if (data && data.length > 0) {
            setSelectedAgent(data[0])
          }
        }
      } catch (err) {
        console.error("Failed to load playground agents:", err)
      } finally {
        setIsLoadingAgents(false)
      }
    }
    fetchAgents()
  }, [getToken])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsDropdownOpen(false)
    setIsOrchestratorMode(false)
    setMessages([
      {
        id: `welcome_${agent.id}`,
        role: 'assistant',
        content: `Switched to **${agent.name}**.`
      }
    ])
  }

  const loadConversation = async (id: string) => {
    setSessionId(id)
    setIsLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error("Failed to load conversation:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        if (sessionId === id) {
          setSessionId("")
          setMessages([
            {
              id: 'welcome_agent',
              role: 'assistant',
              content: `🧠 **Operational Context Refreshed.** Standing by for new instructions.`
            }
          ])
        }
        fetchHistory()
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err)
    }
  }

  const toggleAgentStatus = async (agent: any, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const token = await getToken()
      const newStatus = agent.status === "live" ? "paused" : "live"
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        setAgents((prev: any[]) => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a))
        if (selectedAgent?.id === agent.id) {
          setSelectedAgent((prev: any) => prev ? { ...prev, status: newStatus } : null)
        }
      }
    } catch (err) {
      console.error("Failed to toggle status:", err)
    }
  }

  const handleSend = async (overrideMessage?: string) => {
    const promptText = (overrideMessage ?? input).trim()
    if (!promptText || isLoading) return
    if (!isOrchestratorMode && !selectedAgent) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: promptText
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const token = await getToken()
      const activeSessionId = sessionId || crypto.randomUUID()
      if (!sessionId) {
        setSessionId(activeSessionId)
      }

      const endpointUrl = isOrchestratorMode 
        ? `${process.env.NEXT_PUBLIC_API_URL}/chat/orchestrate?session_id=${activeSessionId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/chat/${selectedAgent?.id}?session_id=${activeSessionId}`

      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: promptText })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const errorString = typeof errData.detail === 'object' && errData.detail !== null
          ? JSON.stringify(errData.detail)
          : String(errData.detail || "Failed to reach agent core.")
        throw new Error(errorString)
      }

      const data = await res.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: typeof data.answer === 'object' && data.answer !== null
          ? JSON.stringify(data.answer, null, 2)
          : String(data.answer || "No response text."),
        chunks: data.chunks || null,
        latency_ms: data.latency_ms,
        status_code: data.status_code,
        matched_endpoint: data.endpoint,
        agent_name: data.agent_name
      }
      setMessages(prev => [...prev, assistantMessage])
      fetchHistory()

    } catch (err: any) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: err.message || "An error occurred while processing your message."
      }
      setMessages(prev => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] flex overflow-hidden">
      
      {/* ChatGPT Style History Sidebar */}
      <div className="w-64 flex flex-col bg-white/20 backdrop-blur-xl border-r border-slate-200 p-4 shrink-0 overflow-y-auto custom-scrollbar animate-in slide-in-from-left duration-300">
        <h2 className="text-xl font-bold text-foreground mb-4 px-1">Playground</h2>
        <button
          onClick={() => {
            setSessionId("")
            setMessages([
              {
                id: 'welcome_agent',
                role: 'assistant',
                content: `🧠 **Neural Path Reset.** Ready for a fresh mission.`
              }
            ])
          }}
          className="mb-4 w-full flex items-center justify-center gap-2 text-xs py-2.5 px-3 rounded-xl bg-slate-950 text-white border border-slate-900 font-bold hover:bg-slate-900 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </button>

        <h3 className="text-[10px] font-bold text-muted-foreground/80 mb-4 flex items-center gap-2 px-2 uppercase tracking-widest">
          Chat History
        </h3>
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-[10px] text-muted-foreground/40 text-center py-10 px-2 italic">
            No active chat threads.
          </div>
        ) : (
          <div className="space-y-1">
            {history.map((convItem) => (
              <div
                key={convItem.id}
                className={cn(
                  "relative w-full rounded-xl border flex items-center group transition-all duration-200",
                  sessionId === convItem.id 
                    ? "bg-white/60 backdrop-blur-md border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)]" 
                    : "border-slate-100/50 hover:bg-white/40 hover:border-slate-200"
                )}
              >
                <button
                  onClick={() => loadConversation(convItem.id)}
                  className="flex-1 text-left p-2.5 text-xs flex flex-col gap-1 text-muted-foreground hover:text-foreground"
                >
                  <span className={cn("truncate transition-all w-[140px]", sessionId === convItem.id ? "text-primary font-bold" : "")}>
                    {convItem.title || "Conversation"}
                  </span>
                  <span className="text-[9px] text-muted-foreground/40">
                    {new Date(convItem.created_at).toLocaleDateString()}
                  </span>
                </button>
                
                <button
                  onClick={(e) => deleteConversation(convItem.id, e)}
                  className="p-2 mr-1 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0"
                  title="Delete thread"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center relative overflow-hidden">
      
      {/* Top Floating Dropdown Menu */}
      <div className="z-20 sticky top-0 mt-2 bg-white/40 backdrop-blur-xl border border-white/50 py-2 px-4 rounded-full flex items-center gap-4 shadow-lg">
        <button
          onClick={() => {
            setIsOrchestratorMode(!isOrchestratorMode)
            if (!isOrchestratorMode) {
              setMessages([
                {
                  id: 'orchestration_mode',
                  role: 'assistant',
                  content: '✨ **Unified Orchestration Active.** I am now cross-referencing all connected agent tools to fulfill your complex instructions.'
                }
              ])
            } else {
              setMessages([
                {
                  id: 'orchestration_mode_off',
                  role: 'assistant',
                  content: '🎯 **Standard Toolkit Mode Engaged.** Responses will adapt securely to your selected agent.'
                }
              ])
            }
          }}
          className={cn("text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 border transition-all duration-300",
            isOrchestratorMode 
              ? "bg-gradient-to-r from-[#eca8d6]/30 via-[#a78bfa]/30 to-[#67e8f9]/30 border border-[#a78bfa]/40 text-slate-800 dark:text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              : "bg-muted border-transparent hover:border-white/10 text-muted-foreground"
          )}
        >
          <Sparkles className={cn("w-3.5 h-3.5", isOrchestratorMode ? "text-slate-800 dark:text-white animate-pulse" : "text-muted-foreground")} />
          <span>
            Master Agent
          </span>
        </button>

        {!isOrchestratorMode && (
          <>
            <div className="w-[1px] h-4 bg-white/10" />
            {isLoadingAgents ? (
              <span className="text-xs text-muted-foreground flex items-center gap-2 px-3 py-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              </span>
            ) : agents.length === 0 ? (
              <span className="text-xs text-muted-foreground px-3 py-1 flex items-center gap-1.5 text-amber-500 font-medium">
                No active agents
              </span>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-muted/50 transition-all text-xs font-bold text-foreground"
                >
                  <Server className="w-3.5 h-3.5 text-primary" />
                  <span>{selectedAgent ? `Sub Agent: ${selectedAgent.name}` : "Select Sub Agent"}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-300", isDropdownOpen && "rotate-180")} />
                </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 rounded-2xl bg-white/60 backdrop-blur-2xl border border-white/50 p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="text-[10px] font-bold text-muted-foreground/60 px-3 py-1 mb-1 uppercase tracking-wider border-b border-white/5">
                  Select Sub Agent
                </div>
                <div className="space-y-1 mt-1">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={cn(
                        "w-full rounded-xl text-xs font-medium flex items-center justify-between transition-all hover:bg-muted/50 p-1",
                        selectedAgent?.id === agent.id ? "bg-primary/5 text-primary" : "text-muted-foreground"
                      )}
                    >
                      <button
                        onClick={() => handleAgentSelect(agent)}
                        className="flex-1 text-left px-2 py-1.5 truncate flex items-center gap-2"
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", agent.status === "live" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500")} />
                        <span className="truncate">{agent.name}</span>
                      </button>
                      
                      <button
                        onClick={(e) => toggleAgentStatus(agent, e)}
                        className={cn(
                          "px-2 py-1 rounded-md text-[9px] font-bold border transition-all duration-200 uppercase",
                          agent.status === "live"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                        )}
                        title={agent.status === "live" ? "Click to Disable" : "Click to Enable"}
                      >
                        {agent.status === "live" ? "Live" : "Paused"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </>
    )}
  </div>

      {/* Full width scroll container so scrollbar stays in the corner */}
      <div 
        ref={scrollRef} 
        className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center"
      >
        <div className="w-full max-w-3xl px-4 md:px-6 pt-10 pb-40 space-y-8">
        {messages.map((message) => {
          const isAI = message.role === 'assistant'
          return (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-5 animate-in fade-in duration-300",
                !isAI ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar Icons - 3D Badge Style */}
              <div className={cn(
                "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-t border-white/40 dark:border-white/10 transition-transform duration-300 hover:scale-105 active:scale-95",
                isAI 
                  ? "bg-gradient-to-br from-white via-slate-50 to-slate-100 text-primary shadow-black/5" 
                  : "bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-600 dark:text-slate-400 shadow-black/5 shadow-lg"
              )}>
                {isAI ? <Bot className="h-4 w-4 drop-shadow-sm" /> : <User className="h-4 w-4 drop-shadow-sm" />}
              </div>

              {/* Message Block */}
              <div className={cn("space-y-2 max-w-[85%]", !isAI ? "flex flex-col items-end" : "flex flex-col items-start")}>
                <div className={cn(
                  "rounded-2xl px-5 py-3.5 text-sm leading-relaxed w-fit max-w-full shadow-sm transition-all duration-200",
                  isAI 
                    ? "text-foreground bg-white/60 dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-bl-sm backdrop-blur-md shadow-sm" 
                    : "text-foreground bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-br-sm backdrop-blur-md shadow-sm"
                )}>
                  <div className="break-words text-sm">
                    {/* Render chunked response with A2UI forms */}
                    {isAI && message.chunks && message.chunks.length > 0 ? (
                      <div className="space-y-3">
                        {message.chunks.map((chunk, chunkIdx) => (
                          <div key={chunkIdx}>
                            {chunk.type === 'a2ui' ? (
                              <A2InputForm
                                data={chunk.content as any}
                                onSubmit={(msg) => handleSend(msg)}
                              />
                            ) : (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-foreground" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2 text-foreground" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-base font-bold mt-2.5 mb-1.5 text-foreground" {...props} />,
                                  h4: ({node, ...props}) => <h4 className="text-sm font-bold mt-2 mb-1.5 text-foreground/90" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-0.5 mb-1" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-0.5 mb-1" {...props} />,
                                  table: ({node, ...props}) => <div className="overflow-x-auto my-2 w-full"><table className="min-w-full border-collapse border border-slate-200 dark:border-white/10" {...props} /></div>,
                                  th: ({node, ...props}) => <th className="border border-slate-200 dark:border-white/10 px-3 py-1 bg-muted/30 text-left font-semibold text-xs" {...props} />,
                                  td: ({node, ...props}) => <td className="border border-slate-200 dark:border-white/10 px-3 py-1 text-xs text-slate-700 dark:text-slate-300" {...props} />,
                                  code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono border border-black/5 dark:border-white/5" {...props} />,
                                }}
                              >
                                {String(chunk.content)}
                              </ReactMarkdown>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-foreground" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2 text-foreground" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-bold mt-2.5 mb-1.5 text-foreground" {...props} />,
                          h4: ({node, ...props}) => <h4 className="text-sm font-bold mt-2 mb-1.5 text-foreground/90" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-0.5 mb-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-0.5 mb-1" {...props} />,
                          table: ({node, ...props}) => <div className="overflow-x-auto my-2 w-full"><table className="min-w-full border-collapse border border-slate-200 dark:border-white/10" {...props} /></div>,
                          th: ({node, ...props}) => <th className="border border-slate-200 dark:border-white/10 px-3 py-1 bg-muted/30 text-left font-semibold text-xs" {...props} />,
                          td: ({node, ...props}) => <td className="border border-slate-200 dark:border-white/10 px-3 py-1 text-xs text-slate-700 dark:text-slate-300" {...props} />,
                          code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono border border-black/5 dark:border-white/5" {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>

                {/* AI execution diagnostics */}
                {isAI && message.agent_name && (!isOrchestratorMode || (message.matched_endpoint && message.matched_endpoint.path)) && (
                  <div className="flex items-center gap-3 text-[10px] px-2 mt-1">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-md font-bold font-mono tracking-wide">
                      {message.agent_name}
                    </span>
                    {message.matched_endpoint && message.matched_endpoint.path && (
                      <span className="bg-primary/5 text-primary border border-primary/20 px-2.5 py-0.5 rounded-md font-bold font-mono tracking-wide flex items-center gap-1">
                        <Terminal className="w-3 h-3" />
                        {message.matched_endpoint.method} {message.matched_endpoint.path}
                      </span>
                    )}

                    {message.status_code !== undefined && (
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-md border font-bold shadow-sm",
                        message.status_code >= 200 && message.status_code < 300 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                          : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                      )}>
                        <Activity className="h-3 w-3" />
                        {message.status_code}
                      </div>
                    )}

                    {message.latency_ms !== undefined && (
                      <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                        {message.latency_ms}ms
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Dynamic Loading block */}
        {isLoading && (
          <div className="flex items-start gap-5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary animate-pulse">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl px-5 py-3.5 bg-muted/20 border border-white/5 flex items-center gap-3 animate-in fade-in duration-200">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground italic">Thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Floating ChatGPT Action Pill bar */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10 animate-in slide-in-from-bottom-4 duration-300">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="relative flex items-center p-2 pr-3 transition-all duration-300"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isOrchestratorMode ? "Message Orchestrator Engine..." : (selectedAgent ? `Message ${selectedAgent.name}...` : "Select an agent context.")}
            disabled={isLoading || (!isOrchestratorMode && !selectedAgent)}
            className="w-full h-14 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-5 text-sm outline-none placeholder-muted-foreground/50 focus:ring-4 focus:ring-primary/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading || (!isOrchestratorMode && !selectedAgent)}
            size="icon"
            className="h-10 w-10 rounded-xl shadow-glow bg-primary hover:bg-primary/90 transition-all ml-2 absolute right-5"
          >
            <ArrowRight className="h-4 w-4 text-primary-foreground" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground/40 mt-2 font-medium tracking-wide">
          API requests route dynamically over verified Open specifications.
        </p>
      </div>
    </div>
  </div>
)
}

const AlertCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
)
