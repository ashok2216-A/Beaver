"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Key, Search } from "lucide-react";

const features = [
  "Auto-generated tool definitions for every endpoint",
  "Bring your own auth — Bearer, API Key, OAuth",
  "Inspect raw request/response for every call",
];

export function HowItWorksSection() {
  const [isVisible, setIsVisible] = useState(false);
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

  return (
    <section
      id="playground"
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-[oklch(0.09_0.01_260)] text-white overflow-hidden"
    >
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-16 lg:mb-24">
          <span className={`inline-flex items-center gap-3 text-sm font-mono text-white/40 mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}>
            <span className="w-12 h-px bg-white/20" />
            Live playground
          </span>

          <h2 className={`text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.9] mb-8 transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
          }`}>
            Chat with your API
            <br />
            <span className="text-white/40">like it&apos;s a teammate</span>
          </h2>

          <p className={`text-xl text-white/60 max-w-2xl leading-relaxed transition-all duration-1000 delay-100 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}>
            Your agent understands every endpoint, knows when to call which one, and explains the result in plain English. Inspect every request and response.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Features List */}
          <div className={`flex flex-col justify-center transition-all duration-1000 delay-200 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          }`}>
            <ul className="space-y-6">
              {features.map((feature, index) => (
                <li 
                  key={feature}
                  className="flex items-start gap-4"
                  style={{ transitionDelay: `${index * 100 + 300}ms` }}
                >
                  <Check className="w-5 h-5 text-[#eca8d6] shrink-0 mt-0.5" />
                  <span className="text-lg text-white/80">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Preview */}
          <div className={`transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          }`}>
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-white">Stripe API Agent Preview</span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Live</span>
                </div>
              </div>

              {/* Chat Content */}
              <div className="p-6 space-y-4">
                {/* User Message */}
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/90">Show me my last 3 customers from Stripe</p>
                </div>

                {/* Agent Response Placeholder */}
                <div className="bg-gradient-to-br from-[#eca8d6]/5 via-[#a78bfa]/5 to-[#67e8f9]/5 border border-[#a78bfa]/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9] animate-pulse" />
                    <span className="text-xs font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9]">Agent processing...</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="px-6 pb-6">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                  <Search className="w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Ask your agent anything..." 
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                    readOnly
                  />
                  <Key className="w-4 h-4 text-white/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
