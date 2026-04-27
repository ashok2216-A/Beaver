'use client'

import { Navigation } from "@/components/landing/navigation"
import { FooterSection } from "@/components/landing/footer-section"
import { FileText, AlertTriangle, Scale, Ban, Mail, CreditCard, RefreshCw, Gavel } from "lucide-react"
import { cn } from "@/lib/utils"

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
        text: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at support@beaver.ai of any unauthorized use.",
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

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background pitch-dark">
      <Navigation />
      
      <main className="pt-32 pb-24">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-16">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4">Legal Agreement</p>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6 leading-[0.9]">Terms of <br /><span className="text-muted-foreground">Service.</span></h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-6 max-w-2xl">
              These terms govern your use of the Beaver platform, including all features, APIs, and services. Please read carefully before using the service.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
              <span>Last updated: April 22, 2026</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>Effective: April 22, 2026</span>
            </div>
          </div>

          {/* Quick Nav */}
          <div className="mb-16 p-8 rounded-3xl border border-white/5 bg-card/50 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-6">Jump to section</p>
            <div className="flex flex-wrap gap-3">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-xs font-bold px-4 py-2 rounded-xl border border-white/5 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-24">
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-32 group">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-glow-sm group-hover:scale-110 transition-transform">
                    <section.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">{section.title}</h2>
                </div>
                <div className="grid gap-8 pl-16">
                  {section.content.map((item, i) => (
                    <div key={i} className="space-y-2">
                      <h3 className="text-lg font-bold text-foreground">{item.subtitle}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-24 p-10 rounded-[2.5rem] border border-primary/20 bg-primary/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:scale-110 transition-transform duration-700">
               <Gavel className="w-32 h-32 text-primary" />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
               <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                 <Mail className="h-8 w-8" />
               </div>
               <div className="text-center md:text-left space-y-2">
                 <h3 className="text-xl font-bold">Legal Inquiries</h3>
                 <p className="text-muted-foreground leading-relaxed text-sm">
                   For legal questions or notices, contact <a href="mailto:legal@beaver.ai" className="text-primary font-bold hover:underline">legal@beaver.ai</a> or write to: 
                   Beaver Inc., 651 N Broad St, Middletown, DE 19709, USA.
                 </p>
               </div>
             </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  )
}
