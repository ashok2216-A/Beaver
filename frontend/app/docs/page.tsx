'use client'

import { useState } from "react"
import { Navigation } from "@/components/landing/navigation"
import { FooterSection } from "@/components/landing/footer-section"
import { 
  BookOpen, 
  Terminal, 
  Shield, 
  Rocket, 
  ChevronRight,
  Code2, 
  Lock, 
  Zap, 
  Globe, 
  CheckCircle2, 
  Copy, 
  Check,
  MessageSquare, 
  Package, 
  AlertTriangle,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative rounded-2xl bg-[#0d0d0f] border border-white/5 overflow-hidden my-6 group">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{language}</span>
        <button onClick={copy} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
      <pre className="p-5 text-sm font-mono text-zinc-100 overflow-x-auto leading-relaxed">{code}</pre>
    </div>
  )
}

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <div className="flex gap-6 mb-8">
    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-black shadow-glow-sm">
      {n}
    </div>
    <div className="flex-1 pt-1">
      <h4 className="font-bold text-foreground text-lg mb-2">{title}</h4>
      <div className="text-base text-muted-foreground leading-relaxed">{children}</div>
    </div>
  </div>
)

const Callout = ({ icon: Icon, type, title, children }: { icon: any; type: "tip" | "warning" | "info"; title: string; children: React.ReactNode }) => {
  const styles = {
    tip: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    warning: "border-amber-500/20 bg-amber-500/5 text-amber-400",
    info: "border-primary/20 bg-primary/5 text-primary",
  }
  return (
    <div className={cn("rounded-2xl border p-5 my-6", styles[type])}>
      <div className="flex items-start gap-4">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-base mb-1">{title}</p>
          <p className="text-sm leading-relaxed opacity-80">{children}</p>
        </div>
      </div>
    </div>
  )
}

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    summary: "Upload an OpenAPI spec and have a working AI agent in under 2 minutes.",
    content: (
      <div className="space-y-6">
        <p className="text-lg text-muted-foreground leading-relaxed">
          Beaver turns any OpenAPI 3.0 or Swagger 2.0 specification into a fully functional, tool-calling AI agent. The entire process — from spec upload to live agent — takes under 2 minutes.
        </p>

        <div className="space-y-4 pt-4">
          <Step n={1} title="Sign in and open the Dashboard">
            Navigate to your personal dashboard and click <span className="text-primary font-bold">Create New Agent</span>.
          </Step>
          <Step n={2} title="Upload your OpenAPI specification">
            Drag-and-drop a <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">.json</code> or <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">.yaml</code> file, or paste a public URL.
          </Step>
          <Step n={3} title="Configure authentication">
            Select your auth type (Bearer Token, API Key, Basic Auth) and enter your credentials. Secrets are encrypted immediately using AES-256.
          </Step>
          <Step n={4} title="Review auto-generated tools">
            Beaver parses every endpoint and generates a semantic tool for each. Review, rename, or disable tools using the endpoint panel.
          </Step>
          <Step n={5} title="Test in the Live Sandbox">
            Use the built-in chat interface to ask your agent questions in natural language. Inspect the tool calls it makes in real-time.
          </Step>
          <Step n={6} title="Deploy">
            Click <strong>Deploy</strong> to publish your agent as a REST endpoint or an embeddable chat widget.
          </Step>
        </div>

        <Callout icon={CheckCircle2} type="tip" title="Supported spec formats">
          OpenAPI 3.0 (JSON & YAML), Swagger 2.0 (JSON & YAML), and Postman Collection v2.1 via our conversion layer.
        </Callout>

        <h3 className="text-2xl font-bold text-foreground mt-12 mb-4">Your First API Call</h3>
        <p className="text-muted-foreground mb-4">Once deployed, chat with your agent via the REST API:</p>
        <CodeBlock language="bash" code={`curl -X POST https://api.beaver.ai/v1/agents/{id}/chat \\
  -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "List all active subscriptions"}'`} />
      </div>
    ),
  },
  {
    id: "authentication",
    title: "Authentication",
    icon: Shield,
    summary: "Configure Bearer tokens, API keys, and Basic Auth for your agents.",
    content: (
      <div className="space-y-8">
        <p className="text-lg text-muted-foreground leading-relaxed">
          Beaver supports three authentication patterns that cover the vast majority of REST APIs. Credentials are stored encrypted at rest and injected at request time — your secrets never appear in agent responses.
        </p>

        <div className="grid gap-6">
          <Card className="p-6 border border-white/5 bg-card/50">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">Bearer Token</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Injected as <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono text-xs">Authorization: Bearer &lt;token&gt;</code> on every request. Used by Stripe, GitHub, Notion, and most modern APIs.</p>
            <CodeBlock language="json" code={`{
  "auth_type": "bearer",
  "token": "sk_live_..."
}`} />
          </Card>

          <Card className="p-6 border border-white/5 bg-card/50">
            <div className="flex items-center gap-3 mb-4">
              <Code2 className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">API Key (Header)</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Injected as a custom header. You specify the header name (e.g., <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono text-xs">X-Api-Key</code>) and value.</p>
            <CodeBlock language="json" code={`{
  "auth_type": "api_key",
  "header_name": "X-Api-Key",
  "api_key": "your-key-here"
}`} />
          </Card>
        </div>

        <Callout icon={AlertTriangle} type="warning" title="Never expose credentials in messages">
          Credentials are injected server-side. Do not include API keys or tokens in chat messages — they will be visible in your logs.
        </Callout>
      </div>
    ),
  },
  {
    id: "security",
    title: "Security & Endpoint Locking",
    icon: Lock,
    summary: "Restrict which API tools your agent can invoke to prevent unintended access.",
    content: (
      <div className="space-y-6">
        <p className="text-lg text-muted-foreground leading-relaxed">
          Endpoint Locking gives you fine-grained control over what your agent is allowed to do. By default, every parsed endpoint becomes an available tool. Locking removes it from the agent's reasoning toolkit entirely.
        </p>

        <h3 className="text-2xl font-bold text-foreground mt-12 mb-6">Why it matters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[
            { title: "Prevent accidental writes", desc: "Lock DELETE and POST endpoints while allowing GET so your agent can only read data." },
            { title: "Minimize attack surface", desc: "Reduce the number of callable tools to only those needed for the agent's purpose." },
            { title: "Compliance", desc: "Ensure agents in regulated environments (finance, healthcare) can only access approved endpoints." },
            { title: "Cost control", desc: "Prevent agents from calling expensive or rate-limited endpoints unnecessarily." },
          ].map((c, i) => (
            <Card key={i} className="p-5 border border-white/5 bg-card shadow-sm hover:shadow-glow-sm transition-all duration-300">
              <p className="font-bold text-base mb-2">{c.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </Card>
          ))}
        </div>

        <Callout icon={CheckCircle2} type="tip" title="Read-only mode">
          To create a read-only agent instantly, use the <strong>Lock All Write Endpoints</strong> button in the Builder to disable every POST, PUT, PATCH, and DELETE tool in one click.
        </Callout>
      </div>
    ),
  },
  {
    id: "deployment",
    title: "Deployment",
    icon: Terminal,
    summary: "Deploy agents as REST endpoints or embeddable chat widgets.",
    content: (
      <div className="space-y-8">
        <p className="text-lg text-muted-foreground leading-relaxed">
          Beaver offers two deployment modes. You can use both simultaneously — the same agent can power a REST integration and an embedded chat widget at the same time.
        </p>

        <div className="grid gap-8">
          <Card className="p-8 border border-white/5 bg-card/50 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold">REST Endpoint</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md ml-auto">Production Ready</span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">Use the <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono text-xs">/chat</code> endpoint to integrate Beaver agents into any backend, mobile app, or serverless function.</p>
            <CodeBlock language="python" code={`import httpx

response = httpx.post(
    "https://api.beaver.ai/v1/chat/{id}",
    headers={"Authorization": "Bearer <token>"},
    json={"message": "What is the current status of order #123?"}
)
print(response.json()["reply"])`} />
          </Card>

          <Card className="p-8 border border-white/5 bg-card/50 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold">Chat Widget</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md ml-auto">Recommended</span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">Drop a single <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono text-xs">&lt;script&gt;</code> tag onto any webpage to embed your agent as a floating chat bubble.</p>
            <CodeBlock language="html" code={`<!-- Add before </body> -->
<script
  src="https://api.beaver.ai/widget.js"
  data-agent-id="agt_01HZ..."
  data-theme="dark"
  data-accent="#8b5cf6">
</script>`} />
          </Card>
        </div>
      </div>
    ),
  },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id)

  return (
    <div className="min-h-screen bg-background pitch-dark">
      <Navigation />
      
      <div className="pt-32 pb-32 container max-w-[1400px]">
        <div className="grid lg:grid-cols-[300px_1fr] gap-16">
          {/* Sidebar */}
          <aside className="hidden lg:block sticky top-32 h-fit">
            <div className="relative mb-10">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                placeholder="Search documentation..." 
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-4 px-4">Core Guides</h4>
                <nav className="space-y-1">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveSection(s.id)
                        document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                        activeSection === s.id 
                          ? "bg-primary/10 text-primary shadow-glow-sm" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <s.icon className="h-4 w-4" />
                        {s.title}
                      </div>
                      {activeSection === s.id && <ChevronRight className="h-4 w-4 animate-in slide-in-from-left-1" />}
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="px-4 py-6 rounded-2xl bg-primary/5 border border-primary/10">
                <h5 className="text-xs font-bold mb-2">Need Help?</h5>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">Our engineers are available 24/7 to help with your API integration.</p>
                <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary">Contact Support</Button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="max-w-4xl">
            <div className="mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-6">
                <BookOpen className="w-3.5 h-3.5" /> Docs v2.0
              </div>
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[0.9]">
                Documentation <br />
                <span className="text-muted-foreground">Hub.</span>
              </h1>
              <p className="text-2xl text-muted-foreground leading-relaxed">Everything you need to build, test, and deploy production-ready AI agents from your REST APIs.</p>
            </div>

            <div className="space-y-32">
              {sections.map((s) => (
                <section 
                  key={s.id} 
                  id={s.id}
                  className="scroll-mt-32 transition-all duration-700"
                >
                  <div className="flex items-center gap-5 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-sm">
                      <s.icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight m-0">{s.title}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground/60 mb-10 pl-[4.25rem]">{s.summary}</p>
                  
                  <div className="pl-0 md:pl-[4.25rem]">
                    {s.content}
                  </div>
                  
                  <div className="mt-20 border-b border-border/50" />
                </section>
              ))}
            </div>

            {/* Help Section */}
            <Card className="mt-32 p-12 rounded-[3rem] border-none bg-card shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700">
                <Package className="w-40 h-40 text-primary" />
              </div>
              <div className="relative z-10 text-center space-y-6">
                <h3 className="text-4xl font-bold">Still have questions?</h3>
                <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Join our community of 5,000+ developers or reach out to our enterprise support team.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button className="rounded-xl h-14 px-10 text-lg font-bold shadow-glow">
                    Chat with an Expert
                  </Button>
                  <Button variant="outline" className="rounded-xl h-14 px-10 text-lg font-bold glass-premium">
                    View FAQ
                  </Button>
                </div>
              </div>
            </Card>
          </main>
        </div>
      </div>

      <FooterSection />
    </div>
  )
}

import { Card } from "@/components/ui/card"

