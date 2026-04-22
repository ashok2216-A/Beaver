import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText, AlertTriangle, Scale, Ban, Mail, CreditCard, RefreshCw, Gavel } from "lucide-react";

const sections = [
  {
    id: "acceptance",
    icon: FileText,
    title: "Acceptance of Terms",
    content: [
      {
        subtitle: "Binding Agreement",
        text: "By accessing or using Beaver (\"Service\"), you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree, do not use the Service. These Terms constitute a legally binding agreement between you and Beaver.",
      },
      {
        subtitle: "Eligibility",
        text: "You must be at least 16 years of age to use the Service. By using Beaver, you represent that you meet this requirement and that you have the legal authority to enter into this agreement.",
      },
      {
        subtitle: "Updates to Terms",
        text: "We may revise these Terms at any time. We will notify users of material changes via email or an in-app notice at least 14 days before they take effect. Continued use of the Service after changes constitutes acceptance.",
      },
    ],
  },
  {
    id: "use-of-service",
    icon: Scale,
    title: "Use of the Service",
    content: [
      {
        subtitle: "License",
        text: "Subject to these Terms, Beaver grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service solely for your internal business or personal purposes.",
      },
      {
        subtitle: "Your Account",
        text: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at support@beaver.dev of any unauthorized use.",
      },
      {
        subtitle: "API Keys & Credentials",
        text: "Any API keys you store in Beaver for use with your AI agents remain your property. You grant Beaver a limited technical license to use these credentials only to execute requests on your behalf.",
      },
    ],
  },
  {
    id: "prohibited",
    icon: Ban,
    title: "Prohibited Conduct",
    content: [
      {
        subtitle: "Abuse & Misuse",
        text: "You may not use Beaver to create agents that generate illegal content, facilitate fraud, spread misinformation, conduct phishing attacks, or violate any applicable laws or regulations.",
      },
      {
        subtitle: "API Misuse",
        text: "You may not attempt to reverse-engineer, scrape, or circumvent any rate limits, access controls, or security mechanisms. Automated stress testing against the platform without prior written consent is prohibited.",
      },
      {
        subtitle: "Intellectual Property Violations",
        text: "You may not upload OpenAPI specifications that you do not have the legal right to use, or create agents designed to infringe on third-party intellectual property rights.",
      },
      {
        subtitle: "Resale Without Permission",
        text: "You may not resell, sublicense, or white-label the Beaver platform itself without entering into a separate commercial agreement with us.",
      },
    ],
  },
  {
    id: "billing",
    icon: CreditCard,
    title: "Billing & Payments",
    content: [
      {
        subtitle: "Subscriptions",
        text: "Paid plans are billed monthly or annually in advance. All prices are in USD and exclude applicable taxes. Your subscription auto-renews unless cancelled before the renewal date.",
      },
      {
        subtitle: "Refunds",
        text: "Monthly subscriptions are non-refundable. If you cancel an annual plan within 14 days of purchase and have not exceeded the free-tier limits, you may be eligible for a pro-rata refund.",
      },
      {
        subtitle: "Free Tier",
        text: "The free tier is provided as-is with no uptime guarantees. We reserve the right to modify or discontinue free tier features with 30 days' notice.",
      },
    ],
  },
  {
    id: "termination",
    icon: RefreshCw,
    title: "Termination & Suspension",
    content: [
      {
        subtitle: "By You",
        text: "You may cancel your account at any time from Settings. Upon cancellation, your agents will be deactivated immediately and your data deleted within 30 days.",
      },
      {
        subtitle: "By Beaver",
        text: "We reserve the right to suspend or terminate accounts that violate these Terms, without prior notice for severe violations (e.g., illegal activity), or with 7 days' notice for lesser violations.",
      },
      {
        subtitle: "Effect of Termination",
        text: "Upon termination, your right to use the Service ceases immediately. Provisions that by their nature survive (indemnification, limitation of liability, dispute resolution) continue to apply.",
      },
    ],
  },
  {
    id: "liability",
    icon: AlertTriangle,
    title: "Limitation of Liability",
    content: [
      {
        subtitle: "Disclaimer of Warranties",
        text: "The Service is provided \"AS IS\" and \"AS AVAILABLE\" without warranties of any kind. Beaver expressly disclaims all warranties, whether express, implied, or statutory, including merchantability and fitness for a particular purpose.",
      },
      {
        subtitle: "Limitation of Damages",
        text: "To the maximum extent permitted by law, Beaver's total aggregate liability for any claims arising from these Terms or the Service shall not exceed the greater of (a) $100 or (b) the amount paid by you in the 12 months preceding the claim.",
      },
      {
        subtitle: "AI Output Disclaimer",
        text: "AI-generated responses from your agents may contain errors or inaccuracies. Beaver is not liable for decisions made based on AI agent outputs. Always validate critical output with authoritative sources.",
      },
    ],
  },
  {
    id: "disputes",
    icon: Gavel,
    title: "Dispute Resolution",
    content: [
      {
        subtitle: "Governing Law",
        text: "These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law provisions.",
      },
      {
        subtitle: "Arbitration",
        text: "Any dispute arising from these Terms shall be resolved by binding arbitration under the AAA Commercial Arbitration Rules, conducted in English. The arbitrator's award is final and enforceable in any court with jurisdiction.",
      },
      {
        subtitle: "Class Action Waiver",
        text: "You agree to resolve disputes individually. You waive the right to participate in any class action lawsuit or class-wide arbitration against Beaver.",
      },
    ],
  },
];

const TermsOfService = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-36 pb-24">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-16">
          <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">Legal</p>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-6">Terms of Service</h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-4">
            These terms govern your use of the Beaver platform, including all features, APIs, and services. Please read carefully before using the service.
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
            <h3 className="font-bold text-foreground mb-2">Legal inquiries</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For legal questions or notices, contact{" "}
              <a href="mailto:legal@beaver.dev" className="text-primary hover:underline">legal@beaver.dev</a>
              {" "}or write to: Beaver Inc., 651 N Broad St, Middletown, DE 19709, USA.
            </p>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default TermsOfService;
