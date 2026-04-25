"use client";

import { useEffect, useState, useRef } from "react";
import { FileJson, Wrench, Shield } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Spec Ingestion",
    description: "We parse your OpenAPI/Swagger specs instantly, extracting every semantic hint to build a deep structural map.",
    icon: FileJson,
  },
  {
    number: "02",
    title: "Tool Synthesis",
    description: "Endpoints are compiled into native function-calling schemas that LLMs utilize for complex reasoning.",
    icon: Wrench,
  },
  {
    number: "03",
    title: "Secure Runtime",
    description: "Every request is proxied through our secure edge, injecting auth headers and ensuring zero-trust execution.",
    icon: Shield,
  },
];

export function InfrastructureSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
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
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="architecture" ref={sectionRef} className="relative py-32 lg:py-40 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-20">
          <span className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}>
            <span className="w-12 h-px bg-foreground/20" />
            Internal Architecture
          </span>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={`text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}>
                Under the
                <br />
                <span className="text-muted-foreground">Hood.</span>
              </h2>

              <p className={`mt-8 text-xl text-muted-foreground leading-relaxed max-w-lg transition-all duration-1000 delay-100 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}>
                We turn static REST APIs into dynamic reasoning engines using a high-fidelity execution pipeline.
              </p>
            </div>

            {/* Architecture Visual */}
            <div className={`relative h-[320px] lg:h-[400px] transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/world-3i68QNWJwmO7W19ztZWbevAwJQHzYL.png"
                alt="Global network"
                className="w-full h-full object-contain object-center"
              />
            </div>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <button
              key={step.number}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`relative text-left p-8 lg:p-10 border transition-all duration-500 ${
                activeStep === index 
                  ? "border-foreground/30 bg-foreground/[0.04]" 
                  : "border-foreground/10 hover:border-foreground/20"
              } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Step number and icon */}
              <div className="flex items-center justify-between mb-6">
                <span className={`text-4xl font-display transition-colors duration-300 ${
                  activeStep === index ? "text-[#eca8d6]" : "text-foreground/20"
                }`}>
                  {step.number}
                </span>
                <div className={`w-12 h-12 flex items-center justify-center border rounded-lg transition-all duration-300 ${
                  activeStep === index 
                    ? "border-[#eca8d6] bg-[#eca8d6]/10 text-[#eca8d6]" 
                    : "border-foreground/10 text-muted-foreground"
                }`}>
                  <step.icon className="w-6 h-6" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl lg:text-3xl font-display mb-4">
                {step.title}
              </h3>

              {/* Description */}
              <p className={`text-muted-foreground leading-relaxed transition-opacity duration-300 ${
                activeStep === index ? "opacity-100" : "opacity-70"
              }`}>
                {step.description}
              </p>

              {/* Active indicator */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-[#eca8d6] transition-transform duration-500 origin-left ${
                activeStep === index ? "scale-x-100" : "scale-x-0"
              }`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
