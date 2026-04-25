"use client";

import { useEffect, useState, useRef } from "react";

const integrations = [
  { name: "Slack", description: "Build workspace bots that can query your APIs and bridge communications." },
  { name: "Jira", description: "Automate ticket creation, status updates, and sprint summaries natively." },
  { name: "Stripe", description: "Manage refunds, check customer status, and summarize revenue in chat." },
  { name: "Discord", description: "Deploy powerful community agents directly to your server." },
  { name: "Shopify", description: "E-commerce assistants that check inventory and order status." },
  { name: "Salesforce", description: "Update leads and query your CRM directly from a chat interface." },
  { name: "Zendesk", description: "Resolve tier-1 support tickets autonomously with API access." },
  { name: "GitHub", description: "Manage issues, pull requests, and repo stats via agent commands." },
  { name: "Postman", description: "Import collections and test your agents with your existing workflows." },
  { name: "Linear", description: "Streamline issue tracking and team updates through natural language." },
];

export function IntegrationsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="integrations" ref={sectionRef} className="relative overflow-hidden">
      {/* Header */}
      <div className="relative z-10 pt-32 lg:pt-40 text-center">
        <span className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 justify-center ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          <span className="w-12 h-px bg-foreground/20" />
          Connect Everything
          <span className="w-12 h-px bg-foreground/20" />
        </span>

        <h2 className={`text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          World-Class
          <br />
          <span className="text-muted-foreground">Ecosystem.</span>
        </h2>

        <p className={`mt-8 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto transition-all duration-1000 delay-100 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          Beaver natively bridges your existing tech stack with any LLM, turning standard docs into actionable intelligence.
        </p>
      </div>

      {/* Full-width image */}
      <div className={`relative left-1/2 -translate-x-1/2 w-screen -mt-8 transition-all duration-1000 delay-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}>
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/connection-KeJwWPQvn6l0a7C48tCARYtNEdC92H.png"
          alt=""
          aria-hidden="true"
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Integration grid */}
      <div className="relative z-10 mt-0 lg:-mt-16 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
          {integrations.map((integration, index) => (
            <div
              key={integration.name}
              className={`group relative overflow-hidden p-6 border transition-all duration-500 cursor-default ${
                hoveredIndex === index
                  ? "border-foreground bg-foreground/[0.04] scale-[1.02]"
                  : "border-foreground/10 hover:border-foreground/30"
              } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${index * 30 + 300}ms` }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <h3 className="font-medium mb-2">{integration.name}</h3>
              <p className={`text-xs text-muted-foreground leading-relaxed transition-opacity duration-300 ${
                hoveredIndex === index ? "opacity-100" : "opacity-60"
              }`}>
                {integration.description}
              </p>

              {/* Animated underline */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground/20 overflow-hidden">
                <div className={`h-full bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9] transition-all duration-500 ${
                  hoveredIndex === index ? "w-full" : "w-0"
                }`} />
              </div>
            </div>
          ))}
        </div>

        {/* Custom Integration Card */}
        <div className={`p-8 lg:p-12 border border-foreground/10 bg-foreground/[0.02] text-center mb-16 transition-all duration-1000 delay-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#eca8d6]/10 via-[#a78bfa]/10 to-[#67e8f9]/10 rounded-full flex items-center justify-center">
            <span className="text-2xl font-display text-transparent bg-clip-text bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9]">+</span>
          </div>
          <h3 className="text-xl font-display mb-2">Custom Integration</h3>
          <p className="text-muted-foreground text-sm">Bring any OpenAPI spec and we&apos;ll handle the rest</p>
        </div>
      </div>
    </section>
  );
}
