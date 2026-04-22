import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Eye, Database, Lock, Globe, Mail } from "lucide-react";

const sections = [
  {
    id: "information-we-collect",
    icon: Database,
    title: "Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you create a Beaver account, we collect your email address, name, and authentication credentials managed securely via Clerk. We do not store your passwords directly.",
      },
      {
        subtitle: "API Specifications You Upload",
        text: "OpenAPI/Swagger files or URLs you provide are used solely to generate your agents. We process these files in-memory and do not permanently store their raw contents after agent creation.",
      },
      {
        subtitle: "Usage Data",
        text: "We collect anonymized telemetry about how features are used (e.g., number of agents created, chat messages sent) to improve the platform. This data is never linked to individual users in a personally identifiable way.",
      },
      {
        subtitle: "Log Data",
        text: "Server logs capture IP addresses, browser types, pages visited, and timestamps for security monitoring and debugging. These logs are retained for 30 days.",
      },
    ],
  },
  {
    id: "how-we-use",
    icon: Eye,
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "Providing the Service",
        text: "Your account data is used to authenticate you and personalize your experience. Agent configurations are stored to power your deployed AI agents.",
      },
      {
        subtitle: "Communications",
        text: "We may send transactional emails (password resets, billing receipts) and, with your consent, product updates and announcements. You can unsubscribe at any time.",
      },
      {
        subtitle: "Security & Fraud Prevention",
        text: "We analyze usage patterns to detect abuse, unauthorized access, and API misuse. Suspicious activity may result in account suspension.",
      },
      {
        subtitle: "Product Improvement",
        text: "Aggregated, anonymized data helps us understand which features deliver value. We never train external AI models on your private API specifications.",
      },
    ],
  },
  {
    id: "data-sharing",
    icon: Globe,
    title: "Data Sharing & Third Parties",
    content: [
      {
        subtitle: "We Do Not Sell Your Data",
        text: "Beaver does not sell, rent, or trade your personal information to third parties for marketing purposes. Full stop.",
      },
      {
        subtitle: "Service Providers",
        text: "We engage carefully vetted subprocessors: Clerk (authentication), Neon (database), Render (hosting), and Stripe (billing). Each is bound by data processing agreements.",
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose information when required by law, court order, or governmental authority, or to protect the rights, property, or safety of Beaver, our users, or the public.",
      },
    ],
  },
  {
    id: "security",
    icon: Lock,
    title: "Security",
    content: [
      {
        subtitle: "Encryption in Transit",
        text: "All data transmitted between your browser and our servers is encrypted using TLS 1.3. API endpoints are served exclusively over HTTPS.",
      },
      {
        subtitle: "Encryption at Rest",
        text: "Sensitive fields such as API keys and credentials are encrypted at rest using AES-256 before being stored in our database.",
      },
      {
        subtitle: "Access Controls",
        text: "Internal access to production systems is restricted by role-based permissions and multi-factor authentication. Access logs are audited regularly.",
      },
      {
        subtitle: "Vulnerability Disclosure",
        text: "If you discover a security vulnerability, please contact security@beaver.dev. We commit to acknowledging valid reports within 48 hours.",
      },
    ],
  },
  {
    id: "your-rights",
    icon: Shield,
    title: "Your Rights",
    content: [
      {
        subtitle: "Access & Portability",
        text: "You may request a copy of all personal data we hold about you at any time. Data exports are provided in JSON format within 30 days.",
      },
      {
        subtitle: "Correction",
        text: "You can update most account information directly from your dashboard. For corrections we cannot make automatically, contact support.",
      },
      {
        subtitle: "Deletion",
        text: "You can delete your account from Settings at any time. This permanently removes your agents, configurations, and personal data within 30 days, except where retention is legally required.",
      },
      {
        subtitle: "GDPR & CCPA",
        text: "Users in the EU and California have additional rights including the right to restrict processing and object to certain uses. Contact privacy@beaver.dev to exercise these rights.",
      },
    ],
  },
];

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-36 pb-24">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-16">
          <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">Legal</p>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-6">Privacy Policy</h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-4">
            At Beaver, your privacy is not a checkbox — it's a core design principle. This policy explains exactly what data we collect, how we use it, and the rights you have over it.
          </p>
          <p className="text-sm text-muted-foreground/50 font-medium">Last updated: April 22, 2026 · Effective: April 22, 2026</p>
        </div>

        {/* Quick Nav */}
        <div className="mb-12 rounded-2xl border border-white/5 bg-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-4">Jump to section</p>
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/5 hover:border-primary/30 hover:text-primary transition-all"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <section.icon className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>
              <div className="space-y-6 pl-12">
                {section.content.map((item, i) => (
                  <div key={i}>
                    <h3 className="font-bold text-foreground mb-2">{item.subtitle}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 flex items-start gap-4">
          <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-foreground mb-2">Questions about this policy?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Contact our privacy team at{" "}
              <a href="mailto:privacy@beaver.dev" className="text-primary hover:underline">privacy@beaver.dev</a>
              . We respond to all privacy inquiries within 5 business days.
            </p>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
