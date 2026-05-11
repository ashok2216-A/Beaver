'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { 
  Rocket, 
  Globe, 
  Code2, 
  Check, 
  ArrowLeft, 
  Loader2, 
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function DeployPage() {
  const { id } = useParams()
  const router = useRouter()
  const { getToken } = useAuth()
  
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isRedeploying, setIsRedeploying] = useState(false)
  const [selectedLang, setSelectedLang] = useState<'curl' | 'python' | 'node' | 'react'>('curl')

  useEffect(() => {
    async function loadAgent() {
      try {
        const token = await getToken()
        if (!token) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) setAgent(await response.json())
      } catch (error) {
        console.error("Load error:", error)
      } finally {
        setLoading(false)
      }
    }
    loadAgent()
  }, [id, getToken])

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  if (!agent) return <div className="text-center py-20">Agent not found</div>

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/chat/${id}`
  const WIDGET_SCRIPT = `<script src="${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/widget.js"
  data-agent-id="${id}"
  data-theme="dark"
  defer></script>`

  const snippets = {
    curl: `curl -X POST ${API_URL} \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello Agent!"}'`,
    
    python: `import requests

url = "${API_URL}"
headers = {
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
}
data = {"message": "Hello Agent!"}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,

    node: `const axios = require('axios');

const url = "${API_URL}";
const data = { message: "Hello Agent!" };
const headers = {
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
};

axios.post(url, data, { headers })
    .then(res => console.log(res.data))
    .catch(err => console.error(err));`,

    react: `const sendMessage = async () => {
  const res = await fetch("${API_URL}", {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_TOKEN",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: "Hello Agent!" })
  });
  const data = await res.json();
  console.log(data);
};`
  }

  const highlightCode = (code: string, lang: string) => {
    // First escape HTML
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Define patterns
    const patterns = [
      { name: 'string', regex: /(".*?"|'.*?')/g, color: '#98c379' },
      { name: 'keyword', regex: /\b(import|from|as|const|let|var|require|async|await|return|fetch|method|JSON|stringify|curl|POST|GET|PATCH|DELETE)\b/g, color: '#c678dd' },
      { name: 'function', regex: /\b(print|console|log|error|then|catch|post|requests)\b/g, color: '#61afef' },
      { name: 'variable', regex: /\b(headers|data|url|response|res|err|message|json)\b/g, color: '#e06c75' }
    ];

    let result = escaped;
    // We'll use a placeholder strategy to avoid nested tags
    const placeholders: string[] = [];
    
    patterns.forEach((p, i) => {
      result = result.replace(p.regex, (match) => {
        const placeholder = `___PH_${i}_${placeholders.length}___`;
        placeholders.push(`<span style="color: ${p.color}">${match}</span>`);
        return placeholder;
      });
    });

    // Replace placeholders back
    placeholders.forEach((html, i) => {
      // Find the specific placeholder
      const ph = new RegExp(`___PH_\\d+_${i}___`);
      result = result.replace(ph, html);
    });

    return result;
  }

  const handleRedeploy = async () => {
    setIsRedeploying(true)
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "live" })
      })

      if (res.ok) {
        const updated = await res.json()
        setAgent(updated)
        toast.success("Agent synchronized and deployed to production.")
      } else {
        throw new Error("Deployment failed")
      }
    } catch (err) {
      toast.error("Failed to deploy agent")
    } finally {
      setIsRedeploying(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push(`/dashboard/agents/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Deploy Agent</h1>
          <p className="text-muted-foreground">Ship your AI to production in seconds.</p>
        </div>
      </div>

      {/* Status Banner */}
      <Card className={cn(
        "rounded-[2.5rem] border border-white/50 p-6 shadow-2xl overflow-hidden relative group transition-all duration-500 backdrop-blur-xl",
        agent.status === 'live' ? "bg-emerald-500/10" : "bg-white/40"
      )}>
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <Rocket className={cn("w-24 h-24", agent.status === 'live' ? "text-emerald-500" : "text-primary")} />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className={cn(
            "h-16 w-16 rounded-3xl flex items-center justify-center text-white shadow-glow transition-all duration-500",
            agent.status === 'live' ? "bg-emerald-500 shadow-emerald-500/20" : "bg-primary shadow-primary/20"
          )}>
            {isRedeploying ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : agent.status === 'live' ? (
              <ShieldCheck className="h-8 w-8" />
            ) : (
              <Rocket className="h-8 w-8" />
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">
              {agent.status === 'live' ? "Agent is Production Live" : "Agent is Ready for Launch"}
            </h2>
            <p className="text-muted-foreground flex items-center gap-2">
              Status: 
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                agent.status === 'live' 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                  : "bg-primary/10 text-primary border-primary/20"
              )}>
                {agent.status}
              </span>
              · Last synced {new Date().toLocaleDateString()}
            </p>
          </div>
          <Button 
            className={cn(
              "rounded-xl h-12 px-8 font-bold shadow-glow text-lg min-w-[180px]",
              agent.status === 'live' ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" : ""
            )}
            disabled={isRedeploying}
            onClick={handleRedeploy}
          >
            {isRedeploying ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Zap className="mr-2 h-5 w-5" />
            )}
            {isRedeploying ? "Processing..." : agent.status === 'live' ? "Sync & Redeploy" : "Go Live Now"}
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* API Endpoint */}
        <Card className="rounded-3xl border border-white/50 bg-white/40 backdrop-blur-xl shadow-xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Globe className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">REST API</span>
            </div>
            <CardTitle>Direct Endpoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Integrate this agent into your own frontend or backend logic via our standard REST interface.</p>
            <div className="p-3 rounded-xl bg-background border border-border flex items-center gap-2 overflow-hidden">
              <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">POST</span>
              <code className="text-xs font-mono truncate flex-1">{API_URL}</code>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(API_URL)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-fit">
                {([
                  { id: 'curl', label: 'cURL' },
                  { id: 'python', label: 'Python' },
                  { id: 'node', label: 'Node.js' },
                  { id: 'react', label: 'React' }
                ] as const).map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLang(lang.id)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                      selectedLang === lang.id 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <div className="relative group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-3 right-3 h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 z-10"
                  onClick={() => copyToClipboard(snippets[selectedLang])}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <pre 
                  className="p-5 rounded-2xl bg-[#0d0d0d] text-[#d4d4d4] font-mono text-[11px] overflow-x-auto border border-white/5 leading-relaxed min-h-[160px]"
                  dangerouslySetInnerHTML={{ __html: highlightCode(snippets[selectedLang], selectedLang) }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Widget */}
        <Card className="rounded-3xl border border-white/50 bg-white/40 backdrop-blur-xl shadow-xl overflow-hidden relative group/widget">
          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center transition-all duration-500">
            <div className="bg-card border border-border shadow-2xl rounded-3xl p-6 flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shadow-inner">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">Coming Soon</p>
              </div>
            </div>
          </div>

          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Code2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Client Widget</span>
              <span className="ml-auto bg-primary/10 text-primary text-[9px] px-2 py-0.5 rounded-full font-black tracking-tighter">BETA</span>
            </div>
            <CardTitle>Embeddable Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 filter blur-[2px] opacity-50 grayscale select-none pointer-events-none">
            <p className="text-sm text-muted-foreground">Drop this script into your HTML `{"<head>"}` or at the end of `{"<body>"}` to enable a floating chat interface.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Script Snippet</label>
                <Button variant="link" className="h-auto p-0 text-xs font-bold" onClick={() => copyToClipboard(WIDGET_SCRIPT)}>
                  Copy Snippet
                </Button>
              </div>
              <pre className="p-4 rounded-xl bg-black text-white font-mono text-[11px] overflow-x-auto border border-white/5 whitespace-pre-wrap">
                {WIDGET_SCRIPT}
              </pre>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div className="p-3 rounded-2xl bg-muted/30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Security</p>
                <p className="text-xs font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-green-500" />
                  CORS Locked
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Theme</p>
                <p className="text-xs font-semibold">Automatic</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center justify-center gap-4 py-8">
        <div className="h-px bg-border flex-1" />
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Rocket className="w-4 h-4" />
          Ready to go live?
        </div>
        <div className="h-px bg-border flex-1" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border border-white/50 bg-white/20 backdrop-blur-md p-6 hover:bg-white/40 transition-all group shadow-sm">
          <h4 className="font-bold mb-2">Documentation</h4>
          <p className="text-sm text-muted-foreground mb-4">Learn how to customize the chat widget theme and behavior.</p>
          <Button variant="link" className="p-0 h-auto font-bold text-primary" asChild>
            <Link href="/docs">
              View Docs <ExternalLink className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Button>
        </Card>
        <Card className="rounded-3xl border border-white/50 bg-white/20 backdrop-blur-md p-6 hover:bg-white/40 transition-all group shadow-sm">
          <h4 className="font-bold mb-2">API Reference</h4>
          <p className="text-sm text-muted-foreground mb-4">Full documentation for our REST API and SDKs.</p>
          <Button variant="link" className="p-0 h-auto font-bold text-primary" asChild>
            <Link href="/dashboard/api-keys">
              View Reference <ExternalLink className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Button>
        </Card>
        <Card className="rounded-3xl border border-white/50 bg-white/20 backdrop-blur-md p-6 hover:bg-white/40 transition-all group shadow-sm">
          <h4 className="font-bold mb-2">Support</h4>
          <p className="text-sm text-muted-foreground mb-4">Need help scaling your agents? Reach out to our team.</p>
          <Button variant="link" className="p-0 h-auto font-bold text-primary" asChild>
            <a href="mailto:support@beaver.ai">
              Contact Us <ExternalLink className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Button>
        </Card>
      </div>
    </div>
  )
}
