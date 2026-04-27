import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { PlaygroundSection } from "@/components/landing/playground-section";
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
      <Navigation />
      <HeroSection />
      <FeaturesSection />
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
