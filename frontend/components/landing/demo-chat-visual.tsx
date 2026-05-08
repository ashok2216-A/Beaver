"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Key, Sparkles } from "lucide-react";

const CHAT_STEPS = [
  {
    type: "user",
    text: "Show me my last 3 customers from Stripe",
    delay: 1000,
  },
  {
    type: "agent",
    text: "Here are your 3 most recent customers:",
    hasCard: true,
    delay: 800,
  },
  {
    type: "user",
    text: "Refund the last charge for the first one",
    delay: 1500,
  },
  {
    type: "agent",
    text: "Refunded $128.00 to acme@inc.com. Receipt sent ✅",
    delay: 800,
  },
];

export function DemoChatAnimation() {
  const [messages, setMessages] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: any;

    const runNextStep = (stepIndex: number) => {
      if (stepIndex >= CHAT_STEPS.length) {
        timeout = setTimeout(() => {
          setMessages([]);
          setCurrentStep(-1);
          runNextStep(0);
        }, 8000);
        return;
      }

      const step = CHAT_STEPS[stepIndex];
      setCurrentStep(stepIndex);
      
      setIsTyping(true);
      
      timeout = setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, step]);
        
        timeout = setTimeout(() => {
          runNextStep(stepIndex + 1);
        }, 2500);
      }, step.delay);
    };

    runNextStep(0);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="w-full max-w-[550px] mx-auto">
      <div className="relative group w-full">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#eca8d6]/10 via-[#a78bfa]/10 to-[#67e8f9]/10 rounded-[20px] blur-xl opacity-50" />
        
        <div className="relative bg-black border border-white/10 rounded-[16px] overflow-hidden shadow-2xl flex flex-col h-[500px] md:h-[600px]">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white/90">Stripe API Agent Preview</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-[10px] font-bold text-green-500 uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* Chat Messages */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth custom-scrollbar"
          >
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                border: 2px solid transparent;
                background-clip: padding-box;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.25);
              }
            `}</style>
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} transition-all duration-500 animate-in fade-in slide-in-from-bottom-2`}
              >
                {msg.type === "user" ? (
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-sm text-white/90 max-w-[85%]">
                    {msg.text}
                  </div>
                ) : msg.isProcessing ? (
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#a78bfa]" />
                      <span className="text-[11px] font-mono text-[#a78bfa]/80 uppercase tracking-wider">{msg.text}</span>
                    </div>
                    <div className="space-y-2 opacity-20">
                      <div className="h-1.5 w-full bg-white/40 rounded-full" />
                      <div className="h-1.5 w-[70%] bg-white/40 rounded-full" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-white/70 pl-1">{msg.text}</div>
                    {msg.hasCard && (
                      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 space-y-2">
                        {[
                          { id: "cus_NffrFeUfNV2Hib", email: "acme@inc.com" },
                          { id: "cus_NffrAR2Hib2NV", email: "jane@stark.io" },
                          { id: "cus_NffrZ8Hi2NbAR", email: "tom@nova.app" },
                        ].map((customer, j) => (
                          <div key={j} className="flex items-center justify-between bg-black/40 p-2.5 rounded-lg text-[10px] font-mono border border-white/5">
                            <span className="text-white/40">{customer.id}</span>
                            <span className="text-white/80">{customer.email}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-1.5 pl-1 animate-pulse">
                <div className="w-1 h-1 bg-white/20 rounded-full" />
                <div className="w-1 h-1 bg-white/20 rounded-full" />
                <div className="w-1 h-1 bg-white/20 rounded-full" />
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-4 bg-white/[0.02] border-t border-white/5">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                placeholder="Ask your agent anything..."
                className="w-full bg-black border border-white/10 rounded-xl px-11 py-3.5 text-sm text-white/40 focus:outline-none focus:border-white/20 transition-all"
                readOnly
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                <Key className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

