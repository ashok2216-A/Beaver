'use client'

import { Navigation } from "@/components/landing/navigation"
import { FooterSection } from "@/components/landing/footer-section"
import { Calendar, User, ArrowRight, Sparkles, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

const posts = [
  {
    id: 1,
    title: "The Future of Agentic APIs",
    excerpt: "How LLMs are transforming static REST endpoints into dynamic reasoning tools.",
    date: "April 20, 2026",
    author: "Ashok",
    category: "AI",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
    icon: Sparkles
  },
  {
    id: 2,
    title: "Securing your AI Integrations",
    excerpt: "Best practices for managing API keys and secrets in the age of Agentic AI.",
    date: "April 15, 2026",
    author: "Beaver Team",
    category: "Security",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
    icon: Shield
  },
  {
    id: 3,
    title: "Optimizing Tool Call Latency",
    excerpt: "How we reduced cold-start times for edge-deployed agents by 60%.",
    date: "April 08, 2026",
    author: "Engineering",
    category: "Performance",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    icon: Zap
  }
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background pitch-dark">
      <Navigation />
      
      <main className="pt-32 pb-32">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-20 space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
              Our Blog
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-[0.9]">
              Insights from <br />
              <span className="text-muted-foreground">the Frontier.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Technical deep-dives, product updates, and our vision for the future of AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden bg-card border-white/5 hover:border-primary/20 transition-all duration-500 group flex flex-col">
                <div className="aspect-video relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="px-2 py-1 rounded-md bg-primary/20 backdrop-blur-md border border-primary/30 text-[10px] font-bold text-primary uppercase tracking-widest">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {post.author}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                    {post.excerpt}
                  </p>
                  
                  <Button variant="link" className="p-0 h-auto text-sm font-bold text-primary self-start group-hover:gap-2 transition-all">
                    Read More <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-24 p-12 rounded-[3rem] bg-card border border-white/5 text-center relative overflow-hidden group">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] transition-all group-hover:bg-primary/20" />
            <h3 className="text-3xl font-bold mb-4">Subscribe to our newsletter</h3>
            <p className="text-muted-foreground mb-8">Get the latest posts delivered to your inbox.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <input 
                placeholder="you@example.com" 
                className="h-12 w-full sm:w-64 rounded-xl bg-background border border-border px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
              <Button className="h-12 px-8 rounded-xl font-bold shadow-glow">
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
