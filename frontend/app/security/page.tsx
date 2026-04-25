'use client'

import { Navigation } from "@/components/landing/navigation"
import { FooterSection } from "@/components/landing/footer-section"
import { Shield, Lock, Eye, CheckCircle2, AlertTriangle, ShieldCheck, Server, Globe, Key, Cloud } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background pitch-dark">
      <Navigation />
      
      <main className="pt-32 pb-32">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-20 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
              Trust & Safety
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-[0.9]">
              Security by <br />
              <span className="text-muted-foreground">Design.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              At Beaver, we believe privacy and security are fundamental. We never store your API data and provide tools like Endpoint Locking to keep you in control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-24">
            <Card className="p-8 border-none bg-card shadow-2xl rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Key className="w-40 h-40 text-primary" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Advanced Encryption</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All sensitive fields such as API keys and credentials are encrypted at rest using AES-256 before being stored in our database. 
                  Data in transit is protected by TLS 1.3 encryption.
                </p>
              </div>
            </Card>

            <Card className="p-8 border-none bg-card shadow-2xl rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Cloud className="w-40 h-40 text-primary" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-sm">
                  <Server className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Isolated Execution</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every agent request is proxied through our secure edge, injecting auth headers and ensuring zero-trust execution. 
                  Execution happens in an isolated environment with no persistent data storage.
                </p>
              </div>
            </Card>
          </div>

          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-primary" />
                Security Standards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "No Data Storage", desc: "We don't store your API responses or system prompts. We process your OpenAPI files in-memory during agent generation." },
                  { title: "Standard Auth Support", desc: "We support Bearer Tokens, API Keys (header-based), and basic auth. You configure the secret, we inject it securely." },
                  { title: "Access Controls", desc: "Internal access is restricted by role-based permissions and MFA. Access logs are audited regularly for suspicious activity." }
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-white/5 bg-card/50">
                    <p className="font-bold mb-2">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-12 rounded-[3rem] bg-amber-500/5 border border-amber-500/10">
              <div className="flex items-start gap-6">
                <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-amber-500 mb-4">Responsible Disclosure</h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    If you believe you have found a security vulnerability, please contact security@beaver.ai. 
                    We commit to acknowledging valid reports within 48 hours and provide attribution for all valid discoveries.
                  </p>
                  <p className="font-mono text-sm text-amber-500/80">security@beaver.ai</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  )
}
