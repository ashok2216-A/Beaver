import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Code, Zap, Lock, Globe, ArrowRight, Terminal, Copy, Check, ChevronRight, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

/* ─── Reusable Components ──────────────────────────────────────── */

const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl bg-[#0d0d0f] border border-white/8 overflow-hidden my-3">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language}</span>
        <button onClick={copy} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-500" />}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-zinc-100 overflow-x-auto leading-relaxed">{code}</pre>
    </div>
  );
};

const methodColors: Record<string, string> = {
  GET:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  POST:   "text-violet-400 bg-violet-400/10 border-violet-400/20",
  DELETE: "text-rose-400   bg-rose-400/10   border-rose-400/20",
  PATCH:  "text-amber-400  bg-amber-400/10  border-amber-400/20",
};

const Badge = ({ method }: { method: string }) => (
  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${methodColors[method]}`}>
    {method}
  </span>
);

/* ─── Endpoint Data ────────────────────────────────────────────── */

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
      { name: "token", type: "string", required: false, desc: "Bearer token (required if auth_type is bearer)." },
    ],
    curl: `curl -X POST https://api-agent-backend.onrender.com/api/v1/agents \\
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
  "base_url": "https://api.stripe.com",
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
      { name: "status", type: "enum", required: false, desc: "Filter by status: live | draft." },
    ],
    curl: `curl https://api-agent-backend.onrender.com/api/v1/agents \\
  -H "Authorization: Bearer <your-token>"`,
    body: null,
    response: `{
  "agents": [
    {
      "id": "agt_01HZXK...",
      "name": "Stripe Agent",
      "status": "live",
      "endpoint_count": 42,
      "created_at": "2026-04-22T07:00:00Z"
    },
    {
      "id": "agt_02HABC...",
      "name": "Notion Bot",
      "status": "draft",
      "endpoint_count": 17,
      "created_at": "2026-04-20T12:00:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 20
}`,
  },
  {
    method: "GET",
    path: "/api/v1/agents/{id}",
    title: "Get Agent",
    desc: "Retrieve full details for a single agent, including all parsed endpoints and their lock status.",
    params: [
      { name: "id", type: "string", required: true, desc: "The unique agent ID (e.g. agt_01HZXK...)." },
    ],
    curl: `curl https://api-agent-backend.onrender.com/api/v1/agents/agt_01HZXK \\
  -H "Authorization: Bearer <your-token>"`,
    body: null,
    response: `{
  "id": "agt_01HZXK...",
  "name": "Stripe Agent",
  "base_url": "https://api.stripe.com",
  "auth_type": "bearer",
  "status": "live",
  "endpoint_count": 42,
  "endpoints": [
    { "method": "GET", "path": "/v1/charges", "locked": false },
    { "method": "POST", "path": "/v1/refunds", "locked": true }
  ],
  "created_at": "2026-04-22T07:00:00Z"
}`,
  },
  {
    method: "PATCH",
    path: "/api/v1/agents/{id}",
    title: "Update Agent",
    desc: "Update an agent's name, authentication settings, or locked endpoint list. Only fields provided will be updated (partial update).",
    params: [
      { name: "id", type: "string", required: true, desc: "The unique agent ID." },
      { name: "name", type: "string", required: false, desc: "New display name." },
      { name: "token", type: "string", required: false, desc: "Replacement auth token." },
      { name: "locked_paths", type: "string[]", required: false, desc: "Array of endpoint paths to lock." },
    ],
    curl: `curl -X PATCH https://api-agent-backend.onrender.com/api/v1/agents/agt_01HZXK \\
  -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Stripe Agent v2",
    "locked_paths": ["/v1/refunds", "/v1/customers"]
  }'`,
    body: `{
  "name": "Stripe Agent v2",
  "locked_paths": ["/v1/refunds", "/v1/customers"]
}`,
    response: `{
  "id": "agt_01HZXK...",
  "name": "Stripe Agent v2",
  "status": "live",
  "updated_at": "2026-04-22T09:00:00Z"
}`,
  },
  {
    method: "POST",
    path: "/api/v1/agents/{id}/chat",
    title: "Chat with Agent",
    desc: "Send a natural language message to an agent. The LLM reasons over available tools, calls the appropriate API endpoints, and returns a synthesized reply. Includes a detailed tool_calls trace for debugging.",
    params: [
      { name: "id", type: "string", required: true, desc: "The unique agent ID." },
      { name: "message", type: "string", required: true, desc: "The user's natural language message." },
      { name: "history", type: "array", required: false, desc: "Previous conversation turns for context." },
      { name: "stream", type: "boolean", required: false, desc: "If true, returns a Server-Sent Events stream (default: false)." },
    ],
    curl: `curl -X POST https://api-agent-backend.onrender.com/api/v1/agents/agt_01HZXK/chat \\
  -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "List failed payments from last week",
    "history": [],
    "stream": false
  }'`,
    body: `{
  "message": "List failed payments from last week",
  "history": [],
  "stream": false
}`,
    response: `{
  "reply": "I found 3 failed payments from last week totalling $1,240.",
  "tool_calls": [
    {
      "tool": "list_charges",
      "params": { "status": "failed", "created[gte]": 1713484800 },
      "http_method": "GET",
      "url": "https://api.stripe.com/v1/charges",
      "status_code": 200,
      "duration_ms": 243
    }
  ],
  "latency_ms": 1820
}`,
  },
  {
    method: "GET",
    path: "/api/v1/agents/{id}/logs",
    title: "Get Logs",
    desc: "Retrieve paginated request/response logs for a given agent. Useful for debugging tool call failures and monitoring API usage patterns.",
    params: [
      { name: "id", type: "string", required: true, desc: "The unique agent ID." },
      { name: "page", type: "integer", required: false, desc: "Page number (default: 1)." },
      { name: "limit", type: "integer", required: false, desc: "Logs per page, max 100 (default: 25)." },
      { name: "status_code", type: "integer", required: false, desc: "Filter by HTTP status (e.g. 500 for errors)." },
    ],
    curl: `curl "https://api-agent-backend.onrender.com/api/v1/agents/agt_01HZXK/logs?limit=10" \\
  -H "Authorization: Bearer <your-token>"`,
    body: null,
    response: `{
  "logs": [
    {
      "id": "log_abc123",
      "tool": "list_charges",
      "url": "https://api.stripe.com/v1/charges",
      "method": "GET",
      "status_code": 200,
      "duration_ms": 243,
      "timestamp": "2026-04-22T08:30:00Z"
    }
  ],
  "total": 1,
  "page": 1
}`,
  },
  {
    method: "DELETE",
    path: "/api/v1/agents/{id}",
    title: "Delete Agent",
    desc: "Permanently delete an agent and all associated data including logs, endpoint configs, and stored credentials. This action is irreversible.",
    params: [
      { name: "id", type: "string", required: true, desc: "The unique agent ID to delete." },
    ],
    curl: `curl -X DELETE https://api-agent-backend.onrender.com/api/v1/agents/agt_01HZXK \\
  -H "Authorization: Bearer <your-token>"`,
    body: null,
    response: `{
  "deleted": true,
  "id": "agt_01HZXK..."
}`,
  },
];

const errorCodes = [
  { code: 400, name: "Bad Request",           desc: "Missing or malformed request body. Check the required parameters." },
  { code: 401, name: "Unauthorized",          desc: "Missing or invalid Authorization header. Ensure your Bearer token is correct." },
  { code: 403, name: "Forbidden",             desc: "Valid token but insufficient permissions for the requested resource." },
  { code: 404, name: "Not Found",             desc: "The agent ID does not exist or belongs to another user." },
  { code: 422, name: "Unprocessable Entity",  desc: "Request body is valid JSON but fails schema validation." },
  { code: 429, name: "Rate Limited",          desc: "Too many requests. Check X-RateLimit-Reset header for retry time." },
  { code: 500, name: "Internal Server Error", desc: "Unexpected server error. Retry with exponential backoff." },
];

/* ─── Page ─────────────────────────────────────────────────────── */

const ApiReference = () => {
  const [active, setActive] = useState(0);
  const [activeTab, setActiveTab] = useState<"curl" | "body" | "response">("curl");
  const ep = endpoints[active];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-36 pb-24">
        <div className="container max-w-7xl">

          {/* ── Header ── */}
          <div className="mb-14">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">Developer Reference</p>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-6">API Reference</h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Full REST API documentation for the Beaver platform — request schemas, cURL examples, response shapes, and error codes.
            </p>
          </div>

          {/* ── Quick info strip ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="rounded-2xl border border-white/5 bg-card p-5 flex items-start gap-3">
              <Globe className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Base URL</p>
                <code className="font-mono text-sm text-foreground">api-agent-backend.onrender.com</code>
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-card p-5 flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Authentication</p>
                <code className="font-mono text-sm text-foreground">Authorization: Bearer &lt;token&gt;</code>
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-card p-5 flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Rate Limit</p>
                <code className="font-mono text-sm text-foreground">Free: 60/min · Pro: 600/min</code>
              </div>
            </div>
          </div>

          {/* ── Auth Example ── */}
          <div className="mb-12 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-primary" />
              <h2 className="font-bold">Authentication</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Obtain your API token from <strong>Dashboard → Settings → API Keys</strong>. Pass it on every request:
            </p>
            <CodeBlock language="bash" code={`curl https://api-agent-backend.onrender.com/api/v1/agents \\
  -H "Authorization: Bearer bvr_live_Abc123XYZ..."`} />
          </div>

          {/* ── Endpoints Explorer ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-16">

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 mb-4 px-1">Endpoints</p>
              {endpoints.map((e, i) => (
                <button
                  key={i}
                  onClick={() => { setActive(i); setActiveTab("curl"); }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                    active === i ? "border-primary/30 bg-primary/5" : "border-transparent hover:border-white/5 hover:bg-white/2"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <Badge method={e.method} />
                  </div>
                  <code className="text-xs font-mono text-muted-foreground">{e.path}</code>
                  <p className="text-xs text-muted-foreground/50 mt-1 truncate">{e.title}</p>
                </button>
              ))}
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-3 space-y-5">
              {/* Title row */}
              <div className="rounded-2xl border border-white/5 bg-card p-7">
                <div className="flex items-center gap-3 mb-2">
                  <Badge method={ep.method} />
                  <code className="font-mono text-sm text-foreground">{ep.path}</code>
                </div>
                <h2 className="text-xl font-bold mb-3">{ep.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{ep.desc}</p>
              </div>

              {/* Parameters */}
              <div className="rounded-2xl border border-white/5 bg-card p-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-4">Parameters</h3>
                <div className="space-y-3">
                  {ep.params.map((p, i) => (
                    <div key={i} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                      <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded mt-0.5 flex-shrink-0">{p.name}</code>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-muted-foreground/50 font-mono">{p.type}</span>
                          {p.required && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-400/10 border border-rose-400/20 px-1.5 py-0.5 rounded">required</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code tabs */}
              <div className="rounded-2xl border border-white/5 bg-card p-6">
                <div className="flex gap-1 mb-4 border-b border-white/5 pb-3">
                  {(["curl", ...(ep.body ? ["body"] : []), "response"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === tab
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground/50 hover:text-muted-foreground"
                      }`}
                    >
                      {tab === "curl" ? "cURL" : tab === "body" ? "Request Body" : "Response"}
                    </button>
                  ))}
                </div>

                {activeTab === "curl" && <CodeBlock language="bash" code={ep.curl} />}
                {activeTab === "body" && ep.body && <CodeBlock language="json" code={ep.body} />}
                {activeTab === "response" && <CodeBlock language="json" code={ep.response} />}
              </div>
            </div>
          </div>

          {/* ── Response Headers ── */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" /> Response Headers
            </h2>
            <div className="rounded-2xl border border-white/5 bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="text-left px-6 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground/40 w-1/3">Header</th>
                    <th className="text-left px-6 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground/40">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { header: "X-RateLimit-Limit", desc: "Maximum number of requests allowed per minute for your plan." },
                    { header: "X-RateLimit-Remaining", desc: "Number of requests remaining in the current rate limit window." },
                    { header: "X-RateLimit-Reset", desc: "Unix timestamp when the rate limit window resets." },
                    { header: "X-Request-Id", desc: "Unique identifier for the request. Include this when contacting support." },
                    { header: "Content-Type", desc: "Always application/json for API responses." },
                  ].map((r, i) => (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4"><code className="font-mono text-xs text-primary">{r.header}</code></td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{r.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Error Codes ── */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" /> Error Codes
            </h2>
            <div className="rounded-2xl border border-white/5 bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="text-left px-6 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground/40 w-1/6">Code</th>
                    <th className="text-left px-6 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground/40 w-1/4">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground/40">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {errorCodes.map((e, i) => (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`font-mono font-black text-xs ${e.code < 500 ? "text-amber-400" : "text-rose-400"}`}>{e.code}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-xs text-foreground">{e.name}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{e.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <CodeBlock language="json" code={`// Example error response body
{
  "error": {
    "code": 401,
    "type": "unauthorized",
    "message": "Invalid or expired Bearer token.",
    "request_id": "req_01HZ..."
  }
}`} />
            </div>
          </div>

          {/* ── SDKs / Quick links ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Code, title: "Rate Limits", body: "Free plan: 60 req/min. Pro: 600 req/min. Headers X-RateLimit-Remaining and X-RateLimit-Reset are included in every response." },
              { icon: Terminal, title: "Versioning", body: "The current API version is v1. Breaking changes are announced 90 days in advance. Pin versions with the Accept-Version: v1 request header." },
              { icon: CheckCircle2, title: "Idempotency", body: "For POST requests, supply an Idempotency-Key header to safely retry failed requests without creating duplicate resources." },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-card p-6 space-y-3">
                <card.icon className="h-5 w-5 text-primary" />
                <h3 className="font-bold">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>

          {/* ── CTA ── */}
          <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/5 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-1">Need help integrating?</h3>
              <p className="text-sm text-muted-foreground">Our team can walk you through complex integrations and custom deployment setups.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a href="mailto:support@beaver.dev" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap">
                Contact Support
              </a>
              <Link to="/docs" className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/5 transition-colors whitespace-nowrap flex items-center gap-1.5">
                View Docs <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ApiReference;
