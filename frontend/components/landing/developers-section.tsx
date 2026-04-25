"use client";

import { useState, useEffect, useRef } from "react";
import { Headphones, Building2, ShoppingCart } from "lucide-react";

const solutions = [
  { 
    title: "Customer Support (Zendesk / Intercom)", 
    description: "Automatically resolve tier-1 tickets by giving your agent access to your support platform's API.",
    icon: Headphones,
  },
  { 
    title: "Internal IT Helpdesk (Jira / Slack)", 
    description: "Let employees reset passwords, query company databases, and create tickets via a simple chat interface.",
    icon: Building2,
  },
  { 
    title: "E-Commerce Concierge (Shopify / Stripe)", 
    description: "Build shopping assistants that can check order status, manage refunds, and recommend products natively.",
    icon: ShoppingCart,
  },
];

export function DevelopersSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % solutions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="solutions" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Image */}
      <div
        className={`absolute bottom-0 right-0 w-[55%] h-[85%] pointer-events-none transition-all duration-1000 delay-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Upscaled%20Image%20%2813%29-OQ2DiR3ElVsUg8kTvTL1kC5A3Q6maM.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-left-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div
          className={`mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Solutions
          </span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.9]">
            Built for any
            <br />
            <span className="text-muted-foreground">backend.</span>
          </h2>
        </div>

        {/* Description */}
        <div
          className={`max-w-xl mb-12 transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-xl text-muted-foreground leading-relaxed">
            Stop hardcoding chatbot logic. Connect your existing systems and let the agent figure out how to satisfy the user intent.
          </p>
        </div>

        {/* Solutions Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:max-w-[60%]">
          {solutions.map((solution, index) => (
            <button
              key={solution.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative text-left p-8 border transition-all duration-500 ${
                activeIndex === index 
                  ? "border-foreground/30 bg-foreground/[0.04]" 
                  : "border-foreground/10 hover:border-foreground/20"
              } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              <div className={`w-12 h-12 mb-6 flex items-center justify-center border rounded-lg transition-all duration-300 ${
                activeIndex === index 
                  ? "border-[#eca8d6] bg-[#eca8d6]/10 text-[#eca8d6]" 
                  : "border-foreground/10 text-muted-foreground"
              }`}>
                <solution.icon className="w-6 h-6" />
              </div>
              
              <h3 className="font-medium mb-3 leading-tight">{solution.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{solution.description}</p>

              {/* Active indicator */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-[#eca8d6] transition-transform duration-500 origin-left ${
                activeIndex === index ? "scale-x-100" : "scale-x-0"
              }`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
