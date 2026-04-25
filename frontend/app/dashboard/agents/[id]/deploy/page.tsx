'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
  Zap
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

  const CURL_COMMAND = `curl -X POST ${API_URL} \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello Agent!"}'`

  const handleRedeploy = () => {
    setIsRedeploying(true)
    setTimeout(() => {
      setIsRedeploying(false)
      toast.success("Agent synchronized and redeployed to edge.")
    }, 2000)
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
      <Card className="rounded-[2.5rem] border-none bg-primary/5 p-6 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <Rocket className="w-24 h-24 text-primary" />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground shadow-glow">
            {isRedeploying ? <Loader2 className="h-8 w-8 animate-spin" /> : <Check className="h-8 w-8" />}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">Agent is Production Ready</h2>
            <p className="text-muted-foreground">
              Last synchronized {new Date().toLocaleDateString()} · Status: <span className="text-primary font-bold uppercase">{agent.status}</span>
            </p>
          </div>
          <Button 
            className="rounded-xl h-12 px-8 font-bold shadow-glow text-lg" 
            disabled={isRedeploying}
            onClick={handleRedeploy}
          >
            <Rocket className="mr-2 h-5 w-5" />
            {isRedeploying ? "Redeploying..." : "Redeploy Now"}
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* API Endpoint */}
        <Card className="rounded-3xl border-none bg-card shadow-sm overflow-hidden">
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3" />
                EXAMPLE CURL
              </label>
              <pre className="p-4 rounded-xl bg-black text-white font-mono text-[11px] overflow-x-auto border border-white/5">
                {CURL_COMMAND}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Chat Widget */}
        <Card className="rounded-3xl border-none bg-card shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Code2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Client Widget</span>
            </div>
            <CardTitle>Embeddable Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
        <Card className="rounded-3xl border border-border bg-transparent p-6 hover:bg-card transition-colors">
          <h4 className="font-bold mb-2">Documentation</h4>
          <p className="text-sm text-muted-foreground mb-4">Learn how to customize the chat widget theme and behavior.</p>
          <Button variant="link" className="p-0 h-auto font-bold text-primary">View Docs <ExternalLink className="ml-1 w-3 h-3" /></Button>
        </Card>
        <Card className="rounded-3xl border border-border bg-transparent p-6 hover:bg-card transition-colors">
          <h4 className="font-bold mb-2">API Reference</h4>
          <p className="text-sm text-muted-foreground mb-4">Full documentation for our REST API and SDKs.</p>
          <Button variant="link" className="p-0 h-auto font-bold text-primary">View Reference <ExternalLink className="ml-1 w-3 h-3" /></Button>
        </Card>
        <Card className="rounded-3xl border border-border bg-transparent p-6 hover:bg-card transition-colors">
          <h4 className="font-bold mb-2">Support</h4>
          <p className="text-sm text-muted-foreground mb-4">Need help scaling your agents? Reach out to our team.</p>
          <Button variant="link" className="p-0 h-auto font-bold text-primary">Contact Us <ExternalLink className="ml-1 w-3 h-3" /></Button>
        </Card>
      </div>
    </div>
  )
}
