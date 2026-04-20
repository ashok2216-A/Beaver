import React, { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles, User, ArrowLeft, Rocket, Settings2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";
import { toast } from "sonner";

const methodColor: Record<string, string> = {
  GET: "bg-success/10 text-success",
  POST: "bg-primary/10 text-primary",
  DELETE: "bg-destructive/10 text-destructive",
  PUT: "bg-warning/10 text-warning",
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

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter endpoints based on search query
  const filteredEndpoints = agent?.endpoints?.filter((ep: any) => 
    ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ep.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ep.summary.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  useEffect(() => {
    if (agent && messages.length === 0) {
      setMessages([{ role: "assistant", text: `Hi! I'm ${agent.name}. How can I help you with the API today?` }]);
      if (agent.endpoints?.length > 0) setSelected(agent.endpoints[0].path);
    }
  }, [agent]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (text: string) => api.post<any>(`/chat/${agentId}`, { message: text }),
    onSuccess: (data) => {
      setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send message");
    },
  });

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

  const send = () => {
    if (!input.trim() || isSending) return;
    const userMsg: Msg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    sendMessage(input);
    setInput("");
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading agent...</div>;
  if (!agent) return <div className="h-screen flex items-center justify-center">Agent not found.</div>;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-14 shrink-0 border-b border-border bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <div className="h-5 w-px bg-border" />
          <Logo />
          <div className="h-5 w-px bg-border" />
          <div>
            <p className="text-sm font-semibold leading-none">{agent.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{agent.status} · auto-saved</p>
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
        <aside className="hidden lg:flex flex-col border-r border-border bg-sidebar min-h-0">
          <div className="p-4 border-b border-sidebar-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endpoints</p>
            <p className="text-xs text-muted-foreground mt-1">{agent.endpoints?.length || 0} parsed from spec</p>
            <div className="relative mt-3">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input 
                placeholder="Filter endpoints" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-2 text-xs outline-none focus:border-primary/40" 
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredEndpoints.map((ep: any) => (
              <button
                key={ep.id}
                onClick={() => setSelected(ep.path)}
                className={`w-full text-left rounded-lg border p-2.5 transition-base ${
                  selected === ep.path
                    ? "border-primary/40 bg-primary-soft"
                    : "border-transparent hover:bg-sidebar-accent/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${methodColor[ep.method]}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs truncate">{ep.path}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground truncate">{ep.summary}</p>
              </button>
            ))}
            {filteredEndpoints.length === 0 && (
              <p className="p-4 text-center text-xs text-muted-foreground italic">No matching endpoints.</p>
            )}
          </div>
        </aside>

        {/* Center: chat */}
        <section className="flex flex-col min-h-0 bg-gradient-card">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 animate-fade-in ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    m.role === "user"
                      ? "bg-secondary"
                      : "bg-gradient-primary text-primary-foreground shadow-glow"
                  }`}>
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-background border border-border rounded-tl-sm shadow-sm prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:p-2 prose-pre:rounded-md"
                  }`}>
                    {m.role === "user" ? (
                      m.text
                    ) : (
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex gap-3 animate-pulse">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm shadow-sm">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-border bg-background/80 backdrop-blur p-4">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm focus-within:border-primary/40 focus-within:ring-soft transition-base">
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
        <aside className="hidden lg:flex flex-col border-l border-border bg-sidebar min-h-0">
          <div className="p-4 border-b border-sidebar-border flex items-center gap-2">
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
                    <option value="bearer">Bearer Token</option>
                    <option value="apikey">API Key (Header)</option>
                  </select>
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
          <div className="p-4 border-t border-sidebar-border">
            <Button type="submit" form="settings-form" variant="hero" className="w-full">Save changes</Button>
          </div>
        </aside>
      </div>

      <style>{`
        .settings-input {
          width: 100%;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
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
