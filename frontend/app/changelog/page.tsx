'use client'

import { Navigation } from "@/components/landing/navigation"
import { FooterSection } from "@/components/landing/footer-section"
import { Sparkles, Zap, Shield, Bug, Rocket, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const updates = [
  {
    date: "April 22, 2026",
    version: "v2.0.0",
    title: "Beaver Engine Refactor",
    icon: Rocket,
    type: "Major",
    changes: [
      "Migrated to Next.js 14 with App Router for 40% faster page loads.",
      "Introduced the 'Beaver Engine' — a new semantic parsing layer for OpenAPI 3.1.",
      "Added support for streaming responses in the chat widget.",
      "Launched the high-fidelity dashboard with real-time analytics."
    ]
  },
  {
    date: "March 15, 2026",
    version: "v1.4.0",
    title: "Security Hardening",
    icon: Shield,
    type: "Feature",
    changes: [
      "Added Endpoint Locking to restrict agent capabilities.",
      "Implemented AES-256 encryption for all stored API secrets.",
      "Launched deep debugging logs for tool call forensic analysis."
    ]
  },
  {
    date: "February 28, 2026",
    version: "v1.3.0",
    title: "Multi-Model Support",
    icon: Sparkles,
    type: "Feature",
    changes: [
      "Added support for Mistral Large and Gemini 2.0 Flash Lite.",
      "Improved tool-calling precision by 25% using few-shot prompt injection.",
      "Optimized context window usage for long OpenAPI specifications."
    ]
  },
  {
    date: "January 10, 2026",
    version: "v1.2.0",
    title: "Performance & Reliability",
    icon: Zap,
    type: "Optimization",
    changes: [
      "Reduced cold-start latency for edge-deployed agents by 600ms.",
      "Improved error handling for malformed OpenAPI documents.",
      "Added global CDN distribution for the chat widget script."
    ]
  }
]

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-32">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="mb-20 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
              Platform Updates
            </div>
            <h1 className="text-6xl font-bold tracking-tight leading-[0.9]">
              What's <br />
              <span className="text-muted-foreground">New.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              New features, improvements, and fixes for the Beaver platform.
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-16 relative">
            <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-primary/50 via-border to-transparent hidden md:block" />
            
            {updates.map((update, i) => (
              <div key={i} className="relative md:pl-20 group">
                {/* Timeline Dot */}
                <div className="absolute left-4 top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary shadow-glow-sm z-10 hidden md:block group-hover:scale-125 transition-transform duration-300" />
                
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary">{update.date}</span>
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {update.version}
                        </span>
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight">{update.title}</h2>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest self-start md:self-center",
                      update.type === 'Major' ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {update.type}
                    </span>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-card border border-white/5 shadow-sm group-hover:shadow-glow-sm transition-all duration-500">
                    <div className="flex items-start gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <update.icon className="w-6 h-6" />
                      </div>
                      <ul className="space-y-4">
                        {update.changes.map((change, j) => (
                          <li key={j} className="flex items-start gap-3 text-muted-foreground leading-relaxed">
                            <ChevronRight className="w-4 h-4 mt-1 text-primary shrink-0 opacity-50" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Subscribe CTA */}
          <div className="mt-32 p-12 rounded-[3rem] bg-primary/5 border border-primary/10 text-center space-y-6">
            <h3 className="text-3xl font-bold">Stay updated</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Get notified about new features and technical deep-dives directly in your inbox.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <input 
                placeholder="you@example.com" 
                className="h-12 w-full sm:w-64 rounded-xl bg-background border border-border px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
              <Button className="h-12 px-8 rounded-xl font-bold shadow-glow hover:opacity-90 transition-opacity whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  )
}
