"use client";

import { useState, useEffect, useRef } from "react";
import { Headphones, Building2, ShoppingCart } from "lucide-react";
// ─── Whale Network Canvas ───────────────────────────────────────────────────

function WhaleNetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const timeRef = useRef(0);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Pre-load the whale image
    const img = new Image();
    img.src = '/images/neural_whale.png';
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

    // Create floating neural network nodes
    const nodes = Array.from({ length: 45 }, () => ({
      x: Math.random() * 100, 
      y: Math.random() * 100, 
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      radius: 1.5 + Math.random() * 1.5,
      pulseOffset: Math.random() * Math.PI * 2
    }));

    const render = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      
      const t = timeRef.current;

      // Define Whale position (center-rightish within its container)
      let whaleCenter = { x: W / 2, y: H / 2 };
      let whaleRadius = 150; // Approximated hit radius for connections
      let whaleY = H / 2;

      // Draw the Whale
      if (imageRef.current) {
        const img = imageRef.current;
        // Make the whale scale responsively
        const scale = Math.min((W * 0.8) / img.width, (H * 0.8) / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = W / 2 - w / 2;
        
        // Organic floating animation for the whale
        whaleY = H / 2 - h / 2 + Math.sin(t * 1.5) * 15;
        whaleCenter = { x: W / 2, y: whaleY + h / 2 };
        whaleRadius = w * 0.4; // roughly the body radius

        ctx.drawImage(img, x, whaleY, w, h);
      }

      // Draw Nodes and Inter-node connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        n1.x += n1.vx;
        n1.y += n1.vy;
        
        // Bounce off edges gently
        if (n1.x < 0 || n1.x > 100) n1.vx *= -1;
        if (n1.y < 0 || n1.y > 100) n1.vy *= -1;

        const p1x = (n1.x / 100) * W;
        const p1y = (n1.y / 100) * H;

        // Draw connections between nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const p2x = (n2.x / 100) * W;
          const p2y = (n2.y / 100) * H;

          const dist = Math.hypot(p2x - p1x, p2y - p1y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.strokeStyle = `rgba(167, 139, 250, ${0.4 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        }

        // Connect node directly to the whale
        const distToWhale = Math.hypot(whaleCenter.x - p1x, whaleCenter.y - p1y);
        if (distToWhale > whaleRadius * 0.5 && distToWhale < whaleRadius * 1.8) {
           const alpha = Math.max(0, 1 - (distToWhale - whaleRadius * 0.5) / (whaleRadius * 1.3));
           ctx.beginPath();
           ctx.moveTo(p1x, p1y);
           ctx.lineTo(whaleCenter.x, whaleCenter.y);
           
           // Gradient so the line fades as it penetrates the whale body
           const grad = ctx.createLinearGradient(p1x, p1y, whaleCenter.x, whaleCenter.y);
           grad.addColorStop(0, `rgba(103, 232, 249, ${alpha * 0.6})`); // Cyan from node
           grad.addColorStop(0.6, `rgba(236, 168, 214, ${alpha * 0.2})`); // Pink midway
           grad.addColorStop(1, "rgba(236, 168, 214, 0)"); // Transparent at the center
           
           ctx.strokeStyle = grad;
           ctx.lineWidth = 1;
           ctx.stroke();
           ctx.lineWidth = 0.5; // reset
        }

        // Draw node
        ctx.beginPath();
        const pulse = (Math.sin(t * 3 + n1.pulseOffset) + 1) / 2;
        ctx.arc(p1x, p1y, n1.radius + pulse * 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(103, 232, 249, ${0.4 + pulse * 0.6})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#67e8f9";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      timeRef.current += 0.016;
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

const solutions = [
  { 
    title: "Customer Support (Zendesk / Intercom)", 
    description: "Automatically resolve tier-1 tickets by giving your agent access to your support platform's API.",
    icon: Headphones,
  },
  { 
    title: "Internal IT Helpdesk (Jira / Slack)", 
    description: "Let employees reset passwords, query company databases, and create tickets via a simple chat interface.",
    icon: Building2,
  },
  { 
    title: "E-Commerce Concierge (Shopify / Stripe)", 
    description: "Build shopping assistants that can check order status, manage refunds, and recommend products natively.",
    icon: ShoppingCart,
  },
];

export function DevelopersSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
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
      setActiveIndex((prev) => (prev + 1) % solutions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="solutions" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Image - Hidden on mobile, shown on desktop */}
      <div
        className={`hidden lg:block absolute bottom-0 right-0 w-[55%] h-[85%] pointer-events-none transition-all duration-1000 delay-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <WhaleNetworkCanvas />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div
          className={`mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Solutions
          </span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.9]">
            Built for any
            <br />
            <span className="text-muted-foreground">backend.</span>
          </h2>
        </div>

        {/* Description */}
        <div
          className={`max-w-xl mb-12 transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-xl text-muted-foreground leading-relaxed">
            Stop hardcoding chatbot logic. Connect your existing systems and let the agent figure out how to satisfy the user intent.
          </p>
        </div>

        {/* Solutions Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:max-w-[60%]">
          {solutions.map((solution, index) => (
            <button
              key={solution.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative text-left p-8 border transition-all duration-500 ${
                activeIndex === index 
                  ? "border-foreground/30 bg-white/[0.03]" 
                  : "border-foreground/10 hover:border-foreground/20"
              } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              <div className={`w-12 h-12 mb-6 flex items-center justify-center border rounded-lg transition-all duration-300 ${
                activeIndex === index 
                  ? "border-[#a78bfa]/30 bg-gradient-to-br from-[#eca8d6]/10 via-[#a78bfa]/10 to-[#67e8f9]/10" 
                  : "border-foreground/10 text-muted-foreground"
              }`}>
                <solution.icon className={`w-6 h-6 ${activeIndex === index ? "text-[#a78bfa]" : ""}`} />
              </div>
              
              <h3 className="font-medium mb-3 leading-tight">{solution.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{solution.description}</p>

              {/* Active indicator */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9] transition-transform duration-500 origin-left ${
                activeIndex === index ? "scale-x-100" : "scale-x-0"
              }`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
