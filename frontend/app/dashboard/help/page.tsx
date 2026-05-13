'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ExternalLink, 
  Book, 
  MessageCircle, 
  FileText, 
  Video, 
  Search, 
  LifeBuoy, 
  Zap, 
  ShieldCheck, 
  ChevronDown,
  Globe,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "What exactly is the Beaver 'Super-Agent'?",
    answer: "The Super-Agent is our unified orchestration layer. It doesn't just call APIs; it understands the context of your entire fleet of agents and can coordinate complex multi-step tasks across different services automatically."
  },
  {
    question: "How do I secure my production API keys?",
    answer: "Beaver uses enterprise-grade AES-256 encryption. We recommend creating limited-scope keys for different environments (Dev, Staging, Prod) in the API Keys settings page."
  },
  {
    question: "Which LLM models power my agents?",
    answer: "By default, Beaver uses a mixture of high-performance models including Claude 3.5 Sonnet and GPT-4o. You can customize model preferences in the Agent Configuration dashboard."
  },
  {
    question: "Can I self-host the Beaver coordinator?",
    answer: "Currently, Beaver is a managed SaaS platform. However, for enterprise customers, we offer hybrid deployment options where data stays in your VPC while the orchestration is managed by our core."
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-white to-slate-50 dark:from-white/10 dark:to-white/5 backdrop-blur-xl border-t border-white/80 dark:border-white/20 border-x border-b border-white/40 dark:border-white/10 p-12 text-center space-y-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1),0_16px_32px_-8px_rgba(0,0,0,0.05)] transition-all duration-500">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#eca8d6]/5 via-transparent to-[#67e8f9]/5 pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-white/10 border-t border-white dark:border-white/20 border-x border-b border-slate-200 dark:border-white/10 shadow-lg text-primary text-xs font-bold uppercase tracking-widest animate-in fade-in zoom-in duration-500">
          <LifeBuoy className="w-4 h-4" /> Support Center
        </div>
        <h1 className="text-5xl font-black tracking-tight text-foreground font-display">
          How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#eca8d6] to-[#a78bfa]">help you</span> today?
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explore our comprehensive documentation, watch video tutorials, or reach out to our team of AI experts.
        </p>
        
        <div className="relative max-w-xl mx-auto mt-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input 
            placeholder="Search for guides, API docs, or solutions..." 
            className="w-full h-14 bg-gradient-to-br from-white to-slate-50 dark:from-white/10 dark:to-white/5 backdrop-blur-xl border-t border-white/80 dark:border-white/20 border-x border-b border-white/40 dark:border-white/10 rounded-2xl pl-12 pr-4 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.1),inset_0_-2px_4px_rgba(0,0,0,0.02)] text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Support Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-3xl bg-white/40 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
          <CardHeader className="p-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Book className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-lg font-bold">Documentation</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Step-by-step guides on how to build, deploy, and scale your AI agents.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Button variant="outline" size="sm" className="w-full rounded-xl border-white/50 bg-white/20 hover:bg-white/40 transition-colors h-9" asChild>
              <Link href="/docs" className="inline-flex items-center justify-center">
                Explore Guides <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-white/40 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
          <CardHeader className="p-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
            <CardTitle className="text-lg font-bold">API Reference</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Technical specs for our SDKs and REST endpoints to integrate with your stack.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Button variant="outline" size="sm" className="w-full rounded-xl border-white/50 bg-white/20 hover:bg-white/40 transition-colors h-9" asChild>
              <Link href="/api-reference" className="inline-flex items-center justify-center">
                View API Specs <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-white/40 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
          <CardHeader className="p-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Video className="h-5 w-5 text-cyan-500" />
            </div>
            <CardTitle className="text-lg font-bold">Video Tutorials</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Watch our engineers walk through complex orchestration patterns and tool builds.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Button variant="outline" size="sm" className="w-full rounded-xl border-white/50 bg-white/20 hover:bg-white/40 transition-colors h-9" asChild>
              <Link href="#" className="inline-flex items-center justify-center">
                Watch Videos <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest px-3 py-1 bg-primary/5 border border-primary/10 rounded-full">
            <Sparkles className="w-3 h-3" /> Common Queries
          </div>
          <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          <p className="text-muted-foreground leading-relaxed">
            Can't find what you're looking for? Our documentation covers almost everything, but here are the highlights.
          </p>
          <div className="pt-6">
            <Button className="rounded-xl font-bold px-8 py-6 shadow-glow" asChild>
              <Link href="mailto:support@beaver.ai">
                <MessageCircle className="mr-2 h-5 w-5" />
                Ask a Question
              </Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className={cn(
                "rounded-2xl border transition-all duration-300 overflow-hidden",
                openFaq === idx 
                  ? "bg-white/60 backdrop-blur-xl border-primary/20 shadow-lg" 
                  : "bg-white/20 border-white/40 hover:bg-white/40"
              )}
            >
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-bold text-foreground pr-8">{faq.question}</span>
                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", openFaq === idx && "rotate-180")} />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-muted-foreground leading-relaxed border-t border-white/40 pt-4">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
