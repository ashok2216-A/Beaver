import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Upload,
  Sparkles,
  MessageSquare,
  Rocket,
  Check,
  Zap,
  ShieldCheck,
  Code2,
  ChevronDown,
  Cpu,
  Lock,
  Headphones,
  ShoppingCart,
  Users,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatPreview } from "@/components/ChatPreview";

const features = [
  { icon: Upload, title: "Upload any API", desc: "Drop in an OpenAPI/Swagger spec or paste a URL — we parse every endpoint instantly." },
  { icon: Sparkles, title: "AI agent generation", desc: "We auto-generate tools, prompts, and routing so your agent works on the first try." },
  { icon: MessageSquare, title: "Test in real chat", desc: "Iterate in a ChatGPT-style playground with full request/response visibility." },
  { icon: Rocket, title: "One-click deploy", desc: "Ship as a hosted REST endpoint or embeddable chat widget in a single click." },
];

const connections = [
  { 
    name: "Slack", 
    slug: "slack", 
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
    desc: "Build workspace bots that can query your APIs and bridge communications.", 
    featured: true 
  },
  { name: "Jira", slug: "jira", desc: "Automate ticket creation, status updates, and sprint summaries natively.", featured: true },
  { name: "Stripe", slug: "stripe", desc: "Manage refunds, check customer status, and summarize revenue in chat.", featured: true },
  { name: "Discord", slug: "discord", desc: "Deploy powerful community agents directly to your server.", featured: false },
  { name: "Shopify", slug: "shopify", desc: "E-commerce assistants that check inventory and order status.", featured: false },
  { 
    name: "Salesforce", 
    slug: "salesforce", 
    logoUrl: "https://www.vectorlogo.zone/logos/salesforce/salesforce-icon.svg",
    desc: "Update leads and query your CRM directly from a chat interface.", 
    featured: true 
  },
  { name: "Zendesk", slug: "zendesk", desc: "Resolve tier-1 support tickets autonomously with API access.", featured: false },
  { name: "GitHub", slug: "github", desc: "Manage issues, pull requests, and repo stats via agent commands.", featured: false },
  { name: "Postman", slug: "postman", desc: "Import collections and test your agents with your existing workflows.", featured: false },
  { name: "Linear", slug: "linear", desc: "Streamline issue tracking and team updates through natural language.", featured: false },
];

const useCases = [
  { id: "support", icon: Headphones, title: "Customer Support (Zendesk / Intercom)", desc: "Automatically resolve tier-1 tickets by giving your agent access to your support platform's API." },
  { id: "internal", icon: Users, title: "Internal IT Helpdesk (Jira / Slack)", desc: "Let employees reset passwords, query company databases, and create tickets via a simple chat interface." },
  { id: "ecommerce", icon: ShoppingCart, title: "E-Commerce Concierge (Shopify / Stripe)", desc: "Build shopping assistants that can check order status, manage refunds, and recommend products natively." },
];

const testimonials = [
  {
    quote: "We connected our custom CRM API to Agently Studio, and within an hour we had a working Slack bot for our sales team. The dynamic tool routing is magic.",
    author: "Sarah J.",
    role: "Lead Engineer",
  },
  {
    quote: "The ability to just drop an OpenAPI spec and get a production-ready chatbot saved us weeks of LangChain boilerplate. Highly recommended.",
    author: "David M.",
    role: "Product Manager",
  },
  {
    quote: "Finally, a platform that understands that the hard part of agentic AI is the API integration. This makes exposing our backend to LLMs trivial.",
    author: "Elena T.",
    role: "CTO",
  },
];

const faqs = [
  { q: "Is my API data secure?", a: "Yes. We don't store your API responses or system prompts. All keys are encrypted at rest, and execution happens in an isolated environment." },
  { q: "Which LLM models do you use?", a: "By default, we route to Gemini 2.0 Flash and Mistral Large depending on your preference, providing an optimal balance of speed and reasoning." },
  { q: "Can I use my own Auth?", a: "Absolutely. We support Bearer Tokens, API Keys (header-based), and basic auth. You configure the secret, we inject it during execution." },
  { q: "How complex can my OpenAPI spec be?", a: "We support OpenAPI 3.0+ specs with up to 200 endpoints. Our engine automatically chunks and summarizes them to fit within context limits." },
];

const FAQItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border py-4">
      <button 
        className="flex w-full items-center justify-between text-left text-lg font-medium transition-base hover:text-primary" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {q}
        <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
      </button>
      <div className={`mt-2 text-muted-foreground leading-relaxed overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
        {a}
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <div className="dark min-h-screen bg-zinc-950 selection:bg-primary/20 text-foreground selection:text-primary">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-32 overflow-hidden">
        {/* Radiant Background Elements */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-40 pointer-events-none" aria-hidden />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-primary/10 blur-[140px] rounded-full animate-slow-glow pointer-events-none" aria-hidden />
        
        <div className="container relative z-10">
          <div className="mx-auto max-w-5xl text-center space-y-10 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full glass-premium px-5 py-2 text-sm font-bold text-primary shadow-glow ring-1 ring-white/10">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              Public Beta Launching Today
            </div>
            
            <h1 className="text-7xl md:text-[9rem] font-black tracking-tighter leading-[0.8] text-white">
              Turn APIs into <br />
              <span className="text-gradient">Super-Agents</span>
            </h1>
            
            <p className="mt-8 text-xl md:text-3xl text-foreground/50 leading-relaxed max-w-3xl mx-auto font-medium">
              The world's first engine that understands your OpenAPI documentation and builds production-ready agents instantly.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button asChild variant="hero" size="xl" className="h-16 px-12 text-xl font-black shadow-glow group rounded-2xl">
                <Link to="/dashboard" className="flex items-center gap-3">
                  Start Building Free
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="h-16 px-12 text-xl font-bold glass-premium rounded-2xl border-white/10 hover:bg-white/5 transition-all">
                <a href="#demo">Explore Demo</a>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto mt-32 max-w-7xl animate-fade-in-up [animation-delay:400ms] animate-float-pro">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-[3.5rem] blur-3xl opacity-20" aria-hidden />
            <div className="relative glass-premium p-3 rounded-[3.5rem] shadow-2xl">
              <div className="bg-zinc-950 rounded-[3rem] overflow-hidden border border-white/5">
                <ChatPreview />
              </div>
            </div>
          </div>

          <div className="mt-40 text-center animate-fade-in [animation-delay:800ms]">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-white/20 mb-12">
              Empowering developers at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-20 gap-y-12 grayscale opacity-30 hover:opacity-100 hover:grayscale-0 transition-all duration-700">
              {[
                { name: "Stripe", slug: "stripe" },
                { name: "Notion", slug: "notion" },
                { name: "Linear", slug: "linear" },
                { name: "Vercel", slug: "vercel" },
                { name: "Supabase", slug: "supabase" },
                { name: "GitHub", slug: "github" }
              ].map((brand) => (
                <img 
                  key={brand.name}
                  src={`https://cdn.simpleicons.org/${brand.slug}/ffffff`} 
                  alt={brand.name}
                  className="h-9 w-auto object-contain transition-transform hover:scale-110"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-32 relative">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Platform Capabilities
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to turn standard REST APIs into powerful reasoning engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 max-w-7xl mx-auto">
            {/* Bento Item 1 - Large (Primary Feature) */}
            <div className="md:col-span-4 rounded-[2.5rem] glass-premium p-12 flex flex-col justify-between group hover:border-primary/50 transition-all duration-700 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl -translate-y-32 translate-x-32 group-hover:bg-primary/10 transition-colors" />
               
               <div className="space-y-6 relative z-10">
                  <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter">AI Agent Generation</h3>
                  <p className="text-foreground/50 text-xl leading-relaxed max-w-xl">Our reasoning engine auto-generates tools, proprietary prompts, and semantic routing so your agent works on the first try with zero glue code.</p>
               </div>
               
               {/* Mockup: Semantic Reasoning Flow */}
               <div className="mt-16 -mx-12 -mb-12 p-10 bg-zinc-950/50 border-t border-white/5 relative">
                  <div className="flex items-center gap-6 overflow-hidden">
                    <div className="p-4 rounded-xl border border-white/10 bg-zinc-900 shadow-obsidian shrink-0">
                      <div className="h-2 w-16 bg-primary/40 rounded-full mb-3" />
                      <div className="h-2 w-10 bg-white/10 rounded-full" />
                    </div>
                    <div className="h-px w-12 bg-gradient-to-r from-primary to-transparent shrink-0" />
                    <div className="p-5 rounded-2xl border-2 border-primary/50 bg-primary/10 shadow-glow shrink-0 animate-pulse">
                        <div className="h-3 w-24 bg-primary rounded-full mb-2" />
                        <div className="h-2 w-32 bg-primary/40 rounded-full" />
                    </div>
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-primary to-transparent shrink-0" />
                    <div className="p-4 rounded-xl border border-white/10 bg-zinc-900 shadow-obsidian shrink-0 opacity-40">
                      <div className="h-2 w-20 bg-white/20 rounded-full mb-3" />
                      <div className="h-2 w-12 bg-white/10 rounded-full" />
                    </div>
                  </div>
               </div>
            </div>

            {/* Bento Item 2 - Secondary (Supporting Feature) */}
            <div className="md:col-span-2 rounded-[2.5rem] glass-premium p-10 flex flex-col justify-between group hover:border-primary/50 transition-all duration-500">
               <div className="space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                    <Upload className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Spec Ingestion</h3>
                  <p className="text-foreground/50 leading-relaxed">Drop in an OpenAPI spec—JSON or YAML—and we parse every endpoint instantly.</p>
               </div>
               
               {/* Mockup: Mini Code Editor */}
               <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-950 p-5 font-mono text-[10px] space-y-2.5 overflow-hidden">
                   <div className="flex gap-2">
                     <span className="text-purple-400">openapi</span>: <span className="text-emerald-400">"3.0.0"</span>
                   </div>
                   <div className="flex gap-2">
                     <span className="text-purple-400">info</span>:
                   </div>
                   <div className="pl-4 flex gap-2">
                     <span className="text-purple-400">title</span>: <span className="text-emerald-400">"Payment API"</span>
                   </div>
                   <div className="flex gap-2">
                     <span className="text-purple-400">paths</span>:
                   </div>
                   <div className="pl-4 flex gap-2 opacity-50">/charges:</div>
                   <div className="pl-8 flex gap-2 opacity-30">get:</div>
               </div>
            </div>

            {/* Bento Item 3 - Small */}
            <div className="md:col-span-3 rounded-[2.5rem] glass-premium p-10 group hover:border-primary/50 transition-all duration-500 flex flex-col justify-center">
                <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-3">Test in real chat</h3>
                <p className="text-foreground/50 leading-relaxed">Iterate in a high-fidelity playground with full request/response visibility.</p>
            </div>

            {/* Bento Item 4 - Small */}
            <div className="md:col-span-3 rounded-[2.5rem] glass-premium p-10 group hover:border-primary/50 transition-all duration-500 flex flex-col justify-center">
                <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mb-6 shadow-glow group-hover:scale-110 transition-transform">
                  <Rocket className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-3">One-click deploy</h3>
                <p className="text-foreground/50 leading-relaxed">Ship as a hosted REST endpoint or embeddable chat widget in a single click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO SECTION */}
      <section id="demo" className="py-32 border-y border-white/5 bg-zinc-900/40 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container relative z-10">
          <div className="grid gap-20 lg:grid-cols-2 items-center">
            <div>
              <p className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-4">Live playground</p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] mb-6">
                Chat with your API like <br/> it's a teammate
              </h2>
              <p className="text-xl text-foreground/50 leading-relaxed mb-10">
                Agently understands every endpoint, knows when to call which one, and explains results
                in plain English. No more hardcoding bot logic.
              </p>
              <ul className="space-y-6">
                {[
                  { icon: Zap, text: "Auto-generated tool definitions" },
                  { icon: ShieldCheck, text: "Production-ready Auth (OAuth, Bearer)" },
                  { icon: Code2, text: "Raw request/response inspection" },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-4 group">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-primary border border-white/10 group-hover:bg-primary group-hover:text-white transition-all">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span className="font-bold text-foreground/70">{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-12">
                <Button asChild variant="hero" size="xl" className="h-14 px-10 text-lg font-black rounded-2xl group">
                  <Link to="/agents/builder" className="flex items-center gap-3">
                    Try it now
                    <ArrowRight className="h-5 w-5 transition-all group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="lg:pl-10">
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 blur-2xl rounded-[3rem] opacity-30" />
                <div className="relative glass-premium p-1.5 rounded-[3rem] shadow-2xl border-white/10">
                   <div className="bg-zinc-950 rounded-[2.8rem] overflow-hidden border border-white/5">
                      <ChatPreview />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UNDER THE HOOD */}
      <section className="py-32 border-t border-white/5 bg-zinc-950 relative overflow-hidden">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <p className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Architecture</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight text-white">
              Built for speed. <br/> Engineered for reasoning.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
             <div className="rounded-3xl glass-premium p-10 text-center hover:border-white/20 transition-all group">
               <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-primary mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                 <Upload className="h-8 w-8" />
               </div>
               <h3 className="font-black text-xl mb-4 text-white">1. Spec Ingestion</h3>
               <p className="text-foreground/50 leading-relaxed italic">We parse your OpenAPI spec, extracting semantic meaning from every schema and endpoint.</p>
             </div>
             <div className="rounded-3xl glass-premium p-10 text-center border-primary/30 ring-1 ring-primary/20 shadow-glow scale-105 relative z-20 bg-primary/5">
               <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white mb-8 shadow-glow-lg animate-pulse">
                 <Cpu className="h-8 w-8" />
               </div>
               <h3 className="font-black text-2xl mb-4 text-white">2. Dynamic Synthesis</h3>
               <p className="text-white/70 leading-relaxed font-bold">Endpoints are dynamically compiled into native tool-calls that models understand flawlessly.</p>
             </div>
             <div className="rounded-3xl glass-premium p-10 text-center hover:border-white/20 transition-all group">
               <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-primary mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                 <Lock className="h-8 w-8" />
               </div>
               <h3 className="font-black text-xl mb-4 text-white">3. Secure Isolation</h3>
               <p className="text-foreground/50 leading-relaxed italic">Models trigger tool-calls via our secure proxy, injecting your proprietary auth headers safely.</p>
             </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-32 border-t border-white/5 bg-zinc-900/20">
        <div className="container max-w-7xl">
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="md:w-1/2 space-y-8">
              <p className="text-sm font-black text-primary uppercase tracking-[0.3em]">Solutions</p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] text-white">Built for <br/> production backends</h2>
              <p className="text-xl text-foreground/50 leading-relaxed font-medium">
                Stop hardcoding deterministic chatbot logic. Connect your core systems and let reasoning-first agents navigate your APIs.
              </p>
              <div className="space-y-4 pt-4">
                {useCases.map((uc) => (
                  <div key={uc.id} className="group relative rounded-[2rem] glass-premium p-6 transition-all hover:bg-primary/5 hover:border-primary/30">
                    <div className="flex gap-6 items-center">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-primary border border-white/10 group-hover:bg-primary group-hover:text-white transition-all">
                        <uc.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{uc.title}</h3>
                        <p className="text-foreground/50 font-medium group-hover:text-foreground/70 transition-colors">{uc.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 w-full relative">
              <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-[3rem] opacity-30" />
              <div className="rounded-[3rem] glass-premium p-2 shadow-2xl relative z-10 border-white/5">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200" 
                  alt="Dashboard visualization" 
                  className="rounded-[2.8rem] border border-white/5 shadow-2xl w-full object-cover aspect-video grayscale hover:grayscale-0 transition-all duration-700" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ & TESTIMONIALS SPLIT */}
      <section id="faq" className="py-32 border-t border-white/5 bg-zinc-950">
        <div className="container max-w-7xl">
          <div className="grid lg:grid-cols-5 gap-20">
            <div className="lg:col-span-2 space-y-12">
               <div>
                 <p className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Support</p>
                 <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-6">Frequently <br/> Asked Questions</h2>
                 <p className="text-lg text-foreground/50 font-medium italic">Everything you need to know about the platform.</p>
               </div>
               <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <FAQItem key={idx} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-3">
              <div className="text-center md:text-left mb-12">
                <p className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Wall of Love</p>
                <h2 className="text-4xl font-black tracking-tighter text-white">Loved by AI Engineers</h2>
              </div>
              <div className="grid gap-6">
                {testimonials.map((t, idx) => (
                  <div key={idx} className="rounded-[2rem] glass-premium p-8 hover:bg-white/5 transition-all group border-white/5">
                    <Quote className="h-10 w-10 text-primary/30 mb-6 group-hover:text-primary transition-colors" />
                    <p className="text-xl text-foreground/70 leading-relaxed font-black tracking-tight mb-8">"{t.quote}"</p>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-black shadow-glow">
                        {t.author.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-white">{t.author}</h4>
                        <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS HUB */}
      <section id="integrations" className="py-24 border-t border-border bg-secondary/10">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">Ecosystem</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
              Connect to any API
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Agently Studio turns any documentation into a functional tool. 
              Works with your existing stack out of the box.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {connections.map((c) => (
              <div
                key={c.name}
                className={`group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-elevated hover:border-primary/20 hover:bg-primary/5 ${
                  c.featured ? "md:col-span-2 md:row-span-1" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/30 p-2.5 transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110">
                    <img 
                      src={c.logoUrl || `https://cdn.simpleicons.org/${c.slug}`} 
                      alt={c.name}
                      className="h-full w-full object-contain grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:drop-shadow-glow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random&color=fff&bold=true`;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg transition-colors group-hover:text-primary">{c.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground/80 leading-relaxed line-clamp-3">
                      {c.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* placeholder for 'More' */}
            <div className="rounded-2xl border border-dashed border-border p-6 flex flex-col items-center justify-center text-center group hover:bg-secondary/20 transition-base">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-base">
                <ArrowRight className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground">Add your own API</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-12 md:p-16 text-center shadow-glow">
            <div className="absolute inset-0 grid-pattern opacity-20" aria-hidden />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-primary-foreground">
                Ship your first AI agent today
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-xl mx-auto">
                Free during beta. No credit card required. Up and running in under 2 minutes.
              </p>
              <div className="mt-8">
                <Button asChild size="xl" variant="secondary">
                  <Link to="/dashboard">Get started free <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
