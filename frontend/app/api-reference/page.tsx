'use client'

import { useState } from "react"
import { Navigation } from "@/components/landing/navigation"
import { FooterSection } from "@/components/landing/footer-section"
import { 
  Code, 
  Zap, 
  Lock, 
  Globe, 
  ArrowRight, 
  Terminal, 
  Copy, 
  Check, 
  ChevronRight, 
  Shield, 
  AlertTriangle, 
  CheckCircle2 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative rounded-2xl bg-[#0d0d0f] border border-white/5 overflow-hidden my-4 group">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{language}</span>
        <button onClick={copy} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
      <pre className="p-5 text-xs font-mono text-zinc-100 overflow-x-auto leading-relaxed">{code}</pre>
    </div>
  )
}

const methodColors: Record<string, string> = {
  GET:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  POST:   "text-violet-400 bg-violet-400/10 border-violet-400/20",
  DELETE: "text-rose-400   bg-rose-400/10   border-rose-400/20",
  PATCH:  "text-amber-400  bg-amber-400/10  border-amber-400/20",
}

const Badge = ({ method }: { method: string }) => (
  <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border", methodColors[method])}>
    {method}
  </span>
)

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/agents",
    title: "Create Agent",
    desc: "Create a new AI agent by providing an OpenAPI specification URL or uploading a specification file. Beaver automatically parses all endpoints and generates semantic tools the LLM can invoke.",
    params: [
      { name: "name", type: "string", required: true, desc: "Display name for the agent." },
      { name: "spec_url", type: "string", required: false, desc: "Public URL to an OpenAPI/Swagger spec (JSON or YAML)." },
      { name: "base_url", type: "string", required: true, desc: "Base URL for all API calls (e.g. https://api.stripe.com)." },
      { name: "auth_type", type: "enum", required: false, desc: "One of: bearer | api_key | basic | none. Defaults to none." },
    ],
    curl: `curl -X POST https://api.beaver.ai/api/v1/agents \\
  -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Stripe Agent",
    "spec_url": "https://stripe.com/openapi.yaml",
    "base_url": "https://api.stripe.com",
    "auth_type": "bearer",
    "token": "sk_live_..."
  }'`,
    body: `{
  "name": "Stripe Agent",
  "spec_url": "https://stripe.com/openapi.yaml",
  "base_url": "https://api.stripe.com",
  "auth_type": "bearer",
  "token": "sk_live_..."
}`,
    response: `{
  "id": "agt_01HZXK...",
  "name": "Stripe Agent",
  "status": "live",
  "endpoint_count": 42,
  "created_at": "2026-04-22T07:00:00Z"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/agents",
    title: "List Agents",
    desc: "Returns a paginated list of all agents belonging to the authenticated user, ordered by creation date (newest first).",
    params: [
      { name: "page", type: "integer", required: false, desc: "Page number (default: 1)." },
      { name: "limit", type: "integer", required: false, desc: "Items per page, max 100 (default: 20)." },
    ],
    curl: `curl https://api.beaver.ai/api/v1/agents \\
  -H "Authorization: Bearer <your-token>"`,
    body: null,
    response: `{
  "agents": [
    {
      "id": "agt_01HZXK...",
      "name": "Stripe Agent",
      "status": "live",
      "created_at": "2026-04-22T07:00:00Z"
    }
  ],
  "total": 1,
  "page": 1
}`,
  },
  {
    method: "POST",
    path: "/api/v1/agents/{id}/chat",
    title: "Chat with Agent",
    desc: "Send a natural language message to an agent. The LLM reasons over available tools, calls the appropriate API endpoints, and returns a synthesized reply.",
    params: [
      { name: "id", type: "string", required: true, desc: "The unique agent ID." },
      { name: "message", type: "string", required: true, desc: "The user's natural language message." },
      { name: "stream", type: "boolean", required: false, desc: "If true, returns a Server-Sent Events stream." },
    ],
    curl: `curl -X POST https://api.beaver.ai/api/v1/agents/agt_01HZXK/chat \\
  -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "List failed payments from last week",
    "stream": false
  }'`,
    body: `{
  "message": "List failed payments from last week",
  "stream": false
}`,
    response: `{
  "reply": "I found 3 failed payments from last week totalling $1,240.",
  "tool_calls": [
    {
      "tool": "list_charges",
      "url": "https://api.stripe.com/v1/charges",
      "status_code": 200
    }
  ]
}`,
  },
]

const errorCodes = [
  { code: 400, name: "Bad Request", desc: "Missing or malformed request body." },
  { code: 401, name: "Unauthorized", desc: "Missing or invalid Authorization header." },
  { code: 404, name: "Not Found", desc: "The agent ID does not exist." },
  { code: 429, name: "Rate Limited", desc: "Too many requests. Check retry headers." },
]

export default function ApiReferencePage() {
  const [active, setActive] = useState(0)
  const [activeTab, setActiveTab] = useState<"curl" | "body" | "response">("curl")
  const ep = endpoints[active]

  return (
    <div className="min-h-screen bg-background pitch-dark">
      <Navigation />
      
      <main className="pt-32 pb-32 container mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-6">
            Developer Docs
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[0.9]">
            API <br />
            <span className="text-muted-foreground">Reference.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Full REST API documentation for the Beaver platform — request schemas, cURL examples, response shapes, and error codes.
          </p>
        </div>

        {/* Info Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6 border border-white/5 bg-card/50 flex items-start gap-4 shadow-sm">
            <Globe className="h-6 w-6 text-primary mt-1" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Base URL</p>
              <code className="font-mono text-sm font-bold text-foreground">https://api.beaver.ai/api/v1</code>
            </div>
          </Card>
          <Card className="p-6 border border-white/5 bg-card/50 flex items-start gap-4 shadow-sm">
            <Shield className="h-6 w-6 text-primary mt-1" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Authentication</p>
              <code className="font-mono text-sm font-bold text-foreground">Authorization: Bearer &lt;token&gt;</code>
            </div>
          </Card>
          <Card className="p-6 border border-white/5 bg-card/50 flex items-start gap-4 shadow-sm">
            <Zap className="h-6 w-6 text-primary mt-1" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Rate Limit</p>
              <code className="font-mono text-sm font-bold text-foreground">60 req/min (Free Plan)</code>
            </div>
          </Card>
        </div>

        {/* Main Explorer */}
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-6 px-2">Endpoints</p>
            {endpoints.map((e, i) => (
              <button
                key={i}
                onClick={() => { setActive(i); setActiveTab("curl"); }}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-2xl transition-all duration-300",
                  active === i 
                    ? "bg-card border border-white/10 shadow-glow-sm" 
                    : "hover:bg-card/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Badge method={e.method} />
                  <h3 className="font-bold text-sm">{e.title}</h3>
                </div>
                <code className="text-[11px] font-mono opacity-50 truncate block">{e.path}</code>
              </button>
            ))}
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="p-8 border-none bg-card shadow-2xl rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-4">
                <Badge method={ep.method} />
                <code className="font-mono text-sm text-foreground bg-white/5 px-2 py-1 rounded">{ep.path}</code>
              </div>
              <h2 className="text-3xl font-bold mb-4">{ep.title}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">{ep.desc}</p>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Parameters</h4>
                  <div className="space-y-3">
                    {ep.params.map((p, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-background/50 border border-white/5">
                        <code className="text-xs font-mono text-primary font-bold">{p.name}</code>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-muted-foreground/50">{p.type}</span>
                            {p.required && <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded">required</span>}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    {(["curl", "body", "response"] as const).map((tab) => (
                      (tab !== 'body' || ep.body) && (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                            activeTab === tab ? "bg-primary text-primary-foreground shadow-glow-sm" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                          )}
                        >
                          {tab === 'curl' ? 'cURL' : tab === 'body' ? 'Request Body' : 'Response'}
                        </button>
                      )
                    ))}
                  </div>
                  {activeTab === "curl" && <CodeBlock language="bash" code={ep.curl} />}
                  {activeTab === "body" && ep.body && <CodeBlock language="json" code={ep.body} />}
                  {activeTab === "response" && <CodeBlock language="json" code={ep.response} />}
                </div>
              </div>
            </Card>

            <Card className="p-8 border border-white/5 bg-card/50 rounded-[2.5rem]">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Common Error Codes
              </h3>
              <div className="grid gap-3">
                {errorCodes.map((e, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-white/5">
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-amber-500">{e.code}</span>
                      <span className="font-bold text-sm">{e.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  )
}
