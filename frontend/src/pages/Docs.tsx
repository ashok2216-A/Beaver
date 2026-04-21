import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  BookOpen, 
  Terminal, 
  Shield, 
  Rocket, 
  Search,
  ChevronRight,
  Code2,
  Lock
} from "lucide-react";

const sections = [
  { 
    id: "getting-started", 
    title: "Getting Started", 
    icon: Rocket,
    content: "Upload your OpenAPI or Swagger specification file to API Studio. We support both JSON and YAML formats. Once uploaded, our engine automatically parses your endpoints and converts them into semantic tools for your AI agent."
  },
  { 
    id: "authentication", 
    title: "Authentication", 
    icon: Shield,
    content: "We support multiple authentication types including Bearer Tokens, API Keys (header-based), and Basic Auth. Configure your secrets in the Agent Settings panel. All secrets are encrypted at rest and injected into requests at runtime."
  },
  { 
    id: "endpoint-locking", 
    title: "Security & Locking", 
    icon: Lock,
    content: "Use the 'Endpoint Locking' feature to specify exactly which API tools your agent can access. Locking an endpoint removes it from the agent's reasoning toolkit, preventing unintended API calls or data exposure."
  },
  { 
    id: "deploying", 
    title: "Deployment", 
    icon: Terminal,
    content: "Agents can be deployed as hosted REST endpoints for integration into your own applications, or as embeddable chat widgets that can be dropped into any website with a single line of script."
  }
];

const Docs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-32 pb-24">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="sticky top-32 space-y-8">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Documentation</h4>
                <nav className="space-y-1">
                  {sections.map(s => (
                    <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-base">
                      <s.icon className="h-4 w-4" />
                      {s.title}
                    </a>
                  ))}
                  <a href="#" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-base">
                    <Code2 className="h-4 w-4" />
                    API Reference
                  </a>
                </nav>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1 max-w-3xl">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary mb-4">
                <BookOpen className="h-3.5 w-3.5" /> Docs v1.0
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">Documentation Hub</h1>
              <p className="text-lg text-muted-foreground">
                Learn how to build, sandbox, and deploy production-ready AI agents using your existing REST APIs.
              </p>
            </div>

            <div className="space-y-16">
              {sections.map(s => (
                <section key={s.id} id={s.id} className="scroll-mt-32">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
                      <s.icon className="h-4 w-4" />
                    </div>
                    <h2 className="text-2xl font-bold">{s.title}</h2>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                    <p>{s.content}</p>
                    <div className="mt-6 flex flex-wrap gap-4">
                      <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                        Read full guide <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-24 p-8 rounded-2xl border border-primary/20 bg-primary-soft shadow-glow">
              <h3 className="text-lg font-bold mb-2">Need more help?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Our support team is available 24/7 to help you with complex API integrations and custom agent prompts.
              </p>
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-base">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Docs;
