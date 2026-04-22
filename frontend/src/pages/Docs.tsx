import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  BookOpen, Terminal, Shield, Rocket, ChevronRight,
  Code2, Lock, Zap, Globe, CheckCircle2, Copy, Check,
  MessageSquare, Package, AlertTriangle
} from "lucide-react";
import { useState } from "react";

const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl bg-[#0d0d0f] border border-white/8 overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{language}</span>
        <button onClick={copy} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-zinc-100 overflow-x-auto leading-relaxed">{code}</pre>
    </div>
  );
};

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <div className="flex gap-4 mb-6">
    <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-black">{n}</div>
    <div className="flex-1 pt-0.5">
      <p className="font-bold text-foreground mb-2">{title}</p>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  </div>
);

const Callout = ({ icon: Icon, type, title, children }: { icon: any; type: "tip" | "warning" | "info"; title: string; children: React.ReactNode }) => {
  const styles = {
    tip: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    warning: "border-amber-500/20 bg-amber-500/5 text-amber-400",
    info: "border-primary/20 bg-primary/5 text-primary",
  };
  return (
    <div className={`rounded-xl border p-4 my-4 ${styles[type]}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-sm mb-1">{title}</p>
          <p className="text-xs leading-relaxed opacity-80">{children}</p>
        </div>
      </div>
    </div>
  );
};

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    guide: "/docs#getting-started",
    summary: "Upload an OpenAPI spec and have a working AI agent in under 2 minutes.",
    content: (
      <div>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Beaver turns any OpenAPI 3.0 or Swagger 2.0 specification into a fully functional, tool-calling AI agent. The entire process — from spec upload to live agent — takes under 2 minutes.
        </p>

        <h3 className="font-bold text-foreground mb-4">Quick Start</h3>
        <Step n={1} title="Sign in and open the Dashboard">
          Navigate to <code className="text-primary bg-primary/10 px-1 rounded text-xs font-mono">/dashboard</code> and click <strong>New Agent</strong>.
        </Step>
        <Step n={2} title="Upload your OpenAPI specification">
          Drag-and-drop a <code className="text-primary bg-primary/10 px-1 rounded text-xs font-mono">.json</code> or <code className="text-primary bg-primary/10 px-1 rounded text-xs font-mono">.yaml</code> file, or paste a public URL (e.g. <code className="text-primary bg-primary/10 px-1 rounded text-xs font-mono">https://petstore.swagger.io/v2/swagger.json</code>).
        </Step>
        <Step n={3} title="Configure authentication">
          Select your auth type (Bearer Token, API Key, Basic Auth) and enter your credentials. Secrets are encrypted immediately.
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

        <Callout icon={CheckCircle2} type="tip" title="Supported spec formats">
          OpenAPI 3.0 (JSON & YAML), Swagger 2.0 (JSON & YAML), and Postman Collection v2.1 via our conversion layer.
        </Callout>

        <h3 className="font-bold text-foreground mt-8 mb-4">Your First API Call</h3>
        <p className="text-sm text-muted-foreground mb-2">Once deployed, chat with your agent via the REST API:</p>
        <CodeBlock language="bash" code={`curl -X POST https://api-agent-backend.onrender.com/api/v1/agents/{id}/chat \\
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
    guide: "/api-reference",
    summary: "Configure Bearer tokens, API keys, and Basic Auth for your agents.",
    content: (
      <div>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Beaver supports three authentication patterns that cover the vast majority of REST APIs. Credentials are stored encrypted at rest and injected at request time — your secrets never appear in agent responses.
        </p>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/5 bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="font-bold">Bearer Token</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Injected as <code className="text-primary bg-primary/10 px-1 rounded font-mono">Authorization: Bearer &lt;token&gt;</code> on every request. Used by Stripe, GitHub, Notion, and most modern APIs.</p>
            <CodeBlock language="json" code={`{
  "auth_type": "bearer",
  "token": "sk_live_..."
}`} />
          </div>

          <div className="rounded-xl border border-white/5 bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="h-4 w-4 text-primary" />
              <h3 className="font-bold">API Key (Header)</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Injected as a custom header. You specify the header name (e.g., <code className="text-primary bg-primary/10 px-1 rounded font-mono">X-Api-Key</code>) and value.</p>
            <CodeBlock language="json" code={`{
  "auth_type": "api_key",
  "header_name": "X-Api-Key",
  "api_key": "your-key-here"
}`} />
          </div>

          <div className="rounded-xl border border-white/5 bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-primary" />
              <h3 className="font-bold">Basic Auth</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Username/password credentials are Base64-encoded and sent as <code className="text-primary bg-primary/10 px-1 rounded font-mono">Authorization: Basic &lt;encoded&gt;</code>.</p>
            <CodeBlock language="json" code={`{
  "auth_type": "basic",
  "username": "admin",
  "password": "s3cr3t"
}`} />
          </div>
        </div>

        <Callout icon={AlertTriangle} type="warning" title="Never expose credentials in messages">
          Credentials are injected server-side. Do not include API keys or tokens in chat messages — they will be visible in your logs.
        </Callout>
      </div>
    ),
  },
  {
    id: "endpoint-locking",
    title: "Security & Endpoint Locking",
    icon: Lock,
    guide: "/docs#endpoint-locking",
    summary: "Restrict which API tools your agent can invoke to prevent unintended access.",
    content: (
      <div>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Endpoint Locking gives you fine-grained control over what your agent is allowed to do. By default, every parsed endpoint becomes an available tool. Locking removes it from the agent's reasoning toolkit entirely.
        </p>

        <h3 className="font-bold text-foreground mb-4">Why it matters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { title: "Prevent accidental writes", desc: "Lock DELETE and POST endpoints while allowing GET so your agent can only read data." },
            { title: "Minimize attack surface", desc: "Reduce the number of callable tools to only those needed for the agent's purpose." },
            { title: "Compliance", desc: "Ensure agents in regulated environments (finance, healthcare) can only access approved endpoints." },
            { title: "Cost control", desc: "Prevent agents from calling expensive or rate-limited endpoints unnecessarily." },
          ].map((c, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-card p-4">
              <p className="font-bold text-sm mb-1">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground mb-4">How to lock an endpoint</h3>
        <Step n={1} title="Open Agent Builder">Go to your agent and click the <strong>Endpoints</strong> tab.</Step>
        <Step n={2} title="Toggle the lock icon">Each endpoint row has a lock icon. Click it to prevent the agent from using that tool.</Step>
        <Step n={3} title="Save &amp; redeploy">Locked endpoints are excluded from the system prompt sent to the LLM at inference time.</Step>

        <Callout icon={CheckCircle2} type="tip" title="Read-only mode">
          To create a read-only agent instantly, use the <strong>Lock All Write Endpoints</strong> button to disable every POST, PUT, PATCH, and DELETE tool in one click.
        </Callout>
      </div>
    ),
  },
  {
    id: "deploying",
    title: "Deployment",
    icon: Terminal,
    guide: "/api-reference",
    summary: "Deploy agents as REST endpoints or embeddable chat widgets.",
    content: (
      <div>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Beaver offers two deployment modes. You can use both simultaneously — the same agent can power a REST integration and an embedded chat widget at the same time.
        </p>

        <div className="space-y-6 mb-8">
          <div className="rounded-xl border border-white/5 bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-primary" />
              <h3 className="font-bold">REST Endpoint</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md">Live</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Use the <code className="text-primary bg-primary/10 px-1 rounded font-mono">/chat</code> endpoint to integrate Beaver agents into any backend, mobile app, or serverless function.</p>
            <CodeBlock language="python" code={`import httpx

response = httpx.post(
    "https://api-agent-backend.onrender.com/api/v1/agents/{id}/chat",
    headers={"Authorization": "Bearer <token>"},
    json={"message": "What is the current balance?"}
)
print(response.json()["reply"])`} />
          </div>

          <div className="rounded-xl border border-white/5 bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="font-bold">Embedded Chat Widget</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">New</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Drop a single <code className="text-primary bg-primary/10 px-1 rounded font-mono">&lt;script&gt;</code> tag onto any webpage to embed your agent as a floating chat bubble.</p>
            <CodeBlock language="html" code={`<!-- Add before </body> -->
<script
  src="https://api-agent-backend.onrender.com/widget.js"
  data-agent-id="agt_01HZ..."
  data-theme="dark"
  data-accent="#8b5cf6">
</script>`} />
          </div>
        </div>

        <h3 className="font-bold text-foreground mb-4">Environment Variables</h3>
        <p className="text-sm text-muted-foreground mb-3">Configure your frontend to point to the correct backend:</p>
        <CodeBlock language="bash" code={`# .env
VITE_API_BASE_URL=https://api-agent-backend.onrender.com/api/v1
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...`} />

        <Callout icon={Zap} type="info" title="Zero cold-start deployment">
          Agent configurations are cached in-memory on first load. Production deployments on paid plans have guaranteed warm instances with no cold-start latency.
        </Callout>
      </div>
    ),
  },
  {
    id: "testing",
    title: "Testing & Debugging",
    icon: Package,
    guide: "/docs#testing",
    summary: "Use the live sandbox and request logs to iterate on your agent quickly.",
    content: (
      <div>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Beaver's built-in sandbox lets you interact with your agent before going live. Every chat message shows a detailed trace: which tools were called, what parameters were passed, and what the API returned.
        </p>

        <h3 className="font-bold text-foreground mb-4">Sandbox Features</h3>
        <div className="space-y-3 mb-6">
          {[
            { title: "Tool call inspector", desc: "See exactly which endpoint the LLM decided to call and with what arguments." },
            { title: "Request/response viewer", desc: "Inspect the raw HTTP request sent to your API and the response received." },
            { title: "Latency breakdown", desc: "View time spent on LLM reasoning vs. API call execution." },
            { title: "Error replay", desc: "When an API call fails, replay it with modified parameters directly from the trace." },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-white/5">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground mb-4">Debugging common issues</h3>
        <div className="space-y-4">
          {[
            { problem: "Agent calls wrong endpoint", fix: "Add a description to the problematic endpoint in the Endpoint Settings panel. More context = better LLM routing." },
            { problem: "401 Unauthorized errors", fix: "Verify your credentials in Agent Settings → Authentication. Tokens may have expired." },
            { problem: "Agent loops or repeats", fix: "Enable strict mode in Advanced Settings to prevent the agent from retrying a failed tool call more than twice." },
          ].map((d, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-card p-4">
              <p className="text-sm font-bold text-rose-400 mb-1">Problem: {d.problem}</p>
              <p className="text-xs text-muted-foreground">Fix: {d.fix}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const Docs = () => {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-32 pb-24">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* SIDEBAR */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="sticky top-32 space-y-8">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-4">Guides</h4>
                <nav className="space-y-1">
                  {sections.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveSection(s.id);
                        document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all text-left ${
                        activeSection === s.id
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <s.icon className="h-4 w-4 flex-shrink-0" />
                      {s.title}
                    </button>
                  ))}
                </nav>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-4">Reference</h4>
                <nav className="space-y-1">
                  <Link
                    to="/api-reference"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                  >
                    <Code2 className="h-4 w-4" />
                    API Reference
                  </Link>
                </nav>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1 max-w-3xl">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-4 border border-primary/20">
                <BookOpen className="h-3.5 w-3.5" /> Docs v1.0
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">Documentation Hub</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Everything you need to build, test, and deploy production-ready AI agents using your existing REST APIs.
              </p>
            </div>

            <div className="space-y-20">
              {sections.map(s => (
                <section key={s.id} id={s.id} className="scroll-mt-32">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <s.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">{s.title}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground/60 mb-6 pl-12">{s.summary}</p>

                  <div className="pl-0">
                    {s.content}
                  </div>

                  <div className="mt-6 flex items-center gap-4 pl-0">
                    <Link
                      to={s.guide}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      Read full guide <ChevronRight className="h-3 w-3" />
                    </Link>
                    <Link
                      to="/api-reference"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      API Reference <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="mt-8 border-b border-white/5" />
                </section>
              ))}
            </div>

            {/* Help banner */}
            <div className="mt-20 p-8 rounded-2xl border border-primary/20 bg-primary/5">
              <h3 className="text-xl font-bold mb-2">Need more help?</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Our support team is available 24/7 to help you with complex API integrations, custom agent prompts, and enterprise deployments.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="mailto:support@beaver.dev" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                  Contact Support
                </a>
                <Link to="/api-reference" className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/5 transition-colors">
                  View API Reference
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Docs;
