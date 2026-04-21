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
  { name: "Slack", slug: "slack", desc: "Build workspace bots that can query your APIs and bridge communications.", featured: true },
  { name: "Jira", slug: "jira", desc: "Automate ticket creation, status updates, and sprint summaries natively.", featured: true },
  { name: "Stripe", slug: "stripe", desc: "Manage refunds, check customer status, and summarize revenue in chat.", featured: true },
  { name: "Discord", slug: "discord", desc: "Deploy powerful community agents directly to your server.", featured: false },
  { name: "Shopify", slug: "shopify", desc: "E-commerce assistants that check inventory and order status.", featured: false },
  { name: "Salesforce", slug: "salesforce", desc: "Update leads and query your CRM directly from a chat interface.", featured: true },
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
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh" aria-hidden />
        <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden />
        <div className="container relative pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
              Now in public beta — free during launch
            </div>
            <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Turn any API into an{" "}
              <span className="text-gradient">AI assistant</span>{" "}
              in seconds
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Upload an OpenAPI spec, generate a chat agent that actually understands your endpoints,
              and ship it as a chatbot or API — no code required.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/dashboard">Get started free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <a href="#demo">View demo</a>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">No credit card required · 2-minute setup</p>
          </div>

          {/* Hero preview */}
          <div className="relative mx-auto mt-20 max-w-5xl animate-fade-in-up [animation-delay:200ms]">
            <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-full" aria-hidden />
            <div className="relative">
              <ChatPreview />
            </div>
          </div>

          {/* Logo strip */}
          <div className="mt-20 text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Trusted by teams building with
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-40 grayscale contrast-125 transition-all hover:opacity-100 hover:grayscale-0">
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
                  src={`https://cdn.simpleicons.org/${brand.slug}/555555`} 
                  alt={brand.name}
                  className="h-6 w-auto object-contain"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 border-t border-border">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">How it works</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
              From OpenAPI spec to live agent
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Four steps. Zero glue code. Production-ready output.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-border bg-gradient-card p-6 shadow-soft transition-base hover:-translate-y-1 hover:shadow-elevated hover:border-primary/30"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-base">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <span className="absolute top-5 right-5 text-xs font-mono text-muted-foreground/50">0{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="py-24 border-t border-border bg-secondary/30">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">Live playground</p>
              <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
                Chat with your API like it's a teammate
              </h2>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                Your agent understands every endpoint, knows when to call which one, and explains the result
                in plain English. Inspect every request and response.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  { icon: Zap, text: "Auto-generated tool definitions for every endpoint" },
                  { icon: ShieldCheck, text: "Bring your own auth — Bearer, API Key, OAuth" },
                  { icon: Code2, text: "Inspect raw request/response for every call" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                      <item.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm">{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant="hero" size="lg">
                  <Link to="/agents/builder">Try the playground <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <div className="lg:pl-8">
              <ChatPreview />
            </div>
          </div>
        </div>
      </section>

      {/* UNDER THE HOOD */}
      <section className="py-24 border-t border-border bg-gradient-to-b from-background to-secondary/20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">Architecture</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              Under the Hood
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              How we turn standard REST APIs into powerful reasoning engines.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
             <div className="rounded-2xl border border-border bg-card p-8 text-center hover:shadow-soft transition-base">
               <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary mb-6 ring-1 ring-border shadow-sm">
                 <Upload className="h-6 w-6" />
               </div>
               <h3 className="font-semibold text-lg">1. Spec Ingestion</h3>
               <p className="mt-3 text-sm text-muted-foreground leading-relaxed">We parse your OpenAPI spec, extracting semantic meaning from endpoint descriptions and schemas.</p>
             </div>
             <div className="rounded-2xl border border-primary/20 bg-primary-soft p-8 text-center hover:border-primary/40 transition-base scale-[1.02] shadow-glow">
               <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground mb-6 shadow-md">
                 <Cpu className="h-6 w-6" />
               </div>
               <h3 className="font-semibold text-lg text-primary-foreground">2. Dynamic Tool Creation</h3>
               <p className="mt-3 text-sm text-primary-foreground/80 leading-relaxed">Endpoints are dynamically compiled into native function-calling schemas that models like Gemini and Mistral seamlessly understand.</p>
             </div>
             <div className="rounded-2xl border border-border bg-card p-8 text-center hover:shadow-soft transition-base">
               <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary mb-6 ring-1 ring-border shadow-sm">
                 <Lock className="h-6 w-6" />
               </div>
               <h3 className="font-semibold text-lg">3. Secure Execution</h3>
               <p className="mt-3 text-sm text-muted-foreground leading-relaxed">When the LLM decides to call a tool, we proxy the request securely, injecting your auth headers and returning the raw result.</p>
             </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-24 border-t border-border">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">Solutions</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight">Built for any backend</h2>
              <p className="mt-4 text-lg text-muted-foreground mb-8">
                Stop hardcoding chatbot logic. Connect your existing systems and let the agent figure out how to satisfy the user intent.
              </p>
              <div className="space-y-4">
                {useCases.map((uc) => (
                  <div key={uc.id} className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:bg-secondary/20 hover:shadow-soft">
                    <div className="flex gap-4">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-base">
                        <uc.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{uc.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{uc.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="rounded-2xl border border-border bg-background p-2 shadow-elevated relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary opacity-5" aria-hidden />
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" alt="Dashboard visualization" className="rounded-xl border border-border/50 shadow-sm relative z-10 w-full object-cover aspect-video" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 border-t border-border bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Loved by developers</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
            {testimonials.map((t, idx) => (
              <div key={idx} className="rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-hover transition-base flex flex-col">
                <Quote className="h-8 w-8 text-primary/20 mb-6" />
                <p className="text-muted-foreground leading-relaxed flex-1 italic">"{t.quote}"</p>
                <div className="mt-8 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-glow">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{t.author}</h4>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 border-t border-border">
        <div className="container max-w-3xl">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} q={faq.q} a={faq.a} />
            ))}
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
                className={`group relative rounded-2xl border border-border bg-card p-6 transition-base hover:shadow-glow/10 hover:border-primary/30 ${
                  c.featured ? "md:col-span-2 md:row-span-1 shadow-soft" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/50 p-2.5 transition-base group-hover:bg-primary/10">
                    <img 
                      src={`https://cdn.simpleicons.org/${c.slug}/555555`} 
                      alt={c.name}
                      className="h-full w-full object-contain grayscale transition-base group-hover:grayscale-0"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{c.name}</h3>
                    {c.featured && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {c.desc}
                      </p>
                    )}
                  </div>
                </div>
                {!c.featured && (
                  <p className="mt-4 text-xs text-muted-foreground leading-relaxed opacity-0 group-hover:opacity-100 transition-base">
                    {c.desc}
                  </p>
                )}
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
