"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const testimonials = [
  {
    quote: "We connected our custom CRM API to Beaver, and within an hour we had a working Slack bot for our sales team. The dynamic tool routing is magic.",
    author: "Sarah J.",
    role: "Lead Engineer",
  },
  {
    quote: "The ability to just drop an OpenAPI spec and get a production-ready chatbot saved us weeks of LangChain boilerplate. Highly recommended.",
    author: "David M.",
    role: "Product Manager",
  },
  {
    quote: "Finally, a platform that understands that the hard part of agentic AI is the API integration. This makes exposing our backend to LLMs trivial.",
    author: "Elena T.",
    role: "CTO",
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
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
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const [hasMounted, setHasMounted] = useState(false);
  const activeTestimonial = testimonials[activeIndex];

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 lg:py-40 bg-black text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 font-mono text-[10px] text-white/[0.02] leading-tight overflow-hidden whitespace-pre select-none">
        {hasMounted && Array.from({ length: 60 }, (_, i) => 
          Array.from({ length: 100 }, () => 
            Math.random() > 0.7 ? '"' : ' '
          ).join("")
        ).join("\n")}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-20">
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-white/40 mb-4">
              <span className="w-12 h-px bg-white/20" />
              Loved by developers
            </span>
            <h2 className={`text-4xl lg:text-5xl font-display transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}>
              What developers
              <span className="text-white/40"> are saying.</span>
            </h2>
          </div>
          
          {/* Navigation arrows */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={goPrev}
              className="p-4 border border-white/20 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="p-4 border border-white/20 hover:bg-white/10 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Quote side */}
          <div className="lg:col-span-8 relative">
            {/* Large quote mark */}
            <span className="absolute -left-4 -top-8 text-[200px] font-display text-white/5 leading-none select-none">
              &ldquo;
            </span>
            
            <div className="relative">
              <blockquote 
                key={activeIndex}
                className="text-3xl lg:text-4xl xl:text-5xl font-display leading-[1.2] tracking-tight animate-fadeSlideIn"
              >
                {activeTestimonial.quote}
              </blockquote>

              {/* Author */}
              <div className="mt-12 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                  <span className="font-display text-xl">
                    {activeTestimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-medium">{activeTestimonial.author}</p>
                  <p className="text-white/60">
                    {activeTestimonial.role}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="lg:col-span-4 flex flex-col justify-center gap-6">
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className="flex-1 h-1 bg-white/20 overflow-hidden"
                >
                  <div 
                    className={`h-full bg-white transition-all duration-300 ${
                      idx === activeIndex ? "w-full" : idx < activeIndex ? "w-full opacity-50" : "w-0"
                    }`}
                    style={idx === activeIndex ? { animation: "progress 8s linear forwards" } : {}}
                  />
                </button>
              ))}
            </div>

            {/* Testimonial dots */}
            <div className="flex flex-wrap gap-3">
              {testimonials.map((t, idx) => (
                <button
                  key={t.author}
                  onClick={() => setActiveIndex(idx)}
                  className={`px-4 py-2 text-sm border transition-all ${
                    idx === activeIndex 
                      ? "border-white/40 text-white" 
                      : "border-white/10 text-white/40 hover:border-white/30"
                  }`}
                >
                  {t.author}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.5s ease-out forwards;
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
