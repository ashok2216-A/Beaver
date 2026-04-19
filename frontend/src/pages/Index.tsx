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

const tiers = [
  {
    name: "Hobby",
    price: "$0",
    desc: "Everything you need to try it out.",
    features: ["1 agent", "500 messages / mo", "Community support", "Hosted chat widget"],
    cta: "Start free",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$29",
    desc: "For makers shipping real products.",
    features: ["10 agents", "50k messages / mo", "Custom system prompts", "Email support", "Remove branding"],
    cta: "Start Pro trial",
    variant: "hero" as const,
    highlight: true,
  },
  {
    name: "Team",
    price: "$99",
    desc: "Scale across your whole team.",
    features: ["Unlimited agents", "500k messages / mo", "SSO & audit logs", "Priority support", "Dedicated infra"],
    cta: "Contact sales",
    variant: "outline" as const,
  },
];

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
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-muted-foreground/70 font-semibold text-lg">
              {["Stripe", "Notion", "Linear", "Vercel", "Supabase", "GitHub"].map((b) => (
                <span key={b} className="hover:text-foreground transition-base">{b}</span>
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

      {/* PRICING */}
      <section id="pricing" className="py-24 border-t border-border">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">Pricing</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
              Simple plans that scale with you
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Upgrade when you ship.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`relative rounded-2xl border p-8 transition-base ${
                  t.highlight
                    ? "border-primary/40 bg-gradient-card shadow-glow scale-[1.02]"
                    : "border-border bg-card hover:shadow-soft"
                }`}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow">
                    Most popular
                  </span>
                )}
                <h3 className="font-semibold text-lg">{t.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">{t.price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <Button asChild variant={t.variant} size="lg" className="mt-6 w-full">
                  <Link to="/dashboard">{t.cta}</Link>
                </Button>
                <ul className="mt-8 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
