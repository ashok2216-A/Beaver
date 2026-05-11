'use client'

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Key, 
  Trash2, 
  Copy, 
  Check, 
  AlertTriangle,
  Loader2,
  Lock,
  ChevronRight,
  ShieldCheck
} from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { cn, addNotification } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface ApiKey {
  id: number
  name: string
  key?: string // Only present on creation
  created_at: string
  last_used_at: string | null
}

export default function ApiKeysPage() {
  const { getToken } = useAuth()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [deletingKeyId, setDeletingKeyId] = useState<number | null>(null)

  const fetchKeys = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/keys`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setKeys(await res.json())
    } catch (err) {
      console.error("Fetch keys failed:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [getToken])

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    setIsCreating(true)

    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newKeyName })
      })

      if (res.ok) {
        const data = await res.json()
        setCreatedKey(data)
        setKeys(prev => [data, ...prev])
        setNewKeyName("")
        toast.success("API key generated successfully")
        addNotification("🔑 API Key Generated", `"${data.name || "Access Key"}" issued securely.`)
      } else {
        toast.error("Failed to generate key")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteKey = (id: number) => {
    setDeletingKeyId(id)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-16">
      {/* Professional Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
          <Lock className="w-3 h-3" /> API Access
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground font-display">Personal API Keys</h1>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Manage your secure keys to authenticate requests to the Beaver API. These keys grant full access to your agents and their data.
        </p>
      </div>

      {/* Generation Section: Clean & Minimal */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xl font-semibold">Generate New Key</h2>
        </div>
        <Card className="rounded-2xl border-white/50 bg-white/40 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.1),0_10px_20px_-5px_rgba(0,0,0,0.04)] overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleCreateKey} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2.5 w-full">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Key Description</label>
                <Input 
                  value={newKeyName} 
                  onChange={e => setNewKeyName(e.target.value)} 
                  placeholder="e.g. Production Backend" 
                  className="h-14 rounded-2xl border-white/50 bg-white/40 px-6 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isCreating || !newKeyName.trim()}
                className="h-14 px-8 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-bold transition-all shadow-sm"
              >
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Generate Key
              </Button>
            </form>
            <p className="text-[11px] text-muted-foreground mt-4 ml-1 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Generated keys are hashed and stored securely.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* List Section: Structured & Readable */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xl font-semibold">Active Keys</h2>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
            {keys.length} active
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : keys.length > 0 ? (
          <div className="grid gap-3">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-6 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 hover:border-primary/20 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-5">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-foreground mb-0.5">{k.name}</h4>
                    <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      <span>Created {new Date(k.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {k.last_used_at && (
                        <>
                          <span className="opacity-30">•</span>
                          <span className="text-primary/60">Last used {new Date(k.last_used_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tighter border border-emerald-100">
                    Active
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 transition-all opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteKey(k.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-muted/20 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground text-sm">No active keys. Generated keys will appear here.</p>
          </div>
        )}
      </section>

      {/* Secret View Modal: High Priority */}
      <Dialog open={!!createdKey} onOpenChange={(open) => !open && setCreatedKey(null)}>
        <DialogContent className="rounded-2xl border-white/50 shadow-2xl bg-white/60 backdrop-blur-2xl p-0 overflow-hidden max-w-md">
          <div className="p-8 space-y-6">
            <DialogHeader className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-bold">Copy your secret key</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                For security, this key will only be shown <strong className="text-foreground">once</strong>. Please store it in a secure location immediately.
              </DialogDescription>
            </DialogHeader>
            
            <div className="relative group">
              <div className="p-4 rounded-xl bg-muted font-mono text-xs break-all border border-border pr-14 leading-relaxed">
                {createdKey?.key}
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute right-2 top-2 h-10 w-10 rounded-lg hover:bg-background shadow-sm border border-transparent hover:border-border"
                onClick={() => copyToClipboard(createdKey?.key || "")}
              >
                {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <Button className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold transition-all shadow-sm" onClick={() => setCreatedKey(null)}>
              I&apos;ve securely saved this key
            </Button>
          </div>
          <div className="bg-muted/50 p-4 border-t border-border">
            <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
              Security Protocol Level 4 Enforced
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {deletingKeyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold">Revoke API Key?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you absolutely sure? Any external pipelines or coordinator workflows using this token will immediately fail.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeletingKeyId(null)} className="rounded-xl">Cancel</Button>
              <Button variant="destructive" onClick={async () => {
                const keyId = deletingKeyId
                setDeletingKeyId(null)
                try {
                  const token = await getToken()
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/keys/${keyId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                  })
                  if (res.ok) {
                    setKeys(prev => prev.filter(k => k.id !== keyId))
                    toast.success("API key revoked successfully")
                    addNotification("🗑️ Key Revoked", `Revoked developer boundaries safely.`)
                  } else {
                    toast.error("Failed to revoke key")
                  }
                } catch {
                  toast.error("An error occurred")
                }
              }} className="rounded-xl font-bold px-6 shadow-glow-sm bg-rose-500 hover:bg-rose-600 text-white">
                Revoke Key
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
