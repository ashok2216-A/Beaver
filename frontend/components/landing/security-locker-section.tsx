"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Lock, Fingerprint } from "lucide-react";

// ─── Security Locker Canvas ────────────────────────────────────────────────

function SecurityLockerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const timeRef = useRef(0);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Pre-load the locker image
    const img = new Image();
    img.src = '/images/neural_padlock.png';
    img.onload = () => {
      imageRef.current = img;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);



    const render = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      
      const t = timeRef.current;
      const cx = W / 2;
      const cy = H / 2;

      let baseR = Math.min(W, H) * 0.25;

      // Draw faint Perspective Grid Background
      ctx.strokeStyle = "rgba(167, 139, 250, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 15; i++) {
         const progress = i / 15;
         const yOff = (H/2) * Math.pow(progress, 2);
         ctx.beginPath(); ctx.moveTo(0, cy + yOff); ctx.lineTo(W, cy + yOff); ctx.stroke();
         ctx.beginPath(); ctx.moveTo(0, cy - yOff); ctx.lineTo(W, cy - yOff); ctx.stroke();
      }

      // Draw Floating Padlock
      if (imageRef.current) {
        const img = imageRef.current;
        const scale = Math.min((W * 0.5) / img.width, (H * 0.5) / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = W / 2 - w / 2;
        const imgY = H / 2 - h / 2 + Math.sin(t * 0.03) * 10;
        
        baseR = w * 0.6; 
        ctx.drawImage(img, x, imgY, w, h);
      }


      timeRef.current += 1;
      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

const features = [
  {
    title: "SOC2 Type II Compliance",
    description: "Built from the ground up with enterprise-grade security controls and regular third-party audits.",
    icon: ShieldCheck,
  },
  {
    title: "End-to-End Encryption",
    description: "All API tokens, payloads, and agent memory are AES-256 encrypted at rest and TLS 1.3 in transit.",
    icon: Lock,
  },
  {
    title: "Granular RBAC",
    description: "Strict role-based access control policies dictate precisely which endpoints each agent is authorized to call.",
    icon: Fingerprint,
  },
];

export function SecurityLockerSection() {
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

  return (
    <section id="security-features" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden border-t border-white/5">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text Content */}
          <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              Security
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display tracking-tight leading-[1.1] mb-8">
              Ironclad security for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9]">API keys.</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-12 max-w-lg">
              Handing over your API keys to an AI shouldn't be terrifying. We've built an execution sandbox that keeps your credentials locked down.
            </p>

            <div className="space-y-8">
              {features.map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-foreground/5 border border-foreground/10 text-[#a78bfa]">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Canvas Graphic */}
          <div className={`relative h-[500px] lg:h-[600px] transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#eca8d6]/5 via-[#a78bfa]/5 to-[#67e8f9]/5 rounded-full blur-3xl opacity-50" />
            <SecurityLockerCanvas />
          </div>

        </div>
      </div>
    </section>
  );
}
