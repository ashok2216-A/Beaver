import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Zap, 
  Terminal, 
  ShieldCheck, 
  LayoutDashboard,
  Bot
} from "lucide-react";

const changes = [
  {
    date: "April 21, 2026",
    title: "Endpoint Locking & Security Sandbox",
    description: "Added the ability to selectively lock/unlock API endpoints. This prevents the AI from using specific tools, giving you granular control over exactly what your agent can do.",
    icon: ShieldCheck,
    tags: ["Security", "Management"]
  },
  {
    date: "April 20, 2026",
    title: "Dashboard & Agents Redesign",
    description: "Separated the high-level Dashboard from the detailed Agents list. Added a search filter to the Agents view for faster navigation as your bot fleet grows.",
    icon: LayoutDashboard,
    tags: ["UI/UX"]
  },
  {
    date: "April 18, 2026",
    title: "Multi-Tenant Architecture Migration",
    description: "Complete migration to a secure, multi-tenant backend with Clerk authentication. Your agents and logs are now fully isolated and private to your account.",
    icon: Zap,
    tags: ["Infrastructure"]
  },
  {
    date: "April 15, 2026",
    title: "Public Beta Launch",
    description: "Agently Studio is officially live! Connect any OpenAPI spec and generate your first AI agent 10x faster than manually writing LangChain tools.",
    icon: Bot,
    tags: ["Launch"]
  }
];

const Changelog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="container max-w-3xl">
          <div className="mb-16">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Changelog</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              New features, improvements, and fixes for the Agently Studio platform.
            </p>
          </div>

          <div className="space-y-12">
            {changes.map((item, i) => (
              <div key={i} className="relative pl-10 border-l border-border pb-12 last:pb-0">
                <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                <div className="mb-1 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <item.icon className="h-3 w-3" />
                  {item.date.toUpperCase()}
                  <span className="text-border mx-1">·</span>
                  {item.tags.map(t => (
                    <span key={t} className="bg-secondary px-1.5 py-0.5 rounded text-[10px]">{t}</span>
                  ))}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Changelog;
