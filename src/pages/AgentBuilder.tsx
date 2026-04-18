import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, Sparkles, User, ArrowLeft, Rocket, Settings2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const endpoints = [
  { method: "GET", path: "/v1/customers", desc: "List all customers" },
  { method: "POST", path: "/v1/customers", desc: "Create a customer" },
  { method: "GET", path: "/v1/customers/{id}", desc: "Retrieve a customer" },
  { method: "POST", path: "/v1/charges", desc: "Create a charge" },
  { method: "GET", path: "/v1/charges/{id}", desc: "Retrieve a charge" },
  { method: "POST", path: "/v1/refunds", desc: "Issue a refund" },
  { method: "GET", path: "/v1/products", desc: "List products" },
  { method: "POST", path: "/v1/subscriptions", desc: "Create subscription" },
  { method: "DELETE", path: "/v1/subscriptions/{id}", desc: "Cancel subscription" },
];

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

const initial: Msg[] = [
  { role: "assistant", text: "Hi! I'm your Stripe API agent. Ask me to list customers, issue refunds, manage subscriptions, and more." },
];

const AgentBuilder = () => {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string | null>("/v1/customers");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Msg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Calling `GET /v1/customers?limit=3` … done. Found 3 customers — would you like me to display them?" },
      ]);
    }, 700);
  };

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
            <p className="text-sm font-semibold leading-none">Stripe Payments Agent</p>
            <p className="text-xs text-muted-foreground mt-0.5">Draft · auto-saved</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Test</Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/deploy"><Rocket className="h-4 w-4" /> Deploy</Link>
          </Button>
        </div>
      </header>

      {/* 3-panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] min-h-0">
        {/* Left: endpoints */}
        <aside className="hidden lg:flex flex-col border-r border-border bg-sidebar min-h-0">
          <div className="p-4 border-b border-sidebar-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endpoints</p>
            <p className="text-xs text-muted-foreground mt-1">{endpoints.length} parsed from spec</p>
            <div className="relative mt-3">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Filter endpoints" className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-2 text-xs outline-none focus:border-primary/40" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {endpoints.map((ep) => (
              <button
                key={ep.path + ep.method}
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
                <p className="mt-1 text-xs text-muted-foreground truncate">{ep.desc}</p>
              </button>
            ))}
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
                      : "bg-background border border-border rounded-tl-sm shadow-sm"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
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
                  placeholder="Ask your agent anything... (try: 'list my last 3 customers')"
                  className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground max-h-32"
                />
                <Button variant="hero" size="icon" onClick={send} className="h-9 w-9">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">Agent calls real endpoints in test mode · Press ⏎ to send</p>
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
            <Field label="Name">
              <input defaultValue="Stripe Payments Agent" className="settings-input" />
            </Field>
            <Field label="System prompt" hint="Defines your agent's personality and rules.">
              <textarea
                rows={5}
                defaultValue="You are a helpful Stripe operations assistant. Always confirm before issuing refunds. Format currency as USD."
                className="settings-input resize-none leading-relaxed"
              />
            </Field>
            <Field label="API base URL">
              <input defaultValue="https://api.stripe.com" className="settings-input font-mono text-xs" />
            </Field>
            <Field label="Authentication">
              <select className="settings-input">
                <option>Bearer token</option>
                <option>API key</option>
                <option>OAuth 2.0</option>
                <option>None</option>
              </select>
            </Field>
            <Field label="Secret">
              <input type="password" defaultValue="sk_test_••••••••••••" className="settings-input font-mono text-xs" />
            </Field>
            <Field label="Model">
              <select className="settings-input">
                <option>gpt-5 (recommended)</option>
                <option>gpt-5-mini</option>
                <option>claude-sonnet-4.5</option>
              </select>
            </Field>
          </div>
          <div className="p-4 border-t border-sidebar-border">
            <Button variant="hero" className="w-full">Save changes</Button>
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
