import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { FrameworkSection } from "@/components/landing/framework-section";
import { PlaygroundSection } from "@/components/landing/chat-section";
import { InfrastructureSection } from "@/components/landing/infrastructure-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { DevelopersSection } from "@/components/landing/developers-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { SecurityLockerSection } from "@/components/landing/security-locker-section";
import { SecuritySection } from "@/components/landing/security-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";


export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden pitch-dark bg-black">
      <style dangerouslySetInnerHTML={{
        __html: `
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #000000;
          }
          ::-webkit-scrollbar-thumb {
            background: #222222 !important;
            border-radius: 10px;
            border: 1px solid #000000;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #333333 !important;
          }
          html {
            scrollbar-width: thin;
            scrollbar-color: #222222 #000000;
          }
        `
      }} />
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <FrameworkSection />
      <PlaygroundSection />
      <InfrastructureSection />
      <IntegrationsSection />
      <DevelopersSection />
      <TestimonialsSection />
      <PricingSection />
      <SecurityLockerSection />
      <SecuritySection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
