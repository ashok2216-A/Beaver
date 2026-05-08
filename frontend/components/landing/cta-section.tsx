"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [isAiEnabled, setIsAiEnabled] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div
          className={`relative border border-foreground/10 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          onMouseMove={handleMouseMove}
        >
          {/* Spotlight effect */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(167, 139, 250, 0.15), transparent 40%)`
            }}
          />
          
          <div className="relative z-10 px-8 lg:px-16 py-16 lg:py-24 text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display tracking-tight mb-4 leading-[1.1] md:leading-[0.95]">
              Ship web apps with the
              <br />
              AI-<span className="relative inline-flex align-middle overflow-hidden transition-all duration-700">
                <span key={isAiEnabled ? "enabled" : "ready"} className="transition-all duration-1000 ease-in-out opacity-100 translate-x-0 blur-0">
                  {isAiEnabled ? "enabled" : "ready"}
                </span>
                {/* Outgoing word (placeholder for animation) */}
                <span className={`absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none ${
                  isAiEnabled ? "opacity-0 translate-x-8 blur-lg" : "opacity-0 -translate-x-8 blur-lg"
                }`}>
                  {isAiEnabled ? "ready" : "enabled"}
                </span>
              </span><button
                onClick={() => setIsAiEnabled(!isAiEnabled)}
                className={`inline-flex items-center h-[0.7em] w-[1.4em] rounded-full transition-all duration-500 relative align-middle mx-[0.1em] ${
                  isAiEnabled 
                    ? "bg-[#7c3aed] shadow-[0_0_30px_rgba(124,58,237,0.6)]" 
                    : "bg-white/20"
                }`}
              >
                <div
                  className={`h-[0.55em] w-[0.55em] rounded-full bg-white shadow-xl transition-all duration-500 transform ${
                    isAiEnabled ? "translate-x-[0.75em]" : "translate-x-[0.1em]"
                  }`}
                />
              </button>
              {" "}framework
            </h2>
            
            <p className="text-sm text-muted-foreground mb-8 font-medium">
              We're ready when you're ready
            </p>

            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-xl mx-auto">
              Start building for free during our public launch phase. Zero setup time, infinite possibilities.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-background px-8 h-14 text-base rounded-full group"
                asChild
              >
                <Link href="/sign-up">
                  Start Building Free
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-8 font-mono">
              No credit card required
            </p>
          </div>

          {/* Decorative corners */}
          <div className="absolute top-0 right-0 w-32 h-32 border-b border-l border-foreground/10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-t border-r border-foreground/10" />
        </div>
      </div>
    </section>
  );
}
