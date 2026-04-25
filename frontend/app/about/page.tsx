'use client'

import { Navigation } from "@/components/landing/navigation"
import { FooterSection } from "@/components/landing/footer-section"
import { 
  Users, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  Heart,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const values = [
  { 
    icon: ShieldCheck, 
    title: "Security First", 
    desc: "We believe privacy and security are fundamental. We never store your API data and provide tools like Endpoint Locking to keep you in control.",
    color: "text-primary"
  },
  { 
    icon: Sparkles, 
    title: "Radical Simplicity", 
    desc: "Integration shouldn't take weeks. We aim for a '2-minute setup' for every agent, no matter how complex the backend.",
    color: "text-primary"
  },
  { 
    icon: Globe, 
    title: "Mission Driven", 
    desc: "Our goal is to bridge the gap between static REST APIs and the future of Agentic AI, making sophisticated tools accessible to everyone.",
    color: "text-primary"
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pitch-dark">
      <Navigation />
      
      <main className="pt-32 pb-24">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
              Our Mission
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9]">
              Built for the <br />
              <span className="text-muted-foreground">future of APIs.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Beaver was born out of a simple problem: AI agents are hard to build, and APIs are even harder to integrate. We're here to change that.
            </p>
          </div>

          <div className="relative rounded-[3rem] overflow-hidden mb-24 aspect-[21/9] border border-white/5 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            <img 
              src="/images/team-collab.png" 
              alt="Team collaboration" 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid gap-8 md:grid-cols-3 mb-32">
            {values.map((v, i) => (
              <div key={i} className="p-8 rounded-3xl bg-card border border-border group hover:border-primary/30 transition-all duration-500">
                <div className={cn("inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-6 group-hover:scale-110 transition-transform", v.color)}>
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>

          <Card className="border-none bg-primary/5 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700">
              <Heart className="w-40 h-40 text-primary" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <Heart className="h-10 w-10 text-primary mx-auto mb-2" />
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Join the journey</h2>
              <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                We're just getting started. If you're passionate about the intersection of APIs and LLMs, we'd love to hear from you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button className="rounded-xl h-14 px-10 text-lg font-bold shadow-glow" asChild>
                  <Link href="/sign-up">Start Building Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button variant="outline" className="rounded-xl h-14 px-10 text-lg font-bold glass-premium">
                  Contact Us
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <FooterSection />
    </div>
  )
}
