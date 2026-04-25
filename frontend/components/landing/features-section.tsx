"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Zap, Bug, Rocket } from "lucide-react";

// ─── Terminal Code Stream Canvas ──────────────────────────────────────────────

const CODE_LINES = [
  '> beaver ingest ./openapi.yaml',
  '✓ Parsed 47 endpoints',
  '✓ Generated tool schemas',
  '→ POST /v1/agents  { model: "gemini-2.0" }',
  '← 201 Created  { id: "agt_k9xmf2" }',
  '> agent.run("List top customers")',
  '→ GET /v1/customers?limit=5',
  '← 200 OK  [ { id: "cus_..." }, ... ]',
  '✓ Response formatted and returned',
  '> agent.run("Create invoice for cus_abc")',
  '→ POST /v1/invoices  { customer: "cus_abc" }',
  '← 200 OK  { id: "inv_xyz", amount: 4900 }',
];

function TerminalCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ text: string; color: string; opacity: number }[]>([]);
  const indexRef = useRef(0);

  const getColor = (line: string) => {
    if (line.startsWith('>')) return '#67e8f9';
    if (line.startsWith('✓')) return '#a78bfa';
    if (line.startsWith('→')) return '#eca8d6';
    if (line.startsWith('←')) return '#86efac';
    return 'rgba(255,255,255,0.5)';
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const text = CODE_LINES[indexRef.current % CODE_LINES.length];
      indexRef.current++;
      setLines(prev => [
        ...prev.slice(-14),
        { text, color: getColor(text), opacity: 1 },
      ]);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-black/60 rounded-lg overflow-hidden p-5 font-mono text-xs flex flex-col justify-end gap-1">
      <div className="text-white/20 mb-2 text-[10px] tracking-widest uppercase">beaver · agent runtime</div>
      {lines.map((line, i) => (
        <div
          key={i}
          className="transition-opacity duration-500"
          style={{ color: line.color, opacity: Math.min(1, (i + 1) / lines.length + 0.3) }}
        >
          {line.text}
        </div>
      ))}
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[#67e8f9]">▸</span>
        <span className="w-2 h-3.5 bg-[#67e8f9]/70 animate-pulse" />
      </div>
    </div>
  );
}


const features = [
  {
    number: "01",
    title: "AI Agent Generation",
    description: "Our reasoning engine doesn't just call APIs—it understands the semantic intent behind every endpoint, generating high-fidelity tools and prompts automatically.",
    icon: Brain,
    steps: ["Ingest", "Analyze", "Synthesize", "Deploy"],
  },
  {
    number: "02",
    title: "Zero-Glue Ingestion",
    description: "Drop any OpenAPI spec. We handle the parsing, schema validation, and context compression instantly.",
    icon: Zap,
  },
  {
    number: "03",
    title: "Deep Debugging",
    description: "Inspect raw request/response cycles for every tool call with our built-in forensic logger.",
    icon: Bug,
  },
  {
    number: "04",
    title: "Instant Edge Deployment",
    description: "Ship your agents to high-performance edge endpoints or embed our battle-tested chat widget.",
    icon: Rocket,
  },
];

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

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
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="relative mb-24 lg:mb-32">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
                <span className="w-12 h-px bg-foreground/30" />
                Core Platform
              </span>
              <h2
                className={`text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                Engineered for
                <br />
                <span className="text-muted-foreground">Precision.</span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:pb-4">
              <p className={`text-xl text-muted-foreground leading-relaxed transition-all duration-1000 delay-200 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}>
                Built for reliability, speed, and precision. Turn documentation into actions in under 60 seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Main Feature Card */}
        <div 
          className={`relative bg-black border border-foreground/10 p-8 lg:p-12 mb-6 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#eca8d6]/10 via-[#a78bfa]/10 to-[#67e8f9]/10 flex items-center justify-center rounded-lg border border-[#a78bfa]/20">
                  <Brain className="w-6 h-6 text-[#a78bfa]" />
                </div>
                <span className="font-mono text-sm text-muted-foreground">{features[0].number}</span>
              </div>
              <h3 className="text-3xl lg:text-4xl font-display mb-6">
                {features[0].title}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {features[0].description}
              </p>
              
              {/* Animated Steps */}
              <div className="flex items-center gap-4">
                {features[0].steps?.map((step, index) => (
                  <div key={step} className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 transition-all duration-300 ${
                      activeStep === index ? "text-transparent bg-clip-text bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9]" : "text-muted-foreground"
                    }`}>
                      <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-mono transition-all duration-300 ${
                        activeStep === index 
                          ? "border-[#a78bfa]/30 bg-gradient-to-br from-[#eca8d6]/10 via-[#a78bfa]/10 to-[#67e8f9]/10 text-white" 
                          : "border-foreground/20"
                      }`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium">{step}</span>
                    </div>
                    {index < 3 && (
                      <div className={`w-8 h-px transition-colors duration-300 ${
                        activeStep > index ? "bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9]" : "bg-foreground/20"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative h-[300px] lg:h-[400px] overflow-hidden rounded-lg bg-black/60 border border-white/5">
              <TerminalCanvas />
            </div>
          </div>
        </div>

        {/* Secondary Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.slice(1).map((feature, index) => (
            <div
              key={feature.number}
              className={`p-8 border border-foreground/10 bg-black transition-all duration-700 hover:border-foreground/30 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-foreground/5 flex items-center justify-center rounded-lg">
                  <feature.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-mono text-sm text-muted-foreground">{feature.number}</span>
              </div>
              <h3 className="text-xl font-display mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
