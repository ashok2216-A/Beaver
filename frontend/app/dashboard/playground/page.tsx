'use client'
import { Loader } from "@/components/ui/loader";

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Bot, User, Server, ArrowRight, ChevronDown, Plus, Trash2, Terminal, Activity, Edit, Search, Paperclip, Mic, AtSign, ArrowUp, ExternalLink, Trello, Clock, Calculator, Presentation, Gamepad2 } from "lucide-react"
import { useAuth, useUser } from "@clerk/nextjs"
import { cn, addNotification } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { A2InputForm, A2AudioPlayer, A2VideoPlayer, A2HumanApproval, A2FlightsList, A2Map, A2WeatherCard, A2Sandbox, A2ArtifactPlaceholder, A2Image, A2DataGrid } from "@/components/a2ui/components"

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


interface A2UIResponseWrapperProps {
  a2data: any;
  comp: string;
  onOpenPreview: () => void;
  children: React.ReactNode;
}

function A2UIResponseWrapper({ a2data, comp, onOpenPreview, children }: A2UIResponseWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const title = comp === 'sandbox' || comp === 'iframe' || comp === 'preview' ? (a2data?.a2ui?.title || 'Artifact') : `${comp.replace('_', ' ')} card`;

  return (
    <div className={cn("flex flex-col gap-2 w-full", (comp === 'sandbox' || comp === 'iframe' || comp === 'preview') ? "max-w-none" : "max-w-lg")}>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground/60 px-1 select-none w-full min-w-0">
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="flex items-center gap-1.5 cursor-pointer hover:text-muted-foreground/90 dark:hover:text-muted-foreground/90 transition-colors min-w-0 flex-1"
          title={isCollapsed ? "Expand Preview" : "Collapse Preview"}
        >
          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-250 shrink-0", isCollapsed && "-rotate-90")} />
          <span className="font-semibold tracking-wider uppercase text-[10px] truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {['sandbox', 'iframe', 'preview'].includes(comp) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rawCode = a2data?.a2ui?.html || a2data?.a2ui?.code || "";
                if (rawCode) {
                  let srcDoc = rawCode;
                  if (srcDoc && !srcDoc.includes("<html") && !srcDoc.includes("<body")) {
                    srcDoc = `
                      <!DOCTYPE html>
                      <html lang="en">
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <script src="https://cdn.tailwindcss.com"></script>
                          <style>
                            body { font-family: system-ui, -apple-system, sans-serif; }
                            /* Custom styled premium scrollbar for sandboxed document viewports */
                            ::-webkit-scrollbar {
                              width: 8px;
                              height: 8px;
                            }
                            ::-webkit-scrollbar-track {
                              background: #000000;
                            }
                            ::-webkit-scrollbar-thumb {
                              background: #27272a;
                              border-radius: 9999px;
                            }
                            ::-webkit-scrollbar-thumb:hover {
                              background: #3f3f46;
                            }
                            html {
                              scroll-behavior: smooth;
                            }
                          </style>
                        </head>
                        <body class="p-6 bg-black text-white min-h-screen">
                          ${srcDoc}
                        </body>
                      </html>
                    `;
                  } else if (srcDoc && !srcDoc.includes("tailwindcss.com")) {
                    srcDoc = srcDoc.replace("</head>", `<script src="https://cdn.tailwindcss.com"></script></head>`);
                  }
                  const newTab = window.open();
                  if (newTab) {
                    newTab.document.open();
                    newTab.document.write(srcDoc);
                    newTab.document.close();
                  }
                }
              }}
              title="Open in new browser tab"
              className="text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-all flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest bg-slate-100/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200/40 dark:border-slate-800/40 shadow-sm active:scale-95 duration-200 shrink-0"
            >
              <span>New Tab</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}

          <button
            onClick={onOpenPreview}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200/30 dark:border-indigo-800/30 shadow-sm active:scale-95 duration-200 shrink-0"
          >
            <span>Preview</span>
            <ExternalLink className="w-2.5 h-2.5 text-indigo-500/80 dark:text-indigo-400/80" />
          </button>
        </div>
      </div>
      
      <div className={cn(
        "transition-all duration-300 ease-in-out origin-top overflow-hidden w-full",
        isCollapsed ? "max-h-0 opacity-0 scale-95 pointer-events-none mt-0" : "max-h-[850px] opacity-100 scale-100"
      )}>
        {children}
      </div>
    </div>
  );
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
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [sidePanelWidth, setSidePanelWidth] = useState(450)
  const [activeA2UI, setActiveA2UI] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const activeIframeRef = useRef<HTMLIFrameElement | null>(null)

  const [isMobile, setIsMobile] = useState(false)
  const [isEmbed, setIsEmbed] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    if (typeof window !== 'undefined') {
      setIsEmbed(window.location.search.includes('embed=true'))
    }

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleCopySandboxCode = () => {
    const rawCode = activeA2UI?.a2ui?.html || activeA2UI?.a2ui?.code || "";
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshSandbox = () => {
    setIframeKey(prev => prev + 1);
  };

  useEffect(() => {
    setActiveTab('preview');
    setCopied(false);
    setIframeKey(prev => prev + 1);
  }, [activeA2UI]);

  const handleOpenInNewTab = () => {
    const rawCode = activeA2UI?.a2ui?.html || activeA2UI?.a2ui?.code || "";
    if (!rawCode) return;

    let srcDoc = rawCode;
    if (srcDoc && !srcDoc.includes("<html") && !srcDoc.includes("<body")) {
      srcDoc = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; }
              /* Custom styled premium scrollbar for sandboxed document viewports */
              ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              ::-webkit-scrollbar-track {
                background: #000000;
              }
              ::-webkit-scrollbar-thumb {
                background: #27272a;
                border-radius: 9999px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: #3f3f46;
              }
              html {
                scroll-behavior: smooth;
              }
            </style>
          </head>
          <body class="p-6 bg-black text-white min-h-screen">
            ${srcDoc}
          </body>
        </html>
      `;
    } else if (srcDoc && !srcDoc.includes("tailwindcss.com")) {
      srcDoc = srcDoc.replace("</head>", `<script src="https://cdn.tailwindcss.com"></script></head>`);
    }

    const newTab = window.open();
    if (newTab) {
      newTab.document.open();
      newTab.document.write(srcDoc);
      newTab.document.close();
    }
  };

  const isResizingSidePanel = useRef(false)
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

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        const { type, action, message: msgText } = event.data;
        if (type === 'a2ui-action') {
          if (action === 'send' && msgText) {
            handleSend(msgText);
          } else if (action === 'set-input' && msgText) {
            setInput(msgText);
          }
        }
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [sessionId, selectedAgent, isOrchestratorMode, input, isLoading]);

  useEffect(() => {
    if (activeIframeRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        activeIframeRef.current.contentWindow?.postMessage({
          type: 'a2ui-agent-reply',
          message: lastMessage.content,
          chunks: lastMessage.chunks
        }, '*');
      }
    }
  }, [messages]);

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

      if (data.chunks) {
        const artifactChunk = data.chunks.find((chunk: any) => {
          if (chunk.type !== 'a2ui') return false;
          const comp = chunk.content?.a2ui?.component?.toLowerCase?.();
          return [
            'flights', 'flight_list',
            'weather', 'weather_card',
            'sandbox', 'iframe', 'preview',
            'map', 'google_maps',
            'audioplayer', 'audio',
            'videoplayer', 'video', 'youtube'
          ].includes(comp);
        });
        if (artifactChunk) {
          setActiveA2UI(artifactChunk.content);
        }
      }

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

  const startResizingSidePanel = (mouseDownEvent: React.MouseEvent) => {
    isResizingSidePanel.current = true
    document.body.style.userSelect = 'none'
    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      if (!isResizingSidePanel.current) return
      const newWidth = window.innerWidth - mouseMoveEvent.clientX
      if (newWidth >= 280 && newWidth <= 650) {
        setSidePanelWidth(newWidth)
      }
    }
    const handleMouseUp = () => {
      isResizingSidePanel.current = false
      document.body.style.userSelect = 'auto'
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
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
    <div className={cn("flex overflow-hidden bg-transparent w-full", isEmbed ? "h-screen m-0" : "h-[calc(100vh-4rem)] -m-6")}>
      
      {/* V0 Style History Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-transparent border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 animate-in slide-in-from-left duration-300">
        
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

      <div className="flex-1 flex min-h-0 overflow-hidden relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px]">
        
        {/* Left Column: Chat area */}
        <div className="flex-1 flex flex-col items-center relative overflow-hidden h-full w-full">
          <div className="flex-1 w-full flex flex-col items-center relative overflow-hidden">
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

        <div className={cn("w-full max-w-3xl px-4 md:px-6 pb-60 space-y-8", messages.length > 0 ? "pt-10" : "pt-0")}>
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
            const hasPreviewComponent = message.chunks?.some(chunk => {
              if (chunk.type !== 'a2ui') return false;
              const comp = (chunk.content as any)?.a2ui?.component?.toLowerCase?.();
              return comp === 'sandbox' || comp === 'iframe' || comp === 'preview';
            });
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
              <div className={cn("space-y-2", hasPreviewComponent ? "max-w-[95%] w-full" : "max-w-[85%]", !isAI ? "flex flex-col items-end" : "flex flex-col items-start")}>
                <div className={cn(
                  "rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all duration-200",
                  hasPreviewComponent ? "w-full" : "w-fit max-w-full",
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
                                if (comp === 'image') {
                                  return <A2Image data={a2data} />;
                                }
                                if (comp === 'flights' || comp === 'flight_list' ||
                                    comp === 'weather' || comp === 'weather_card' ||
                                    comp === 'sandbox' || comp === 'iframe' || comp === 'preview' ||
                                    comp === 'map' || comp === 'google_maps' ||
                                    comp === 'data_grid' || comp === 'datagrid' ||
                                    comp === 'audioplayer' || comp === 'audio' ||
                                    comp === 'videoplayer' || comp === 'video' || comp === 'youtube') {
                                  return (
                                    <A2UIResponseWrapper
                                      a2data={a2data}
                                      comp={comp}
                                      onOpenPreview={() => {
                                        setActiveA2UI(a2data);
                                        setIsSidePanelOpen(true);
                                      }}
                                    >
                                      {(() => {
                                        if (comp === 'flights' || comp === 'flight_list') {
                                          return <A2FlightsList data={a2data} />;
                                        }
                                        if (comp === 'weather' || comp === 'weather_card') {
                                          return <A2WeatherCard data={a2data} />;
                                        }
                                        if (comp === 'sandbox' || comp === 'iframe' || comp === 'preview') {
                                          return <A2Sandbox data={a2data} />;
                                        }
                                        if (comp === 'map' || comp === 'google_maps') {
                                          return <A2Map data={a2data} />;
                                        }
                                        if (comp === 'data_grid' || comp === 'datagrid') {
                                          return <A2DataGrid data={a2data} />;
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
                                        return null;
                                      })()}
                                    </A2UIResponseWrapper>
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
          ? "top-[58%] -translate-y-1/2"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full mt-4 pb-2">
            {[
              { 
                icon: <Trello className="w-4 h-4 text-emerald-500" />, 
                title: "Kanban Task Board", 
                desc: `Generate a premium, interactive Kanban Task Board using Tailwind CSS and vanilla Javascript.

Please wrap it in the a2ui "preview" component format. The UI should include:
- A modern, dark-mode glassmorphic interface with Outfit/Inter typography.
- Three task columns: "To Do", "In Progress", and "Done".
- Dynamic task creation: A quick form to add tasks (title, description, priority badge).
- Interactivity: Move tasks between columns using buttons (e.g., "→", "←") and double-click to delete.
- Subtle animations, hover scale effects, and clean status indicators.`,
                tag: "Kanban"
              },
              { 
                icon: <Clock className="w-4 h-4 text-blue-500" />, 
                title: "Classic Pomodoro", 
                desc: `Generate a minimalist, premium Pomodoro Timer using Tailwind CSS and inline Javascript.

Please wrap it in the a2ui "preview" component format. Features needed:
- A high-end dark neumorphic interface with a large circular countdown timer.
- Animated progress circle indicating the elapsed time.
- Standard Pomodoro intervals: "Work" (25m), "Short Break" (5m), and "Long Break" (15m).
- Play/Pause/Reset controls with smooth transition icons.
- Sound-free visual notification (e.g., pulsing glow or screen flash) when the timer reaches zero.`,
                tag: "Productivity"
              },
              { 
                icon: <Calculator className="w-4 h-4 text-purple-500" />, 
                title: "SIP Portfolio Calculator", 
                desc: `Generate an interactive Financial Portfolio/SIP Calculator using Tailwind CSS and inline JS.

Please wrap it in the a2ui "preview" component format. Features:
- Clean dashboards with sliders to adjust:
  - Monthly Investment Amount (₹)
  - Expected Annual Return Rate (%)
  - Time Horizon (Years)
- Live calculations demonstrating the Total Invested Amount, Estimated Returns, and Total Wealth Gain.
- Dynamic visual breakdown (e.g., a styled SVG donut chart or progress bars comparing invested vs. gained wealth).
- Future value comparison table shown in a clean modal or side panel.`,
                tag: "Finance"
              },
              { 
                icon: <Clock className="w-4 h-4 text-indigo-500" />, 
                title: "Neumorphic Pomodoro", 
                desc: `Generate a premium, minimalist Pomodoro Timer using Tailwind CSS and vanilla Javascript.

Please wrap it in the a2ui "preview" component format. The UI must follow these specifications:

1. Neumorphic Design & Styling:
   - High-end dark neumorphic theme with a slate/zinc background (e.g., bg-slate-900).
   - Use soft, double-drop shadows (light top-left, dark bottom-right) to create extruded and recessed neumorphic buttons and frames.
   - Use Outfit or Inter font via Google Fonts.

2. Visual Elements:
   - A large, elegant circular countdown timer as the focal point.
   - An interactive SVG progress circle that smoothly drains/fills indicating the elapsed time.
   - Visual mode tabs: "Work" (25 min), "Short Break" (5 min), and "Long Break" (15 min) designed as recessed switches.

3. Interactivity & Functionality:
   - Responsive Play, Pause, and Reset buttons with smooth hover scaling and click states.
   - Sound-free visual alert when the timer hits zero (e.g., the outer border pulses with a neon crimson or emerald glow, and a clean overlay notification slides in).
   - A simple list underneath to track "Completed Cycles".

Ensure all CSS variables for neumorphic shadows and the JS timer logic are fully inline and self-contained in the HTML structure.`,
                tag: "Timer"
              },
              { 
                icon: <Presentation className="w-4 h-4 text-pink-500" />, 
                title: "Stock Market Presentation", 
                desc: `Generate a premium, modern Interactive Presentation Slide Deck about the Stock Market using Tailwind CSS and inline Javascript.

Please wrap it in the a2ui "preview" component format. The presentation should follow these specifications:

1. Design & Theme (Modern Fintech Aesthetic):
   - A high-end dark slate/zinc background (e.g., bg-slate-950) with glowing gradient accents (indigo/emerald).
   - Premium typography (like Inter or Outfit) via Google Fonts.
   - Smooth slide transition animations (fade-in, slide-over).

2. Slide Structure & Content:
   - Slide 1: Title Slide — "Understanding the Stock Market" (stunning hero typography and a glowing mock stock trend illustration).
   - Slide 2: How It Works — Visual cards explaining buyers, sellers, order books, and exchanges (NSE, BSE, NYSE).
   - Slide 3: Key Metrics — Recessed cards detailing P/E Ratio, Market Cap, and Dividend Yield.
   - Slide 4: Interactive Risk Calculator — A live mini-slider tool where users select their risk tolerance to see recommended portfolio allocations (e.g., Stocks, Bonds, Gold).
   - Slide 5: Market Summary — Actionable key takeaways for new investors.

3. Navigation & Interactive Controls:
   - Previous and Next buttons styled with glassmorphic hover effects.
   - A horizontal slide indicator dot bar at the bottom showing active progress.
   - A slide index sidebar or dropdown to skip directly to any slide.

Ensure all layout, SVG icons, and transition JS logic are fully inline and self-contained in the HTML code.`,
                tag: "Slides"
              },
              {
                icon: <Gamepad2 className="w-4 h-4 text-cyan-500" />,
                title: "Interactive Tic-Tac-Toe",
                desc: `Generate a premium interactive Tic-Tac-Toe game using Tailwind CSS and inline JS. Wrap it in a preview component.

Specifications:

Design:
- A beautiful dark-theme glassmorphic interface with soft purple/cyan neon highlights.
- Smooth hover scaling and animations for grid cells.

Bidirectional Event Handling:
- User Move -> Agent: When the player clicks a cell, update the board visually with "X" and automatically send a postMessage event to the parent window containing the action 'send' and the message string: "[Tic-Tac-Toe Move] I played X at grid cell index {index}. Here is the current board state: {boardState}. It is your turn! Please analyze the board and play your move. Reply strictly in this format: AI_MOVE: <index> (where index is 0-8)."
  (Trigger this by invoking window.parent.postMessage with type: 'a2ui-action', action: 'send')

- Agent Move -> Iframe: Bind a message listener to the window. If the incoming event data has type 'a2ui-agent-reply', check if the reply message text matches the pattern "AI_MOVE: <index>". Parse the index, play "O" at that position, and update the game board.

Include a clean status panel indicating who's turn it is and a "Reset Game" button.`,
                tag: "Game"
              }
            ].map((suggestion, idx) => {
              const themes: Record<string, {
                badgeBg: string;
                badgeText: string;
                badgeBorder: string;
                iconBg: string;
                hoverBorder: string;
                hoverGlow: string;
                gradientText: string;
              }> = {
                "Kanban": {
                  badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
                  badgeText: "text-emerald-600 dark:text-emerald-400",
                  badgeBorder: "border-emerald-200/50 dark:border-emerald-800/40",
                  iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
                  hoverBorder: "hover:border-emerald-300/80 dark:hover:border-emerald-700/60",
                  hoverGlow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]",
                  gradientText: "from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400"
                },
                "Game": {
                  badgeBg: "bg-cyan-50 dark:bg-cyan-950/40",
                  badgeText: "text-cyan-600 dark:text-cyan-400",
                  badgeBorder: "border-cyan-200/50 dark:border-cyan-800/40",
                  iconBg: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400",
                  hoverBorder: "hover:border-cyan-300/80 dark:hover:border-cyan-700/60",
                  hoverGlow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.08)]",
                  gradientText: "from-cyan-600 to-blue-500 dark:from-cyan-400 dark:to-blue-400"
                },
                "Productivity": {
                  badgeBg: "bg-blue-50 dark:bg-blue-950/40",
                  badgeText: "text-blue-600 dark:text-blue-400",
                  badgeBorder: "border-blue-200/50 dark:border-blue-800/40",
                  iconBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
                  hoverBorder: "hover:border-blue-300/80 dark:hover:border-blue-700/60",
                  hoverGlow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]",
                  gradientText: "from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400"
                },
                "Finance": {
                  badgeBg: "bg-purple-50 dark:bg-purple-950/40",
                  badgeText: "text-purple-600 dark:text-purple-400",
                  badgeBorder: "border-purple-200/50 dark:border-purple-800/40",
                  iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
                  hoverBorder: "hover:border-purple-300/80 dark:hover:border-purple-700/60",
                  hoverGlow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]",
                  gradientText: "from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-400"
                },
                "Timer": {
                  badgeBg: "bg-indigo-50 dark:bg-indigo-950/40",
                  badgeText: "text-indigo-600 dark:text-indigo-400",
                  badgeBorder: "border-indigo-200/50 dark:border-indigo-800/40",
                  iconBg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400",
                  hoverBorder: "hover:border-indigo-300/80 dark:hover:border-indigo-700/60",
                  hoverGlow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.08)]",
                  gradientText: "from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400"
                },
                "Slides": {
                  badgeBg: "bg-rose-50 dark:bg-rose-950/40",
                  badgeText: "text-rose-600 dark:text-rose-400",
                  badgeBorder: "border-rose-200/50 dark:border-rose-800/40",
                  iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
                  hoverBorder: "hover:border-rose-300/80 dark:hover:border-rose-700/60",
                  hoverGlow: "hover:shadow-[0_0_30px_rgba(244,63,94,0.08)]",
                  gradientText: "from-rose-600 to-pink-500 dark:from-rose-400 dark:to-pink-400"
                }
              };
              
              const theme = themes[suggestion.tag] || {
                badgeBg: "bg-slate-50 dark:bg-slate-950/40",
                badgeText: "text-slate-600 dark:text-slate-400",
                badgeBorder: "border-slate-200/50 dark:border-slate-800/40",
                iconBg: "bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400",
                hoverBorder: "hover:border-slate-300/80 dark:hover:border-slate-700/60",
                hoverGlow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.08)]",
                gradientText: "from-slate-600 to-slate-500 dark:from-slate-400 dark:to-slate-300"
              };

              return (
                <button 
                  key={idx}
                  onClick={() => {
                    setInput(suggestion.desc)
                  }}
                  className={cn(
                    "flex flex-col justify-between items-start gap-4 p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 transition-all duration-300 text-left group hover:-translate-y-1 hover:bg-white/80 dark:hover:bg-slate-950/60 relative overflow-hidden",
                    theme.hoverBorder,
                    theme.hoverGlow
                  )}
                >
                  <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-transparent to-current opacity-[0.02] dark:opacity-[0.04] blur-xl pointer-events-none transition-all duration-500 group-hover:scale-150" />
                  
                  <div className="w-full">
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className={cn("p-2 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)]", theme.iconBg)}>
                        {suggestion.icon}
                      </div>
                      <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border", theme.badgeBg, theme.badgeText, theme.badgeBorder)}>
                        {suggestion.tag}
                      </span>
                    </div>
                    <div className="w-full">
                      <h3 className={cn("text-[14px] font-bold text-slate-800 dark:text-slate-100 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent", theme.gradientText)}>
                        {suggestion.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5 line-clamp-2 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                        {suggestion.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full pt-3 border-t border-slate-100/60 dark:border-slate-800/40">
                    <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      Use prompt template
                    </span>
                    <div className="p-1 rounded-lg bg-slate-50 dark:bg-slate-900 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/80 transition-colors ml-auto flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-all duration-300 transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
          </div>
        </div>
      </div>

        {/* Drag Handle for Resizing Side Panel */}
        {isSidePanelOpen && !isMobile && (
          <div 
            onMouseDown={startResizingSidePanel}
            className="w-1 cursor-col-resize hover:bg-primary/40 bg-transparent transition-all z-10 flex items-center justify-center group shrink-0"
          >
            <div className="h-10 w-[2px] rounded bg-muted-foreground/20 group-hover:bg-primary/80 transition-colors pointer-events-none select-none" />
          </div>
        )}

        {/* Right Column: Artifact Preview */}
        {isSidePanelOpen && (
          <aside 
            style={{ width: isMobile ? '100%' : `${sidePanelWidth}px` }}
            className={cn(
              "flex flex-col shrink-0 h-full overflow-hidden border-l border-border/30 relative z-10",
              isMobile ? "absolute inset-0 z-50 bg-slate-950" : "bg-card/30 backdrop-blur-xl"
            )}
          >
            {/* Header with Title, Tabs, Copy/Refresh Options and Close Button */}
            <div className="p-4 flex items-center justify-between border-b border-border/50 bg-card/50 shrink-0 select-none">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                <h2 className="text-sm font-bold">
                  Preview
                </h2>
              </div>

              {/* Tabs and action buttons when Sandbox is active */}
              <div className="flex items-center gap-3">
                {['sandbox', 'iframe', 'preview'].includes(activeA2UI?.a2ui?.component?.toLowerCase?.()) && (
                  <>
                    {/* Sliding Pill Tabs */}
                    <div className="relative flex p-0.5 bg-slate-200/50 dark:bg-slate-950/85 rounded-lg border border-slate-200/30 dark:border-slate-800/30 shrink-0 w-36">
                      <div 
                        className="absolute top-0.5 bottom-0.5 rounded-md bg-white dark:bg-slate-800 shadow-sm transition-all duration-300 ease-out"
                        style={{
                          width: 'calc(50% - 2px)',
                          left: activeTab === 'preview' ? '2px' : 'calc(50% + 0px)'
                        }}
                      />
                      <button
                        onClick={() => setActiveTab('preview')}
                        className={`relative z-10 flex-1 py-1 rounded-md text-[11px] font-semibold transition-all duration-300 text-center ${
                          activeTab === 'preview'
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => setActiveTab('code')}
                        className={`relative z-10 flex-1 py-1 rounded-md text-[11px] font-semibold transition-all duration-300 text-center ${
                          activeTab === 'code'
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        Code
                      </button>
                    </div>

                    {/* Action buttons (Copy/Refresh/New Tab) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {activeTab === 'preview' ? (
                        <>
                          <button
                            onClick={handleOpenInNewTab}
                            title="Open in New Tab"
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/50 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleRefreshSandbox}
                            title="Refresh Preview"
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/50 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleCopySandboxCode}
                          title="Copy Code"
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/50 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                          {copied ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </>
                )}

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsSidePanelOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/50 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Close Preview"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Preview content */}
            {activeA2UI ? (
              <div className="flex-1 min-h-0 flex flex-col bg-slate-950/5 select-text">
                {['sandbox', 'iframe', 'preview'].includes(activeA2UI?.a2ui?.component?.toLowerCase?.()) ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    <A2Sandbox 
                      data={activeA2UI} 
                      isControlled={true}
                      activeTab={activeTab}
                      iframeKey={iframeKey}
                      copied={copied}
                      onCopy={handleCopySandboxCode}
                      iframeRef={activeIframeRef}
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {(() => {
                      const comp = activeA2UI?.a2ui?.component?.toLowerCase?.();
                      if (comp === 'image') {
                        return <A2Image data={activeA2UI} />;
                      }
                      if (comp === 'flights' || comp === 'flight_list') {
                        return <A2FlightsList data={activeA2UI} />;
                      }
                      if (comp === 'weather' || comp === 'weather_card') {
                        return <A2WeatherCard data={activeA2UI} />;
                      }
                      if (comp === 'map' || comp === 'google_maps') {
                        return <A2Map data={activeA2UI} />;
                      }
                      if (comp === 'audioplayer' || comp === 'audio') {
                        return (
                          <A2AudioPlayer
                            label={activeA2UI.a2ui.label}
                            src={activeA2UI.a2ui.src}
                            data={activeA2UI.a2ui.data}
                            title={activeA2UI.a2ui.title}
                          />
                        );
                      }
                      if (comp === 'videoplayer' || comp === 'video' || comp === 'youtube') {
                        return (
                          <A2VideoPlayer
                            label={activeA2UI.a2ui.label}
                            src={activeA2UI.a2ui.src}
                            title={activeA2UI.a2ui.title}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-xs italic">
                No active artifact to display. Click "Open" on a card in the chat to preview it.
              </div>
            )}
          </aside>
        )}
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
