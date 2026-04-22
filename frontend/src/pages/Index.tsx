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
  Search,
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

const extraIntegrations = [
  "snowflake", "notion", "hubspot", "figma", "gitlab", "asana", "spotify", "gmail", 
  "googledrive", "googlesheets", "googlecalendar", 
  "trello", "zoom", "pagerduty", "atlassian", "linear", "intercom", "zendesk",
  "dropbox", "airtable", "webflow", "framer", "sentry", "datadog", "newrelic", "vercel"
];

const useCases = [
  { id: "support", icon: Headphones, title: "Customer Support (Zendesk / Intercom)", desc: "Automatically resolve tier-1 tickets by giving your agent access to your support platform's API." },
  { id: "internal", icon: Users, title: "Internal IT Helpdesk (Jira / Slack)", desc: "Let employees reset passwords, query company databases, and create tickets via a simple chat interface." },
  { id: "ecommerce", icon: ShoppingCart, title: "E-Commerce Concierge (Shopify / Stripe)", desc: "Build shopping assistants that can check order status, manage refunds, and recommend products natively." },
];

const testimonials = [
  {
    quote: "We connected our custom CRM API to Beaver, and within an hour we had a working Slack bot for our sales team. The dynamic tool routing is magic.",
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

const pricingTiers = [
  {
    name: "Free",
    price: "0",
    desc: "Perfect for exploring the power of agentic API tooling.",
    features: [
      "1 Active AI Agent",
      "Standard Reasoning Speed",
      "Full OpenAPI 3.0 Support",
      "Embeddable Chat Widget",
      "Community Support",
    ],
    cta: "Start Building Free",
    featured: false,
  },
  {
    name: "Pro",
    price: "29",
    desc: "For production-ready teams scaling their AI automation.",
    features: [
      "Unlimited AI Agents",
      "Priority Edge Deployment",
      "Custom Tooling Logic",
      "Extended Context Windows",
      "Priority 24/7 Support",
      "Whitelabel Dashboard",
    ],
    cta: "Go Pro Now",
    featured: true,
  },
];

const FAQItem = ({ q, a, defaultOpen = false }: { q: string, a: string, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`group relative rounded-2xl border transition-all duration-500 overflow-hidden ${
      isOpen ? "glass-premium border-primary/30 shadow-glow-sm" : "border-white/5 hover:border-white/10"
    }`}>
      <div className={`absolute inset-0 bg-primary/5 transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`} />
      
      <button 
        className="relative z-10 flex w-full items-center justify-between p-6 text-left" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-lg font-bold tracking-tight transition-colors duration-300 ${isOpen ? "text-primary" : "text-foreground"}`}>
          {q}
        </span>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
          isOpen ? "bg-primary text-primary-foreground rotate-180 shadow-glow-sm" : "bg-white/5 text-muted-foreground"
        }`}>
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>
      
      <div className={`relative z-10 overflow-hidden transition-all duration-500 ${
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      }`}>
        <div className="p-6 pt-0 text-muted-foreground/80 leading-relaxed font-medium">
          <div className="h-px w-full bg-white/5 mb-6" />
          {a}
        </div>
      </div>
    </div>
  );
};

const NeuralNode = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Logic Rings */}
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 8" className="animate-[spin_20s_linear_infinite] opacity-20" />
      <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1" strokeDasharray="10 5" className="animate-[spin_15s_linear_infinite_reverse] opacity-30" />
      
      {/* Connection Lines */}
      <line x1="50" y1="10" x2="50" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
      <line x1="50" y1="70" x2="50" y2="90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
      <line x1="10" y1="50" x2="30" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
      <line x1="70" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
      
      {/* Central Hex Core */}
      <path 
        d="M50 25L71.6506 37.5V62.5L50 75L28.3494 62.5V37.5L50 25Z" 
        fill="currentColor" 
        className="opacity-20 shadow-glow"
      />
      <circle cx="50" cy="50" r="8" fill="currentColor" className="shadow-glow" />
      
      {/* Pulsing Glow Points */}
      <circle cx="50" cy="10" r="3" fill="currentColor" className="animate-ping" />
      <circle cx="50" cy="90" r="3" fill="currentColor" className="animate-ping" />
      <circle cx="10" cy="50" r="3" fill="currentColor" className="animate-ping" />
      <circle cx="90" cy="50" r="3" fill="currentColor" className="animate-ping" />
    </svg>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-32 pb-40 overflow-hidden">
        {/* Luminous Background Mesh */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-40 shadow-[inset_0_0_100px_rgba(139,92,246,0.1)]" aria-hidden />
        <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] bg-violet-500/10 blur-[120px] rounded-full animate-slow-glow" aria-hidden />
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[140px] rounded-full animate-slow-glow" aria-hidden />
        
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center space-y-10 animate-fade-in-up">
            <div className="inline-flex items-center gap-2.5 rounded-full px-5 py-1.5 text-xs font-bold text-primary shadow-glow ring-1 ring-primary/30 glass">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Public Launch: The Future of API Tooling
            </div>
            
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[0.9] text-foreground">
              Ship any API as a <br className="hidden md:block" />
              <span className="text-gradient">Super-Agent</span>
            </h1>
            
            <p className="mt-8 text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
              Beaver is the ultimate playground for turning OpenAPI documentation into reliable, tool-calling agents for any LLM.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
              <Button asChild variant="hero" size="xl" className="h-16 px-12 text-xl shadow-glow group rounded-2xl">
                <Link to="/dashboard" className="flex items-center gap-3">
                  Start Building Free
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="h-16 px-12 text-xl glass-premium rounded-2xl border-white/5 hover:bg-white/5 transition-colors">
                <a href="#demo">View 60s Demo</a>
              </Button>
            </div>
          </div>

          {/* Logo strip moved above Chat Preview */}
          <div className="mt-20 text-center pb-20 active-logos-container group/logos">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/50 font-bold mb-10 transition-colors group-hover/logos:text-primary/70">
              Trusted by world-class engineering teams
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-10 opacity-40 grayscale contrast-125 transition-all duration-500 group-hover/logos:opacity-100 group-hover/logos:grayscale-0">
              {[
                { name: "Stripe", slug: "stripe", color: "635BFF" },
                { name: "Notion", slug: "notion", color: "000000" },
                { name: "Linear", slug: "linear", color: "5E6AD2" },
                { name: "Vercel", slug: "vercel", color: "000000" },
                { name: "Supabase", slug: "supabase", color: "3ECF8E" },
                { name: "GitHub", slug: "github", color: "181717" }
              ].map((brand) => (
                <img 
                  key={brand.name}
                  src={`https://cdn.simpleicons.org/${brand.slug}/${brand.color}`} 
                  alt={brand.name}
                  className="h-7 w-auto object-contain transition-transform duration-300 hover:scale-110"
                  loading="lazy"
                />
              ))}
            </div>
          </div>

          {/* Centered High-Fidelity Preview */}
          <div className="relative mx-auto mt-10 max-w-6xl animate-fade-in-up [animation-delay:300ms] animate-float z-20">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-600 rounded-[3rem] blur-3xl opacity-20" aria-hidden />
            <div className="relative glass-premium p-3 rounded-[3rem] shadow-2xl border-white/10 ring-1 ring-white/10">
              <div className="bg-background rounded-[2.5rem] overflow-hidden border border-white/5 shadow-inner-white">
                <ChatPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-40 relative">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-24 animate-fade-in-up">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">Core Platform</p>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter">
              Engineered for Precision
            </h2>
            <p className="mt-6 text-lg text-muted-foreground/80 leading-relaxed font-medium">
              Built for reliability, speed, and precision. Turn documentation into actions in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Bento Item 1: Large Feature */}
            <div className="md:col-span-8 group relative rounded-[2.5rem] glass-premium p-12 flex flex-col justify-between overflow-hidden hover:border-primary/40 transition-all duration-500">
               <div className="absolute inset-0 bg-spotlight opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="absolute inset-0 dot-grid opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500" />
               
               {/* Neural Mesh Background */}
               <div className="absolute -right-20 -top-20 w-[500px] h-[500px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none">
                 <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-primary">
                   <path fill="currentColor" d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.6,-31.3,86.9,-15.7,85.2,-0.9C83.6,13.8,77.1,27.6,68.4,39.6C59.7,51.6,48.8,61.8,36.2,69.2C23.6,76.6,9.3,81.1,-4.5,88.9C-18.4,96.7,-31.8,107.8,-43.8,106.1C-55.8,104.4,-66.4,89.9,-75.4,75.4C-84.4,60.9,-91.8,46.4,-94.1,31.3C-96.4,16.2,-93.6,0.5,-89.1,-14.2C-84.6,-28.9,-78.4,-42.6,-68.8,-53.8C-59.2,-65,-46.2,-73.7,-32.8,-80.9C-19.4,-88.1,-5.6,-93.8,4.5,-101.6C14.6,-109.4,29.2,-119.3,44.7,-76.4Z" transform="translate(100 100)" />
                 </svg>
               </div>

               <div className="space-y-6 relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-glow relative overflow-hidden group-hover:scale-110 transition-transform">
                    <Sparkles className="h-7 w-7 relative z-10" />
                    <div className="absolute inset-0 bg-white/20 animate-shimmer-flow" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tighter">AI Agent Generation</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-xl font-medium">
                    Our reasoning engine doesn't just call APIs—it understands the semantic intent behind every endpoint, generating high-fidelity tools and prompts automatically.
                  </p>
               </div>
                <div className="mt-16 -mx-12 -mb-12 p-12 bg-secondary/10 border-t border-white/5 relative overflow-hidden group/workflow">
                   {/* Blueprint Pattern Background */}
                   <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                   
                   <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
                     {/* SVG Connectors - Desktop only */}
                     <svg className="hidden lg:block absolute top-[41%] left-0 w-full h-20 -translate-y-1/2 -z-10 opacity-20" viewBox="0 0 800 100">
                        <path d="M100 50 C 200 50, 200 50, 300 50 S 400 50, 500 50 S 600 50, 700 50" stroke="currentColor" fill="transparent" strokeWidth="2" strokeDasharray="6 6" />
                        <circle r="3" fill="currentColor" className="animate-follow-path-1">
                          <animateMotion dur="3s" repeatCount="indefinite" path="M100 50 C 200 50, 200 50, 300 50 S 400 50, 500 50 S 600 50, 700 50" />
                        </circle>
                        <circle r="3" fill="currentColor" className="animate-follow-path-2 [animation-delay:-1.5s]">
                          <animateMotion dur="3s" repeatCount="indefinite" path="M100 50 C 200 50, 200 50, 300 50 S 400 50, 500 50 S 600 50, 700 50" />
                        </circle>
                     </svg>
                     
                     {[
                       { name: "Ingest", icon: Upload, label: "01" },
                       { name: "Analyze", icon: Search, label: "02" },
                       { name: "Synthesize", icon: Cpu, label: "03" },
                       { name: "Deploy", icon: Rocket, label: "04" }
                     ].map((step, idx) => (
                       <div key={idx} className="relative group/node flex flex-col items-center">
                         <div className="absolute -top-6 text-[10px] font-bold text-primary/40 tracking-widest">{step.label}</div>
                         <div className="h-20 w-20 rounded-2xl glass-premium border border-white/10 flex items-center justify-center relative transition-all duration-500 group-hover/node:scale-110 group-hover/node:border-primary/50 group-hover/node:shadow-glow-sm">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/node:opacity-100 transition-opacity rounded-2xl" />
                            <step.icon className="h-8 w-8 text-muted-foreground transition-colors group-hover/node:text-primary" />
                         </div>
                         <span className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/40 group-hover/node:text-primary transition-colors">{step.name}</span>
                       </div>
                     ))}
                   </div>
                </div>
            </div>

            {/* Bento Item 2: Vertical Feature */}
            <div className="md:col-span-4 group relative rounded-[2.5rem] glass-premium p-12 flex flex-col justify-between hover:border-primary/40 transition-all duration-500 overflow-hidden">
               <div className="absolute inset-0 bg-spotlight opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="absolute inset-0 dot-grid opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500" />
               
               {/* Neural Mesh Background */}
               <div className="absolute -left-20 -bottom-20 w-[400px] h-[400px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none rotate-180">
                 <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-primary">
                   <path fill="currentColor" d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.6,-31.3,86.9,-15.7,85.2,-0.9C83.6,13.8,77.1,27.6,68.4,39.6C59.7,51.6,48.8,61.8,36.2,69.2C23.6,76.6,9.3,81.1,-4.5,88.9C-18.4,96.7,-31.8,107.8,-43.8,106.1C-55.8,104.4,-66.4,89.9,-75.4,75.4C-84.4,60.9,-91.8,46.4,-94.1,31.3C-96.4,16.2,-93.6,0.5,-89.1,-14.2C-84.6,-28.9,-78.4,-42.6,-68.8,-53.8C-59.2,-65,-46.2,-73.7,-32.8,-80.9C-19.4,-88.1,-5.6,-93.8,4.5,-101.6C14.6,-109.4,29.2,-119.3,44.7,-76.4Z" transform="translate(100 100)" />
                 </svg>
               </div>
               
               <div className="space-y-6 relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-primary shadow-sm ring-1 ring-white/10 group-hover:bg-primary/10 transition-colors">
                    <Upload className="h-7 w-7" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tighter">Zero-Glue Ingestion</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">Drop any OpenAPI spec. We handle the parsing, schema validation, and context compression instantly.</p>
               </div>
               <div className="mt-12 group-hover:scale-110 transition-transform duration-700 relative z-10">
                  <div className="h-40 w-full rounded-3xl border border-white/10 bg-background/50 p-6 shadow-inner-white overflow-hidden">
                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-dashed border-white/10 flex items-center justify-center relative">
                       <Upload className="h-12 w-12 text-muted-foreground/30 group-hover:text-primary group-hover:animate-bounce transition-all duration-500" />
                       <div className="absolute inset-x-0 top-0 h-px bg-white/20 shimmer-mask animate-shimmer-flow" />
                    </div>
                  </div>
               </div>
            </div>

            {/* Bento Item 3: Deep Debugging */}
            <div className="md:col-span-6 group relative rounded-[2.5rem] glass-premium p-12 hover:border-primary/40 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-spotlight opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 dot-grid opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500" />
                
                {/* Neural Mesh Background */}
                <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none -rotate-90">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-primary">
                    <path fill="currentColor" d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.6,-31.3,86.9,-15.7,85.2,-0.9C83.6,13.8,77.1,27.6,68.4,39.6C59.7,51.6,48.8,61.8,36.2,69.2C23.6,76.6,9.3,81.1,-4.5,88.9C-18.4,96.7,-31.8,107.8,-43.8,106.1C-55.8,104.4,-66.4,89.9,-75.4,75.4C-84.4,60.9,-91.8,46.4,-94.1,31.3C-96.4,16.2,-93.6,0.5,-89.1,-14.2C-84.6,-28.9,-78.4,-42.6,-68.8,-53.8C-59.2,-65,-46.2,-73.7,-32.8,-80.9C-19.4,-88.1,-5.6,-93.8,4.5,-101.6C14.6,-109.4,29.2,-119.3,44.7,-76.4Z" transform="translate(100 100)" />
                  </svg>
                </div>

                {/* Geometric L-Brackets */}
                <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-primary/20 group-hover:border-primary/60 transition-colors duration-500" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-primary/20 group-hover:border-primary/60 transition-colors duration-500" />

                <div className="relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-primary mb-8 shadow-sm ring-1 ring-white/10">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tighter">Deep Debugging</h3>
                  <p className="mt-4 text-muted-foreground text-lg leading-relaxed font-medium">Inspect raw request/response cycles for every tool call with our built-in forensic logger.</p>
                </div>
            </div>

            {/* Bento Item 4: Instant Edge Deployment */}
            <div className="md:col-span-6 group relative rounded-[2.5rem] glass-premium p-12 hover:border-primary/40 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 dot-grid opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500" />
                
                {/* Neural Mesh Background */}
                <div className="absolute -left-20 -top-20 w-[400px] h-[400px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none rotate-90">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-primary">
                    <path fill="currentColor" d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.6,-31.3,86.9,-15.7,85.2,-0.9C83.6,13.8,77.1,27.6,68.4,39.6C59.7,51.6,48.8,61.8,36.2,69.2C23.6,76.6,9.3,81.1,-4.5,88.9C-18.4,96.7,-31.8,107.8,-43.8,106.1C-55.8,104.4,-66.4,89.9,-75.4,75.4C-84.4,60.9,-91.8,46.4,-94.1,31.3C-96.4,16.2,-93.6,0.5,-89.1,-14.2C-84.6,-28.9,-78.4,-42.6,-68.8,-53.8C-59.2,-65,-46.2,-73.7,-32.8,-80.9C-19.4,-88.1,-5.6,-93.8,4.5,-101.6C14.6,-109.4,29.2,-119.3,44.7,-76.4Z" transform="translate(100 100)" />
                  </svg>
                </div>

                {/* Geometric L-Brackets */}
                <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-primary/20 group-hover:border-primary/60 transition-colors duration-500" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-primary/20 group-hover:border-primary/60 transition-colors duration-500" />

                <div className="relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground mb-8 shadow-glow">
                    <Rocket className="h-7 w-7" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tighter">Instant Edge Deployment</h3>
                  <p className="mt-4 text-muted-foreground text-lg leading-relaxed font-medium">Ship your agents to high-performance edge endpoints or embed our battle-tested chat widget.</p>
                </div>
            </div>
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

      {/* UNDER THE HOOD: ARCHITECTURE PIPELINE */}
      <section id="architecture" className="py-40 relative overflow-hidden border-t border-white/5">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-32 anim-fade-in">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-6">Internal Architecture</p>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter">
              Under the Hood
            </h2>
            <p className="mt-8 text-xl text-muted-foreground/80 leading-relaxed font-medium">
              We turn static REST APIs into dynamic reasoning engines using a high-fidelity execution pipeline.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Desktop Connector Paths */}
            <div className="hidden lg:block absolute top-[100px] left-0 w-full h-1 z-0">
               <div className="absolute left-[30%] right-[30%] h-px bg-gradient-to-r from-primary/30 via-primary to-primary/30 shadow-glow animate-pulse" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
              {/* Step 1: Spec Ingestion */}
              <div className="group relative rounded-[2.5rem] glass-premium border border-white/5 p-10 flex flex-col transition-all duration-500 hover:border-primary/20">
                <div className="absolute -top-12 -left-4 text-8xl font-black text-white/[0.03] select-none tracking-tighter group-hover:text-primary/[0.05] transition-colors">01</div>
                <div className="absolute inset-0 dot-grid opacity-[0.03]" />
                
                <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center text-primary mb-8 shadow-sm ring-1 ring-white/10 group-hover:bg-primary/10 transition-all duration-500 group-hover:scale-110">
                  <Upload className="h-8 w-8" />
                </div>
                
                <h3 className="text-2xl font-extrabold tracking-tight mb-4">Spec Ingestion</h3>
                <p className="text-muted-foreground/80 font-medium leading-relaxed">
                  We parse your OpenAPI/Swagger specs instantly, extracting every semantic hint to build a deep structural map.
                </p>
              </div>

              {/* Step 2: Intelligence Engine */}
              <div className="group relative rounded-[2.5rem] glass-premium ring-1 ring-primary/20 p-10 flex flex-col transition-all duration-500 hover:border-primary/40 shadow-glow-sm scale-[1.05] z-20">
                <div className="absolute -top-12 -left-4 text-8xl font-black text-white/[0.03] select-none tracking-tighter group-hover:text-primary/[0.07] transition-colors">02</div>
                <div className="absolute inset-0 dot-grid opacity-[0.03]" />
                <div className="absolute inset-0 bg-spotlight opacity-[0.05]" />
                
                <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground mb-8 shadow-glow transition-all duration-500 group-hover:scale-110">
                  <Cpu className="h-8 w-8" />
                </div>
                
                <h3 className="text-2xl font-extrabold tracking-tight mb-4">Tool Synthesis</h3>
                <p className="text-muted-foreground/90 font-bold leading-relaxed">
                  Endpoints are compiled into native function-calling schemas that LLMs utilize for complex reasoning.
                </p>
              </div>

              {/* Step 3: Secure Runtime */}
              <div className="group relative rounded-[2.5rem] glass-premium border border-white/5 p-10 flex flex-col transition-all duration-500 hover:border-primary/20">
                <div className="absolute -top-12 -left-4 text-8xl font-black text-white/[0.03] select-none tracking-tighter group-hover:text-primary/[0.05] transition-colors">03</div>
                <div className="absolute inset-0 dot-grid opacity-[0.03]" />
                
                <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center text-primary mb-8 shadow-sm ring-1 ring-white/10 group-hover:bg-primary/10 transition-all duration-500 group-hover:scale-110">
                  <Lock className="h-8 w-8" />
                </div>
                
                <h3 className="text-2xl font-extrabold tracking-tight mb-4">Secure Runtime</h3>
                <p className="text-muted-foreground/80 font-medium leading-relaxed">
                  Every request is proxied through our secure edge, injecting auth headers and ensuring zero-trust execution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONNECT EVERYTHING: INTEGRATIONS HUB [MOVED HERE] */}
      <section id="integrations" className="py-40 border-t border-white/5 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-24">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-6">Connect Everything</p>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter">
              World-Class Ecosystem
            </h2>
            <p className="mt-8 text-xl text-muted-foreground/80 leading-relaxed font-medium">
              Beaver natively bridges your existing tech stack with any LLM, turning standard docs into actionable intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {connections.map((c) => (
              <div
                key={c.name}
                className="group relative rounded-[2rem] border border-white/5 bg-card/30 p-8 shadow-sm transition-all duration-500 hover:border-primary/30 hover:bg-primary/5 min-h-[160px] overflow-hidden"
              >
                <div className="absolute inset-0 bg-spotlight opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-start gap-6 relative z-10">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary/50 p-3.5 ring-1 ring-white/10 transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/10 group-hover:shadow-glow-sm">
                    <img 
                      src={c.logoUrl || `https://cdn.simpleicons.org/${c.slug}`} 
                      alt={c.name}
                      className="h-full w-full object-contain grayscale opacity-50 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:drop-shadow-glow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=222&color=fff&bold=true`;
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-extrabold text-xl tracking-tight transition-colors group-hover:text-primary">{c.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground/70 leading-relaxed font-medium line-clamp-2 transition-colors group-hover:text-muted-foreground">
                      {c.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Global Ecosystem Card */}
            <div className="rounded-[2rem] glass-premium border border-white/10 p-6 flex flex-col group hover:border-primary/30 transition-all duration-500 overflow-hidden relative">
              <div className="absolute inset-0 bg-spotlight opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 dot-grid opacity-[0.03] group-hover:opacity-[0.07]" />
              
              <div className="relative z-10 flex flex-wrap gap-2 items-center justify-center">
                {extraIntegrations.map((slug) => (
                  <div key={slug} className="h-6 w-6 transition-all duration-700 hover:scale-125 hover:rotate-12 cursor-pointer">
                    <img 
                      src={`https://cdn.simpleicons.org/${slug}`} 
                      alt={slug}
                      className="h-full w-full object-contain grayscale opacity-30 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                ))}
              </div>
              <div className="absolute bottom-4 left-0 w-full text-center">
                 <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] group-hover:text-muted-foreground transition-colors">Ecosystem Core</p>
              </div>
            </div>

            {/* More CTA Card */}
            <div className="rounded-[2rem] border border-dashed border-white/10 p-8 flex flex-col items-center justify-center text-center group hover:bg-primary/5 hover:border-primary/30 transition-all duration-500 min-h-[160px]">
              <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground/50 group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500 group-hover:scale-110">
                <ArrowRight className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-bold text-muted-foreground/40 group-hover:text-primary transition-colors tracking-wide uppercase">Custom Integration</p>
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
            <div className="md:w-1/2 w-full relative">
              {/* Luminous Glows for the image */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full animate-pulse" />
              
              <div className="group relative rounded-3xl border border-white/5 bg-background p-2 shadow-glow-sm hover:border-primary/30 transition-all duration-700 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 dot-grid opacity-[0.03] group-hover:opacity-[0.05]" />
                
                <img 
                  src="https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=800" 
                  alt="Platform Ecosystem Visualization" 
                  className="rounded-2xl border border-white/5 shadow-2xl relative z-10 w-full object-cover aspect-video group-hover:scale-105 transition-transform duration-1000" 
                />
                
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

      {/* PRICING */}
      <section id="pricing" className="py-40 relative overflow-hidden border-t border-white/5">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-24 anim-fade-in">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-6">Simple Billing</p>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter">
              Transparent Pricing
            </h2>
            <p className="mt-8 text-xl text-muted-foreground/80 leading-relaxed font-medium">
              Choose the plan that fits your current stage of AI agent development.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <div 
                key={tier.name}
                className={`group relative rounded-[2.5rem] p-12 flex flex-col transition-all duration-500 hover:-translate-y-2 ${
                  tier.featured 
                    ? "glass-premium ring-2 ring-primary/40 shadow-glow-lg" 
                    : "glass-premium border-white/5"
                }`}
              >
                <div className="absolute inset-0 bg-spotlight opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 dot-grid opacity-[0.03] group-hover:opacity-[0.05]" />
                
                <div className="relative z-10 mb-8">
                  <h3 className="text-2xl font-extrabold tracking-tighter mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tighter">${tier.price}</span>
                    <span className="text-muted-foreground font-medium">/mo</span>
                  </div>
                  <p className="mt-4 text-muted-foreground font-medium">{tier.desc}</p>
                </div>

                <div className="relative z-10 space-y-4 mb-12 flex-1">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground/90 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  asChild
                  variant={tier.featured ? "default" : "outline"}
                  className={`relative z-10 w-full h-14 rounded-2xl text-lg font-bold transition-all duration-500 overflow-hidden ${
                    tier.featured ? "shadow-glow hover:shadow-primary/40" : "hover:bg-primary/5"
                  }`}
                >
                  <Link to="/auth/signup">
                    {tier.cta}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION: SIDE-BY-SIDE DESIGN */}
      <section id="faq" className="py-40 relative overflow-hidden border-t border-white/5 bg-background">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />
        
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            {/* Left Column: Branding & Watermark */}
            <div className="lg:col-span-5 relative">
              <div className="sticky top-40">
                <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-6">Support Hub</p>
                <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-tight mb-8">
                  Answers for the <br />
                  <span className="text-gradient">Super-Agent Era</span>
                </h2>
                <p className="text-xl text-muted-foreground/80 leading-relaxed font-medium max-w-md">
                  Everything you need to know about building, deploying, and securing your AI agents with Beaver.
                </p>
                
                {/* Decorative Watermark */}
                <div className="absolute -bottom-20 -left-10 text-[10rem] font-black text-white/[0.02] select-none pointer-events-none tracking-tighter">
                  FAQ
                </div>
              </div>
            </div>

            {/* Right Column: Accordion */}
            <div className="lg:col-span-7">
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <FAQItem key={idx} q={faq.q} a={faq.a} defaultOpen={idx === 0} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* FINAL CALL TO ACTION: ELEGANT PORTAL DESIGN */}
      <section className="py-40 relative overflow-hidden bg-background">
        {/* Soft Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 blur-[140px] rounded-full pointer-events-none" />
        
        <div className="container relative z-10 px-6">
          <div className="relative mx-auto max-w-5xl group">
            <div className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-primary/[0.02] backdrop-blur-3xl p-16 md:p-24 text-center transition-all duration-700 hover:border-primary/20 shadow-2xl">
              {/* Perspective Blueprint Pattern */}
              <div 
                className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none" 
                style={{ 
                  backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', 
                  backgroundSize: '40px 40px',
                  perspective: '1000px',
                  transform: 'rotateX(60deg) translateY(-20%) scale(2)'
                }} 
              />
              
              <div className="relative z-10 max-w-2xl mx-auto space-y-10">
                <div className="space-y-6">
                  <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight text-foreground">
                    Join the developer <br />
                    <span className="text-primary italic">Super-Agent era</span>
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
                    Start building for free during our public launch phase. <br className="hidden md:block" />
                    Zero setup time, infinite possibilities.
                  </p>
                </div>

                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Button asChild size="xl" variant="hero" className="h-16 px-12 text-xl rounded-2xl shadow-glow">
                    <Link to="/dashboard" className="flex items-center gap-3">
                      Start Building Free
                      <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <div className="text-sm font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
                    No credit card required
                  </div>
                </div>
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
