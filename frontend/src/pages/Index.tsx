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
  Shield,
  Code2,
  ChevronDown,
  Cpu,
  Lock,
  Headphones,
  ShoppingCart,
  Users,
  Play,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatPreview } from "@/components/ChatPreview";

// Feature data
const features = [
  {
    icon: Upload,
    title: "Drop Any API Spec",
    description: "Upload OpenAPI/Swagger specs or paste a URL. We parse and understand every endpoint instantly.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description: "Automatically generate tools, prompts, and intelligent routing for your agent.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Testing",
    description: "Chat with your agent in a live playground with full request/response visibility.",
  },
  {
    icon: Rocket,
    title: "One-Click Deploy",
    description: "Ship as a hosted REST endpoint or embeddable chat widget instantly.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant with encrypted keys, isolated execution, and zero data retention.",
  },
  {
    icon: Code2,
    title: "Developer First",
    description: "Full API access, webhooks, and SDK support for seamless integration.",
  },
];

// How it works steps
const steps = [
  {
    number: "01",
    title: "Upload Your API",
    description: "Drop in your OpenAPI spec or paste a documentation URL. We handle the rest.",
  },
  {
    number: "02",
    title: "AI Generates Tools",
    description: "Our engine creates function-calling schemas optimized for LLM reasoning.",
  },
  {
    number: "03",
    title: "Deploy Anywhere",
    description: "Ship to production as an API endpoint, chat widget, or Slack bot.",
  },
];

// Testimonials
const testimonials = [
  {
    quote: "We connected our CRM API to Beaver and had a working Slack bot for our sales team within an hour. The dynamic tool routing is incredible.",
    author: "Sarah Chen",
    role: "Lead Engineer at Acme",
    avatar: "SC",
  },
  {
    quote: "The ability to drop an OpenAPI spec and get a production-ready chatbot saved us weeks of LangChain boilerplate. Highly recommended.",
    author: "David Miller",
    role: "Product Manager at TechCorp",
    avatar: "DM",
  },
  {
    quote: "Finally, a platform that understands API integration is the hard part of agentic AI. This makes exposing our backend to LLMs trivial.",
    author: "Elena Torres",
    role: "CTO at StartupX",
    avatar: "ET",
  },
];

// Pricing tiers
const pricingTiers = [
  {
    name: "Starter",
    price: "0",
    description: "Perfect for exploring and prototyping",
    features: [
      "1 AI Agent",
      "100 API calls/month",
      "OpenAPI 3.0 support",
      "Chat widget",
      "Community support",
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Pro",
    price: "49",
    description: "For teams scaling AI automation",
    features: [
      "Unlimited Agents",
      "10,000 API calls/month",
      "Priority deployment",
      "Custom domains",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large-scale deployments",
    features: [
      "Unlimited everything",
      "SLA guarantee",
      "Dedicated infrastructure",
      "Custom integrations",
      "White-label options",
      "24/7 phone support",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

// FAQ data
const faqs = [
  {
    q: "Is my API data secure?",
    a: "Yes. We never store your API responses or system prompts. All keys are encrypted at rest, and execution happens in an isolated environment with SOC 2 compliance.",
  },
  {
    q: "Which LLM models do you support?",
    a: "We support GPT-4, Claude, Gemini, and Mistral. By default, we route to the optimal model based on your use case and requirements.",
  },
  {
    q: "Can I use my own authentication?",
    a: "Absolutely. We support Bearer Tokens, API Keys, OAuth 2.0, and basic auth. You configure the credentials, we inject them securely during execution.",
  },
  {
    q: "How complex can my OpenAPI spec be?",
    a: "We support OpenAPI 3.0+ specs with up to 200 endpoints. Our engine automatically chunks and summarizes them to fit within context limits.",
  },
  {
    q: "What integrations are available?",
    a: "We natively integrate with Slack, Discord, Microsoft Teams, and more. Any REST API can be connected through our platform.",
  },
];

// Trusted by logos
const trustedBy = [
  { name: "Stripe", slug: "stripe" },
  { name: "Notion", slug: "notion" },
  { name: "Linear", slug: "linear" },
  { name: "Vercel", slug: "vercel" },
  { name: "Supabase", slug: "supabase" },
  { name: "GitHub", slug: "github" },
];

// FAQ Accordion Item
const FAQItem = ({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) => (
  <div className="border-b border-border/50 last:border-0">
    <button
      className="flex w-full items-center justify-between py-6 text-left transition-colors hover:text-primary"
      onClick={onClick}
    >
      <span className="text-lg font-semibold pr-8">{q}</span>
      <ChevronDown
        className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${
        isOpen ? "max-h-96 pb-6" : "max-h-0"
      }`}
    >
      <p className="text-muted-foreground leading-relaxed">{a}</p>
    </div>
  </div>
);

const Index = () => {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" aria-hidden="true" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/10 blur-[120px] rounded-full opacity-50"
          aria-hidden="true"
        />

        <div className="container relative z-10 max-w-6xl mx-auto px-4">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Now in Public Beta
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Turn any API into a{" "}
              <span className="text-gradient">Super-Agent</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
              Beaver transforms your OpenAPI documentation into intelligent, tool-calling AI agents. 
              No LangChain boilerplate. No custom integrations. Just results.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button asChild size="lg" className="h-14 px-8 text-base font-semibold rounded-xl shadow-glow btn-glow">
                <Link to="/dashboard" className="flex items-center gap-2">
                  Start Building Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base font-semibold rounded-xl">
                <a href="#demo" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Watch Demo
                </a>
              </Button>
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-center mb-16">
            <p className="text-sm text-muted-foreground mb-6 uppercase tracking-wider font-medium">
              Trusted by engineering teams at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-50 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-500">
              {trustedBy.map((brand) => (
                <img
                  key={brand.name}
                  src={`https://cdn.simpleicons.org/${brand.slug}/ffffff`}
                  alt={brand.name}
                  className="h-6 w-auto object-contain"
                  loading="lazy"
                />
              ))}
            </div>
          </div>

          {/* Product Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div
              className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl opacity-40"
              aria-hidden="true"
            />
            <div className="relative glass-premium rounded-2xl p-2 shadow-2xl">
              <ChatPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              Features
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Everything you need to build AI agents
            </h2>
            <p className="text-lg text-muted-foreground">
              From ingestion to deployment, we handle the complexity so you can focus on building.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl border border-border/50 bg-card/30 p-8 transition-all duration-300 hover:border-primary/30 hover:bg-card/60"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 border-t border-border/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              How It Works
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Three steps to production
            </h2>
            <p className="text-lg text-muted-foreground">
              Go from API documentation to deployed agent in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
                )}
                <div className="relative z-10">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-glow-sm">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 border-t border-border/50 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                Live Playground
              </p>
              <h2 className="text-4xl font-bold tracking-tight mb-6">
                Chat with your API like it&apos;s a teammate
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Your agent understands every endpoint, knows when to call which one, 
                and explains results in plain English. Full visibility into every request.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  { icon: Zap, text: "Auto-generated tool definitions for every endpoint" },
                  { icon: Shield, text: "Bring your own auth - Bearer, API Key, OAuth" },
                  { icon: Code2, text: "Inspect raw request/response for debugging" },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-muted-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>

              <Button asChild size="lg" className="rounded-xl">
                <Link to="/agents/builder" className="flex items-center gap-2">
                  Try the Playground
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="relative">
              <div
                className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl opacity-50"
                aria-hidden="true"
              />
              <div className="relative">
                <ChatPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 border-t border-border/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              Testimonials
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Loved by developers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-border/50 bg-card/30 p-8 transition-all duration-300 hover:border-primary/30"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-foreground/90 leading-relaxed mb-8">
                  &quot;{t.quote}&quot;
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.author}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-border/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              Pricing
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                  tier.featured
                    ? "border-primary/50 bg-primary/5 shadow-glow-sm scale-[1.02]"
                    : "border-border/50 bg-card/30 hover:border-primary/30"
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    {tier.price === "Custom" ? (
                      <span className="text-4xl font-bold">Custom</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">${tier.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={tier.featured ? "default" : "outline"}
                  className="w-full h-12 rounded-xl font-semibold"
                >
                  <Link to={tier.name === "Enterprise" ? "/contact" : "/dashboard"}>
                    {tier.cta}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 border-t border-border/50">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              FAQ
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/30 p-8">
            {faqs.map((faq, idx) => (
              <FAQItem
                key={idx}
                q={faq.q}
                a={faq.a}
                isOpen={openFaq === idx}
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 border-t border-border/50">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="relative rounded-3xl border border-primary/20 bg-primary/5 p-12 md:p-16 text-center overflow-hidden">
            {/* Background glow */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-50"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                Ready to build your first agent?
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join thousands of developers building the next generation of AI-powered applications.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="h-14 px-10 text-base font-semibold rounded-xl shadow-glow btn-glow">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    Start Building Free
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  No credit card required
                </p>
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
