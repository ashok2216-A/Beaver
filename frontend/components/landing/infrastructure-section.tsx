"use client";

import { useEffect, useState, useRef } from "react";
import { FileJson, Wrench, Shield, Settings, Layers, Timer, Database, ShieldCheck, Zap } from "lucide-react";

// ─── Architecture Diagram Visual ───────────────────────────────────────

function ArchitectureDiagramVisual() {
  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[400px] flex items-center justify-center p-2 md:p-4 font-mono text-[9px] md:text-[10px]">
      <div className="w-full max-w-[900px] flex flex-col md:flex-row gap-6 md:gap-12 items-stretch relative">
        
        {/* Left Side: Your Environment */}
        <div className="relative flex-1 rounded-xl border border-dashed border-[#10b981]/50 p-6 flex flex-col gap-4">
          <span className="absolute -top-3 left-6 bg-background px-2 text-[#10b981] font-bold tracking-widest">YOUR ENVIRONMENT</span>
          
          {/* YOUR PLATFORM */}
          <div className="flex-1 rounded-lg border border-[#10b981]/80 bg-[#10b981]/5 p-5 flex flex-col relative">
            <span className="text-[#10b981] font-bold tracking-widest text-center mb-6">YOUR PLATFORM</span>
            
            <div className="flex gap-4 h-full">
              {/* Workflow Box */}
              <div className="flex-[1.5] rounded border border-[#10b981]/40 bg-[#10b981]/10 p-4 flex flex-col">
                 <div className="text-center text-[#10b981]/80 mb-4">OpenAPI Schema</div>
                 <div className="space-y-3 flex-1 flex flex-col justify-center">
                   <div className="w-full py-2 border border-yellow-500/40 bg-yellow-500/10 rounded flex items-center justify-center text-yellow-500/90 whitespace-nowrap">REST API</div>
                   <div className="w-full py-2 border border-yellow-500/40 bg-yellow-500/10 rounded flex items-center justify-center text-yellow-500/90 whitespace-nowrap">GraphQL API</div>
                 </div>
              </div>

              {/* Workers Box */}
              <div className="flex-1 flex flex-col justify-center gap-8 relative">
                <div className="flex flex-col items-center">
                  <Settings className="w-5 h-5 text-[#10b981] mb-1" />
                  <span className="text-muted-foreground whitespace-nowrap">Custom Agent</span>
                </div>
                <div className="flex flex-col items-center">
                  <Settings className="w-5 h-5 text-[#10b981] mb-1" />
                  <span className="text-muted-foreground whitespace-nowrap">Chat Widget</span>
                </div>

                {/* Bracket connecting the two workers */}
                <div className="hidden md:block absolute -right-[44px] top-[25%] bottom-[25%] w-[44px] border-r border-t border-b border-foreground/30 rounded-r-sm" />
                
                {/* Line crossing the gap between left main box and right main box */}
                <div className="hidden md:block absolute -right-[92px] top-1/2 w-[48px] h-px bg-foreground/30" />
                
                {/* Dot at the end of the line */}
                <div className="hidden md:block absolute -right-[92px] top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-[#a78bfa] shadow-[0_0_8px_#a78bfa]" />
              </div>
            </div>
          </div>

          {/* SDK Box (Outside Platform, Inside Environment) */}
          <div className="w-full py-3 bg-[#a78bfa]/10 border border-[#a78bfa]/40 rounded text-center text-[#a78bfa]">
            Beaver Edge Proxy
          </div>
        </div>

        {/* Right Side: API2Bot Cloud */}
        <div className="flex-[1.2] flex flex-col gap-4">
          {/* Top Tools */}
          <div className="flex gap-4">
            <div className="flex-1 rounded border border-[#a78bfa]/30 bg-[#a78bfa]/5 p-3 flex items-center justify-center text-center text-[#a78bfa]">
              Agentic Studio
            </div>
            <div className="flex-1 rounded border border-[#a78bfa]/30 bg-[#a78bfa]/5 p-3 flex items-center justify-center text-center text-[#a78bfa] relative">
              Discovery Engine
              {/* Arrow down to Service */}
              <div className="hidden md:block absolute -bottom-4 left-1/2 w-px h-4 bg-foreground/30" />
              <div className="hidden md:block absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 border-b border-r border-foreground/30" />
            </div>
          </div>

          {/* Core Service */}
          <div className="relative flex-1 rounded-xl border border-[#67e8f9]/50 bg-[#67e8f9]/5 p-6 flex flex-col justify-center">
            <span className="absolute -top-3 left-6 bg-background px-2 text-[#67e8f9] font-bold tracking-widest">ADK RUNTIME</span>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded border border-[#a78bfa]/30 bg-[#a78bfa]/10 py-5 px-1 flex flex-col items-center justify-center gap-3">
                <Zap className="w-6 h-6 text-[#a78bfa]" />
                <span className="text-[#a78bfa] text-center leading-tight">LLM<br/>Engine</span>
              </div>
              <div className="rounded border border-[#67e8f9]/30 bg-[#67e8f9]/10 py-5 px-1 flex flex-col items-center justify-center gap-3">
                <Timer className="w-6 h-6 text-[#67e8f9]" />
                <span className="text-[#67e8f9] text-center leading-tight">Tool<br/>Executor</span>
              </div>
              <div className="rounded border border-[#eca8d6]/30 bg-[#eca8d6]/10 py-5 px-1 flex flex-col items-center justify-center gap-3">
                <Database className="w-6 h-6 text-[#eca8d6]" />
                <span className="text-[#eca8d6] text-center leading-tight">Agent<br/>DB</span>
              </div>
              <div className="rounded border border-yellow-500/30 bg-yellow-500/10 py-5 px-1 flex flex-col items-center justify-center gap-3">
                <FileJson className="w-6 h-6 text-yellow-500" />
                <span className="text-yellow-500 text-center leading-tight">Spec<br/>Parser</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}



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
          
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="relative z-10">
              <h2 className={`text-4xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}>
                Under the
                <br />
                <span className="text-muted-foreground">Hood.</span>
              </h2>

              <p className={`mt-6 md:mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg transition-all duration-1000 delay-100 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}>
                We turn static REST APIs into dynamic reasoning engines using a high-fidelity execution pipeline.
              </p>
            </div>

            {/* Architecture Visual */}
            <div className={`relative min-h-[400px] lg:h-[400px] transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}>
              <ArchitectureDiagramVisual />
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
                  ? "border-foreground/30 bg-black" 
                  : "border-foreground/10 hover:border-foreground/20"
              } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Step number and icon */}
              <div className="flex items-center justify-between mb-6">
                <span className={`text-4xl font-display transition-all duration-300 ${
                  activeStep === index ? "text-transparent bg-clip-text bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9]" : "text-foreground/20"
                }`}>
                  {step.number}
                </span>
                <div className={`w-12 h-12 flex items-center justify-center border rounded-lg transition-all duration-300 ${
                  activeStep === index 
                    ? "border-[#a78bfa]/30 bg-gradient-to-br from-[#eca8d6]/10 via-[#a78bfa]/10 to-[#67e8f9]/10" 
                    : "border-foreground/10 text-muted-foreground"
                }`}>
                  <step.icon className={`w-6 h-6 ${activeStep === index ? "text-[#a78bfa]" : ""}`} />
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
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9] transition-transform duration-500 origin-left ${
                activeStep === index ? "scale-x-100" : "scale-x-0"
              }`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
