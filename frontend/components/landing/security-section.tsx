"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Is my API data secure?",
    answer: "Yes. We don't store your API responses or system prompts. All keys are encrypted at rest, and execution happens in an isolated environment.",
  },
  {
    question: "Which LLM models do you use?",
    answer: "By default, we route to Gemini 2.0 Flash and Mistral Large depending on your preference, providing an optimal balance of speed and reasoning.",
  },
  {
    question: "Can I use my own Auth?",
    answer: "Absolutely. We support Bearer Tokens, API Keys (header-based), and basic auth. You configure the secret, we inject it during execution.",
  },
  {
    question: "How complex can my OpenAPI spec be?",
    answer: "We support OpenAPI 3.0+ specs with up to 200 endpoints. Our engine automatically chunks and summarizes them to fit within context limits.",
  },
];

export function SecuritySection() {
  const [isVisible, setIsVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
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
    <section id="faq" ref={sectionRef} className="relative py-32 lg:py-40 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-20">
          <span className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 justify-center ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}>
            <span className="w-12 h-px bg-foreground/20" />
            Support Hub
            <span className="w-12 h-px bg-foreground/20" />
          </span>
          
          <h2 className={`text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.9] mb-8 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            Answers for the
            <br />
            <span className="text-muted-foreground">Super-Agent Era.</span>
          </h2>
          
          <p className={`text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto transition-all duration-1000 delay-100 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}>
            Everything you need to know about building, deploying, and securing your AI agents with Beaver.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <span className="text-sm font-mono text-[#eca8d6]">FAQ</span>
          </div>
          
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className={`border-b border-foreground/10 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full py-6 flex items-center justify-between text-left group"
              >
                <span className="text-lg font-medium group-hover:text-[#eca8d6] transition-colors">
                  {faq.question}
                </span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                  openIndex === index ? "rotate-180" : ""
                }`} />
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? "max-h-40 pb-6" : "max-h-0"
              }`}>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
