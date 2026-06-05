"use client";

import { useEffect, useState, useRef } from "react";
import { DemoChatAnimation } from "./demo-chat-visual";
import { Sparkles, Terminal, Cpu } from "lucide-react";

export function PlaygroundSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="chat" 
      ref={sectionRef} 
      className="relative py-24 lg:py-32 overflow-hidden bg-background"
    >
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#a78bfa]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Side: Content */}
          <div className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
          }`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-px bg-white/20" />
              <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60">Live Chat</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display leading-[1.1] mb-8 text-white">
              Experience the power&nbsp;of 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9]">
                Agentic Discovery
              </span>
            </h2>
            
            <p className="text-lg text-white/60 mb-12 leading-relaxed max-w-xl">
              Interact with your APIs in real-time. Our discovery engine automatically maps your endpoints to natural language capabilities, allowing you to query, mutate, and manage resources through a simple chat interface.
            </p>
            
            <div className="space-y-6">
              {[
                {
                  icon: <Terminal className="w-5 h-5" />,
                  title: "Natural Language Execution",
                  desc: "Turn complex API requests into simple conversational prompts."
                },
                {
                  icon: <Cpu className="w-5 h-5" />,
                  title: "Deterministic Tool Calling",
                  desc: "Zero-shot accuracy for tool selection and parameter mapping."
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#a78bfa] transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{item.title}</h4>
                    <p className="text-sm text-white/40">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Demo Visual */}
          <div className={`transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
          }`}>
            <DemoChatAnimation />
          </div>

        </div>
      </div>
    </section>
  );
}
