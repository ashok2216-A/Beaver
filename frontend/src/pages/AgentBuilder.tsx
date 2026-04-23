import React, { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles, User, ArrowLeft, Rocket, Settings2, Search, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api, API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import { AgentAvatar } from "@/components/AgentAvatar";
import { useAuth } from "@clerk/clerk-react";

const methodColor: Record<string, string> = {
  GET: "bg-success/10 text-success",
  POST: "bg-primary/10 text-primary",
  DELETE: "bg-destructive/10 text-destructive",
  PUT: "bg-warning/10 text-warning",
  PATCH: "bg-slate-500/10 text-slate-600",
};

interface Msg {
  role: "user" | "assistant";
  text: string;
}

const AgentBuilder = () => {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("id");
  const queryClient = useQueryClient();

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => api.get<any>(`/agents/${agentId}`),
    enabled: !!agentId,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState("ALL");

  // Simple debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: endpointsData, isLoading: loadingEndpoints } = useQuery({
    queryKey: ["endpoints", agentId, debouncedSearch, page, selectedMethod],
    queryFn: () => api.get<any>(`/agents/${agentId}/endpoints?page=${page}&per_page=50&q=${debouncedSearch}&method=${selectedMethod}`),
    enabled: !!agentId,
  });

  const endpoints = endpointsData?.items || [];

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agent && messages.length === 0) {
      setMessages([{ role: "assistant", text: `Hi! I'm ${agent.name}. How can I help you with the API today?` }]);
    }
  }, [agent]);

  useEffect(() => {
    if (endpoints.length > 0 && !selected) {
      setSelected(endpoints[0].path);
    }
  }, [endpoints, selected]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const { getToken } = useAuth();
  const [isSending, setIsSending] = useState(false);

  const { mutate: updateSettings } = useMutation({
    mutationFn: (updates: any) => api.patch<any>(`/agents/${agentId}`, updates),
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save settings");
    },
  });

  const { mutate: toggleLock } = useMutation({
    mutationFn: (endpointId: number) => api.patch<any>(`/agents/${agentId}/endpoints/${endpointId}/toggle-lock`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoints", agentId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle lock");
    },
  });

  const { mutate: lockAll } = useMutation({
    mutationFn: () => api.patch<any>(`/agents/${agentId}/endpoints/lock-all?method=${selectedMethod}`),
    onSuccess: () => {
      toast.success(`All ${selectedMethod === 'ALL' ? '' : selectedMethod} endpoints locked`);
      queryClient.invalidateQueries({ queryKey: ["endpoints", agentId] });
    },
  });

  const { mutate: unlockAll } = useMutation({
    mutationFn: () => api.patch<any>(`/agents/${agentId}/endpoints/unlock-all?method=${selectedMethod}`),
    onSuccess: () => {
      toast.success(`All ${selectedMethod === 'ALL' ? '' : selectedMethod} endpoints unlocked`);
      queryClient.invalidateQueries({ queryKey: ["endpoints", agentId] });
    },
  });

  const send = async () => {
    if (!input.trim() || isSending) return;
    const userMsg: Msg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const token = await getToken();
      // Create a placeholder for the assistant response
      setMessages((m) => [...m, { role: "assistant", text: "" }]);
      
      const response = await fetch(`${API_BASE_URL}/chat/${agentId}?stream=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.type === "token") {
                fullText += data.text;
                setMessages((m) => {
                  const newMsgs = [...m];
                  newMsgs[newMsgs.length - 1].text = fullText;
                  return newMsgs;
                });
              }
              if (data.type === "error") {
                toast.error(data.text);
              }
            } catch (e) {
              // Ignore partial JSON or noise
            }
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading agent...</div>;
  if (!agent) return <div className="h-screen flex items-center justify-center">Agent not found.</div>;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-14 shrink-0 bg-background flex items-center justify-between px-4 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] z-10">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <div className="h-5 w-px opacity-0" />
          <Logo />
          <div className="h-5 w-px opacity-0" />
          <div>
            <p className="text-sm font-semibold leading-none">{agent.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{agent.status.charAt(0).toUpperCase() + agent.status.slice(1)} · auto-saved</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setMessages([{ role: "assistant", text: `Hi! I'm ${agent.name}. How can I help you with the API today?` }]);
              toast.success("Chat reset for testing");
            }}
          >
            Test
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to={`/deploy?id=${agent.id}`}><Rocket className="h-4 w-4" /> Deploy</Link>
          </Button>
        </div>
      </header>

      {/* 3-panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] min-h-0">
        {/* Left: endpoints */}
        <aside className="hidden lg:flex flex-col bg-sidebar min-h-0 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endpoints</p>
            <p className="text-xs text-muted-foreground mt-1">{endpointsData?.total || 0} parsed from spec</p>
            
            <div className="relative mt-3">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input 
                placeholder="Filter endpoints" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-md bg-background pl-8 pr-2 text-xs outline-none shadow-sm focus:ring-1 focus:ring-primary/20" 
              />
            </div>
            
            <div className="flex flex-wrap gap-1 mt-3">
              {["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => {
                const isActive = selectedMethod === m;
                const colorClass = m === "ALL" 
                  ? (isActive ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-sidebar-accent border-border")
                  : (isActive ? methodColor[m] : "bg-background text-muted-foreground hover:bg-sidebar-accent border-border");
                
                return (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMethod(m);
                      setPage(1);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-base border ${colorClass} ${
                      isActive ? "shadow-sm border-transparent" : "border-transparent"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {/* Context-aware Bulk Actions */}
            <div className="mt-3 flex items-center justify-between border-t border-dashed pt-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Bulk {selectedMethod === "ALL" ? "All" : selectedMethod}
              </span>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                  title={`Lock all ${selectedMethod === "ALL" ? "" : selectedMethod} endpoints`}
                  onClick={() => {
                    const msg = selectedMethod === "ALL" 
                      ? "Are you sure you want to lock ALL endpoints?" 
                      : `Lock all ${selectedMethod} endpoints?`;
                    if (confirm(msg)) lockAll();
                  }}
                >
                  <Lock className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" 
                  title={`Unlock all ${selectedMethod === "ALL" ? "" : selectedMethod} endpoints`}
                  onClick={() => {
                    const msg = selectedMethod === "ALL" 
                      ? "Unlock ALL endpoints?" 
                      : `Unlock all ${selectedMethod} endpoints?`;
                    if (confirm(msg)) unlockAll();
                  }}
                >
                  <Unlock className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingEndpoints ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Searching...</p>
              </div>
            ) : (
              <>
                {endpoints.map((ep: any) => (
                  <button
                    key={ep.id}
                    onClick={() => setSelected(ep.path)}
                    className={`w-full text-left rounded-lg border p-2.5 transition-base relative group/item ${
                      selected === ep.path
                        ? "border-primary/40 bg-primary-soft"
                        : "border-transparent hover:bg-sidebar-accent/60"
                    } ${ep.is_locked ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${methodColor[ep.method]}`}>
                          {ep.method}
                        </span>
                        <span className="font-mono text-xs truncate">{ep.path}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLock(ep.id);
                          toast.success(ep.is_locked ? "Endpoint unlocked" : "Endpoint locked");
                        }}
                        className={`h-6 w-6 flex items-center justify-center rounded-md border transition-base ${
                          ep.is_locked 
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : "border-border bg-background text-muted-foreground hover:text-primary hover:border-primary/40"
                        }`}
                        title={ep.is_locked ? "Unlock endpoint" : "Lock endpoint"}
                      >
                        {ep.is_locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">{ep.summary}</p>
                  </button>
                ))}
                {endpoints.length === 0 && (
                  <p className="p-4 text-center text-xs text-muted-foreground italic">No matching endpoints.</p>
                )}
                
                {/* Pagination Controls */}
                {endpointsData?.total > 0 && (
                  <div className="mt-4 flex items-center justify-between px-2 pb-4">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Page {page} of {Math.ceil(endpointsData.total / 50)}
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * 50 >= endpointsData.total}
                    >
                      <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Center: chat */}
        <section className="flex flex-col min-h-0 bg-gradient-card">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 animate-fade-in ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  {m.role === "user" ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      <User className="h-4 w-4" />
                    </div>
                  ) : (
                    <AgentAvatar id={Number(agentId)} name={agent.name} size="sm" className="h-9 w-9" />
                  )}
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-background border border-border rounded-tl-sm shadow-sm prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:p-2 prose-pre:rounded-md"
                  }`}>
                    {m.role === "user" ? (
                      m.text
                    ) : (
                      m.text ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown> : <span className="text-muted-foreground animate-pulse italic">Thinking...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-background/80 backdrop-blur p-4 shadow-[0_-1px_0_0_rgba(0,0,0,0.05)]">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-end gap-2 rounded-2xl bg-background p-2 shadow-sm ring-1 ring-black/5 focus-within:ring-primary/40 transition-base">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1}
                  placeholder={`Ask ${agent.name} anything...`}
                  className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground max-h-32"
                />
                <Button variant="hero" size="icon" onClick={send} className="h-9 w-9" disabled={isSending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">ADK Runner powered agent · Press ⏎ to send</p>
            </div>
          </div>
        </section>

        {/* Right: settings */}
        <aside className="hidden lg:flex flex-col bg-sidebar min-h-0 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">
          <div className="p-4 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Agent settings</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <form id="settings-form" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateSettings(Object.fromEntries(formData));
            }}>
              <Field label="Name">
                <input name="name" defaultValue={agent.name} className="settings-input" />
              </Field>
              <Field label="System prompt" hint="Defines your agent's personality and rules.">
                <textarea
                  name="system_prompt"
                  rows={4}
                  defaultValue={agent.system_prompt}
                  className="settings-input resize-none leading-relaxed"
                />
              </Field>
              <Field label="API base URL">
                <input name="base_url" defaultValue={agent.base_url} className="settings-input font-mono text-xs" />
              </Field>
              <div className="space-y-4 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Authentication</p>
                <Field label="Auth Type">
                  <select name="auth_type" defaultValue={agent.auth_type} className="settings-input">
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token (Authorization)</option>
                    <option value="apikey">API Key (Custom Header)</option>
                  </select>
                </Field>
                <Field label="Custom Auth Header" hint="Specific header name (e.g. x-api-key). Leave empty for defaults.">
                  <input name="auth_header" defaultValue={agent.auth_header} placeholder="x-api-key" className="settings-input font-mono text-xs" />
                </Field>
                <Field label="Auth Secret" hint="Token or secret key for this API.">
                  <input type="password" name="auth_secret" defaultValue={agent.auth_secret} className="settings-input font-mono text-xs" />
                </Field>
              </div>
              <div className="space-y-4 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Engine</p>
                <Field label="Model">
                  <select name="model_id" defaultValue={agent.model_id} className="settings-input">
                    <option value="mistral/mistral-small-latest">mistral-small (Mistral)</option>
                    <option value="mistral/mistral-large-latest">mistral-large (Mistral)</option>
                    <option value="gemini/gemini-2.0-flash-lite">gemini-2.0-flash (Google)</option>
                    <option value="openai/gpt-4o-mini">gpt-4o-mini (OpenAI)</option>
                  </select>
                </Field>
              </div>
            </form>
          </div>
          <div className="p-4">
            <Button type="submit" form="settings-form" variant="hero" className="w-full">Save changes</Button>
          </div>
        </aside>
      </div>

      <style>{`
        .settings-input {
          width: 100%;
          background: hsl(var(--background));
          border: none;
          box-shadow: 0 0 0 1px hsl(var(--border) / 0.5);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .settings-input:focus {
          border-color: hsl(var(--primary) / 0.5);
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.12);
        }
      `}</style>
    </div>
  );
};

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold mb-1.5">{label}</label>
    {children}
    {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export default AgentBuilder;
