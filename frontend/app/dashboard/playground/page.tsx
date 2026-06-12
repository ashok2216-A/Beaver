'use client'
import { Loader } from "@/components/ui/loader";

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Bot, User, Server, ArrowRight, ChevronDown, Plus, Trash2, Terminal, Activity, Edit, Search, Paperclip, Mic, AtSign, ArrowUp } from "lucide-react"
import { useAuth, useUser } from "@clerk/nextjs"
import { cn, addNotification } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { A2InputForm, A2AudioPlayer, A2VideoPlayer, A2HumanApproval, A2FlightsList, A2Map, A2WeatherCard } from "@/components/a2ui/components"

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
  const { user } = useUser()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isOrchestratorMode, setIsOrchestratorMode] = useState(true)
  
  const [messages, setMessages] = useState<Message[]>([])
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)
  const [history, setHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [sessionId, setSessionId] = useState<string>("")
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free')
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agent-teams`, {
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
    const updateTier = () => {
      const cachedTier = localStorage.getItem("beaver_user_tier")
      if (cachedTier === 'pro') {
        setUserTier('pro')
      } else {
        setUserTier('free')
      }
    }
    updateTier()
    window.addEventListener("storage", updateTier)
    // Fallback polling in case it doesn't trigger across components correctly
    const interval = setInterval(updateTier, 2000)
    return () => {
      window.removeEventListener("storage", updateTier)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsDropdownOpen(false)
    setIsOrchestratorMode(false)
    setMessages([])
  }

  const loadConversation = async (id: string) => {
    setSessionId(id)
    setIsLoadingConversation(true)
    setMessages([]) // Clear messages while loading
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
      setIsLoadingConversation(false)
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

    if (!promptText.startsWith('[System:')) {
      setMessages(prev => [...prev, userMessage])
    }
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
        : `${process.env.NEXT_PUBLIC_API_URL}/chat/orchestrate?session_id=${activeSessionId}&team_id=${selectedAgent?.id}`

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

  const handleNewChat = async () => {
    setSessionId("")
    setMessages([])
    try {
      const token = await getToken()
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/clear_memory`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (e) { console.error(e) }
  }

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 flex overflow-hidden bg-transparent">
      
      {/* V0 Style History Sidebar */}
      <div className="w-64 flex flex-col bg-transparent border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 animate-in slide-in-from-left duration-300">
        
        <div className="mb-6 px-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Chat</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            Interact with your AI agents.
          </p>
        </div>
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-between text-[13px] py-2 px-2 rounded-lg text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors mb-2"
        >
          <div className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            <span>New chat</span>
          </div>
        </button>

        <div className="relative mb-6 mt-1">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            placeholder="Search" 
            className="w-full h-8 pl-8 pr-12 bg-transparent border-none text-[13px] outline-none placeholder:text-muted-foreground"
            disabled
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-800 rounded text-muted-foreground font-sans">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-800 rounded text-muted-foreground font-sans">K</kbd>
          </div>
        </div>

        <h3 className="text-[11px] font-medium text-muted-foreground mb-2 px-2">
          Chats
        </h3>
        
        {/* Scrollable container for threads */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader className="w-4 h-4 animate-spin text-primary/60" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-[10px] text-muted-foreground/40 text-center py-10 px-2 italic">
              No active chat threads.
            </div>
          ) : (
            <div className="space-y-0.5">
              {history.map((convItem) => (
                <div
                  key={convItem.id}
                  className={cn(
                    "relative w-full rounded-md flex items-center group transition-all duration-200 cursor-pointer",
                    sessionId === convItem.id 
                      ? "bg-slate-200/60 dark:bg-slate-800/60" 
                      : "hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
                  )}
                >
                  <button
                    onClick={() => loadConversation(convItem.id)}
                    className="flex-1 min-w-0 text-left p-2 pl-3 text-[13px] flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate flex-1">
                      {convItem.title || "Conversation"}
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
      </div>

      <div className="flex-1 flex flex-col items-center relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px]">
      
      <div 
        ref={scrollRef} 
        className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center relative"
      >
        {messages.length === 0 && !isLoadingConversation && (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl px-4 animate-in fade-in duration-500 pb-[35vh] mt-4">
            
            {/* Enhanced Multi-color Glow Matching Landing Page */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none opacity-60 dark:opacity-40 flex items-center justify-center">
              <div className="absolute w-[300px] h-[300px] bg-[#eca8d6]/30 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse -translate-x-32" />
              <div className="absolute w-[300px] h-[300px] bg-[#a78bfa]/30 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse" />
              <div className="absolute w-[300px] h-[300px] bg-[#67e8f9]/30 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse translate-x-32" />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full">
              {userTier === 'free' && (
                <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-6 mt-6 shadow-sm border border-purple-200 dark:border-purple-800">
                  Free plan • Upgrade
                </div>
              )}

              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 dark:from-[#eca8d6] dark:via-[#a78bfa] dark:to-[#67e8f9] bg-clip-text text-transparent mb-10 text-center tracking-tight">
                Good afternoon, {user?.firstName || "Ashok"}
              </h1>

            </div>
          </div>
        )}

        <div className={cn("w-full max-w-3xl px-4 md:px-6 pb-40 space-y-8", messages.length > 0 ? "pt-10" : "pt-0")}>
        {isLoadingConversation ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading...</p>
          </div>
        ) : (
          messages.filter(m => !m.content.startsWith('[System:')).map((message) => {
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
                  ? "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-primary shadow-black/5 overflow-hidden" 
                  : "bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-600 dark:text-slate-400 shadow-black/5 shadow-lg"
              )}>
                {isAI ? (
                  <Bot className="h-5 w-5 drop-shadow-sm" />
                ) : <User className="h-4 w-4 drop-shadow-sm" />}
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
                              (() => {
                                const a2data = chunk.content as any;
                                const comp = a2data?.a2ui?.component?.toLowerCase?.();
                                if (comp === 'flights' || comp === 'flight_list') {
                                  return (
                                    <A2FlightsList data={a2data} />
                                  );
                                }
                                if (comp === 'weather' || comp === 'weather_card') {
                                  return (
                                    <A2WeatherCard data={a2data} />
                                  );
                                }
                                if (comp === 'map' || comp === 'google_maps') {
                                  return (
                                    <A2Map data={a2data} />
                                  );
                                }
                                if (comp === 'audioplayer' || comp === 'audio') {
                                  return (
                                    <A2AudioPlayer
                                      label={a2data.a2ui.label}
                                      src={a2data.a2ui.src}
                                      data={a2data.a2ui.data}
                                      title={a2data.a2ui.title}
                                    />
                                  );
                                }
                                if (comp === 'videoplayer' || comp === 'video' || comp === 'youtube') {
                                  return (
                                    <A2VideoPlayer
                                      label={a2data.a2ui.label}
                                      src={a2data.a2ui.src}
                                      title={a2data.a2ui.title}
                                    />
                                  );
                                }
                                if (comp === 'human_approval') {
                                  return (
                                    <A2HumanApproval
                                      data={a2data}
                                      onApprove={async (actionId) => {
                                        try {
                                          const token = await getToken();
                                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/actions/${actionId}/approve`, {
                                            method: 'POST',
                                            headers: { Authorization: `Bearer ${token}` }
                                          });
                                          const data = await res.json();
                                          if (data && data.status === 'approved') {
                                            let resultStr = JSON.stringify(data.data);
                                            if (resultStr.length > 2000) {
                                              resultStr = resultStr.substring(0, 2000) + '... [TRUNCATED]';
                                            }
                                            handleSend(`[System: Action executed successfully. Result: ${resultStr}]`);
                                          } else {
                                            let errorStr = data.error || JSON.stringify(data);
                                            if (errorStr.length > 2000) {
                                              errorStr = errorStr.substring(0, 2000) + '... [TRUNCATED]';
                                            }
                                            handleSend(`[System: Action execution failed. Error: ${errorStr}]`);
                                          }
                                        } catch(e) { console.error(e) }
                                      }}
                                      onReject={async (actionId) => {
                                        try {
                                          const token = await getToken();
                                          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/actions/${actionId}/reject`, {
                                            method: 'POST',
                                            headers: { Authorization: `Bearer ${token}` }
                                          });
                                          handleSend(`[System: Action was rejected by the user.]`);
                                        } catch(e) { console.error(e) }
                                      }}
                                    />
                                  );
                                }
                                return (
                                  <A2InputForm
                                    data={a2data}
                                    onSubmit={(msg) => handleSend(msg)}
                                  />
                                );
                              })()
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
                                  code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono border border-black/5 dark:border-white/5 whitespace-pre-wrap break-words" {...props} />,
                                  pre: ({node, ...props}) => <pre className="whitespace-pre-wrap break-words overflow-x-auto my-2" {...props} />,
                                  a: ({node, ...props}) => <a className="text-primary hover:underline cursor-pointer font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
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
                          code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono border border-black/5 dark:border-white/5 whitespace-pre-wrap break-words" {...props} />,
                          pre: ({node, ...props}) => <pre className="whitespace-pre-wrap break-words overflow-x-auto my-2" {...props} />,
                          a: ({node, ...props}) => <a className="text-primary hover:underline cursor-pointer font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
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
          })
        )}

        {/* Dynamic Loading block */}
        {isLoading && (
          <div className="flex items-start gap-5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 shadow-lg border-t border-white/40 dark:border-white/10 flex items-center justify-center shrink-0 text-primary animate-pulse overflow-hidden">
              <Bot className="h-5 w-5 drop-shadow-sm opacity-70" />
            </div>
            <div className="rounded-2xl px-5 py-3.5 bg-muted/20 border border-white/5 flex items-center gap-3 animate-in fade-in duration-200">
              <Loader className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground italic">Thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* V0 Style Input Bar */}
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 w-full max-w-[800px] px-4 z-20 transition-all duration-500",
        messages.length === 0 && !isLoadingConversation
          ? "top-[55%] -translate-y-1/2"
          : "bottom-4"
      )}>
        
        {/* Render Dropdown Toggles above the input box in a sleek way */}
        <div className="flex items-center justify-center gap-2 mb-3">
           <button
             onClick={() => {
               setIsOrchestratorMode(!isOrchestratorMode)
               setMessages([])
             }}
             className={cn("text-[11px] px-3 py-1 rounded-full font-medium flex items-center gap-1.5 transition-all",
               isOrchestratorMode 
                 ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                 : "bg-white dark:bg-slate-800 text-muted-foreground border border-slate-200 dark:border-slate-700"
             )}
           >
             <Sparkles className="w-3 h-3" />
             Master Agent
           </button>
           
           {!isOrchestratorMode && (
             <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-[11px] font-medium text-foreground"
                >
                  <Server className="w-3 h-3 text-muted-foreground" />
                  <span>{selectedAgent ? selectedAgent.name : "Select Workforce"}</span>
                  <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform duration-300", isDropdownOpen && "rotate-180")} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-0.5 max-h-[250px] overflow-y-auto custom-scrollbar">
                      {agents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => handleAgentSelect(agent)}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
                            selectedAgent?.id === agent.id ? "bg-slate-100 dark:bg-slate-800 text-foreground" : "text-muted-foreground"
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-500" />
                          <span className="truncate">{agent.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
             </div>
           )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="relative w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300 focus-within:shadow-[0_0_40px_rgba(200,150,255,0.15)] focus-within:ring-2 focus-within:ring-purple-500/50 flex flex-col"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything, and add agents to chat with @"
            disabled={isLoading || (!isOrchestratorMode && !selectedAgent)}
            className="w-full min-h-[100px] max-h-[300px] bg-transparent resize-none px-4 pt-4 pb-12 text-[15px] outline-none placeholder:text-muted-foreground/60 custom-scrollbar"
          />

          <div className="absolute bottom-2.5 right-3 flex items-center gap-3">
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading || (!isOrchestratorMode && !selectedAgent)}
              size="icon"
              className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-all shadow-sm disabled:opacity-50"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Suggestion Cards directly below input box */}
        {messages.length === 0 && !isLoadingConversation && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full mt-4 pb-2">
            {[
              { 
                icon: <Terminal className="w-4 h-4 text-emerald-500" />, 
                title: "Debug Code", 
                desc: "Find errors in my Python script and optimize it for performance.",
                tag: "Engineering"
              },
              { 
                icon: <Search className="w-4 h-4 text-blue-500" />, 
                title: "Analyze Data", 
                desc: "Summarize the latest CSV upload and identify key metrics.",
                tag: "Data Science"
              },
              { 
                icon: <Sparkles className="w-4 h-4 text-purple-500" />, 
                title: "Brainstorm", 
                desc: "Generate creative ideas for our upcoming Q4 marketing campaign.",
                tag: "Marketing"
              }
            ].map((suggestion, idx) => (
              <button 
                key={idx}
                onClick={() => {
                  setInput(suggestion.desc)
                }}
                className="flex flex-col items-start gap-2 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-900 hover:-translate-y-0.5 transition-all duration-300 text-left group"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                    {suggestion.icon}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
                    {suggestion.tag}
                  </span>
                </div>
                <div className="mt-1">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{suggestion.title}</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 line-clamp-2">{suggestion.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
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
