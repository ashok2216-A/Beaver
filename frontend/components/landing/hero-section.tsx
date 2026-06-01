"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

// ─── Neural Network Canvas Animation ──────────────────────────────────────────

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  color: [number, number, number];
  activity: number; // 0–1, how "active" this node is
  activityTarget: number;
}

function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const nodesRef = useRef<Node[]>([]);
  const frameRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      initNodes(w, h);
    };

    // Gradient color stops pulled from the Super-Agent gradient
    const COLORS: [number, number, number][] = [
      [236, 168, 214], // pink
      [167, 139, 250], // purple
      [103, 232, 249], // cyan
    ];

    const initNodes = (w: number, h: number) => {
      const count = Math.floor((w * h) / 18000); // density
      nodesRef.current = Array.from({ length: Math.min(count, 90) }, () => {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: 1.5 + Math.random() * 2,
          pulsePhase: Math.random() * Math.PI * 2,
          color,
          activity: 0,
          activityTarget: Math.random(),
        };
      });
    };

    const render = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const t = timeRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, W, H);

      // Dark deep-space background gradient
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#000000");
      bg.addColorStop(0.5, "#000000");
      bg.addColorStop(1, "#000000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const nodes = nodesRef.current;

      // Update nodes
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        // Wrap around edges
        if (n.x < 0) n.x = W;
        if (n.x > W) n.x = 0;
        if (n.y < 0) n.y = H;
        if (n.y > H) n.y = 0;

        // Mouse repulsion / attraction (proximity to mouse boosts activity)
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          n.activityTarget = 1;
          // Gentle push away from mouse
          n.vx -= (dx / dist) * 0.015;
          n.vy -= (dy / dist) * 0.015;
          // Clamp velocity
          const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
          if (speed > 1.5) {
            n.vx = (n.vx / speed) * 1.5;
            n.vy = (n.vy / speed) * 1.5;
          }
        } else {
          n.activityTarget = 0.1 + Math.sin(t * 0.3 + n.pulsePhase) * 0.1;
          // Dampen to base speed
          n.vx *= 0.99;
          n.vy *= 0.99;
        }

        n.activity += (n.activityTarget - n.activity) * 0.05;
      });

      // Draw connections
      const CONNECTION_DIST = 160;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > CONNECTION_DIST) continue;

          const proximity = 1 - dist / CONNECTION_DIST;
          const activity = (a.activity + b.activity) * 0.5;
          const alpha = proximity * proximity * activity * 0.6;

          // Blend node colors for the connection
          const r = Math.round((a.color[0] + b.color[0]) * 0.5);
          const g = Math.round((a.color[1] + b.color[1]) * 0.5);
          const bl = Math.round((a.color[2] + b.color[2]) * 0.5);

          ctx.beginPath();
          ctx.strokeStyle = `rgba(${r},${g},${bl},${alpha})`;
          ctx.lineWidth = proximity * activity * 1.5;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          // Draw traveling data packet along active connections
          if (activity > 0.5 && proximity > 0.5) {
            const pulse = (Math.sin(t * 2 + i * 0.7) + 1) * 0.5;
            const px = a.x + (b.x - a.x) * pulse;
            const py = a.y + (b.y - a.y) * pulse;
            ctx.beginPath();
            ctx.arc(px, py, 2 * activity, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${bl},${alpha * 2})`;
            ctx.fill();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        const [r, g, b] = n.color;
        const pulse = 0.7 + Math.sin(t * 1.5 + n.pulsePhase) * 0.3;
        const radius = n.radius * (1 + n.activity * 0.8) * pulse;
        const alpha = 0.3 + n.activity * 0.7;

        // Outer glow
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 6);
        glow.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.4})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius * 6, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      });

      timeRef.current += 0.016;
      frameRef.current = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    render();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-black">
      {/* Neural Network Canvas */}
      <NeuralBackground />

      {/* Top gradient fade */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 via-transparent to-black/70 pointer-events-none" />

      {/* Subtle grid lines overlay */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none opacity-10">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-white/20"
            style={{ top: `${12.5 * (i + 1)}%`, left: 0, right: 0 }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-white/20"
            style={{ left: `${8.33 * (i + 1)}%`, top: 0, bottom: 0 }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-20 md:py-32 lg:py-40 text-center">
        {/* Eyebrow */}
        <div
          className={`mb-6 md:mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span className="inline-flex items-center gap-3 text-xs md:text-sm font-mono text-white/60 px-3 md:px-4 py-1.5 md:py-2 border border-white/20 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9] animate-pulse" />
                The Future of API Tooling
              </span>
            </div>
 
        <div className="mb-6 md:mb-8">
          <h1
            className={`text-center text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-display leading-[0.95] tracking-tight text-white transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Ship any API as a
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9]">
              Super-Agent
            </span>
          </h1>
        </div>
 
            {/* Subtitle */}
            <p
              className={`text-base md:text-xl lg:text-2xl text-white/70 max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed transition-all duration-1000 delay-100 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Beaver is the ultimate platform for turning OpenAPI documentation into reliable, tool-calling agents for any LLM in seconds.
            </p>

            {/* CTAs */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 transition-all duration-1000 delay-200 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Button
                size="lg"
                className="bg-white hover:bg-white/90 text-black px-8 h-14 text-base rounded-full group"
                asChild
              >
                <Link href="/sign-up">
                  Start Building Free
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base rounded-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm"
              >
                <Play className="w-4 h-4 mr-2" />
                View 60s Demo
              </Button>
            </div>

            {/* Integrations Social Proof */}
            <div
              className={`flex items-center justify-center gap-3 transition-all duration-1000 delay-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex -space-x-1 items-center">
                <div className="w-7 h-7 rounded-full bg-transparent flex items-center justify-center overflow-hidden z-[5]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-5 h-5 object-contain drop-shadow-sm" />
                </div>
                <div className="w-7 h-7 rounded-full bg-transparent flex items-center justify-center overflow-hidden z-[4]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" className="w-5 h-5 object-contain drop-shadow-sm" />
                </div>
                <div className="w-7 h-7 rounded-full bg-transparent flex items-center justify-center overflow-hidden z-[3]">
                  <img src="https://www.vectorlogo.zone/logos/slack/slack-icon.svg" alt="Slack" className="w-5 h-5 object-contain drop-shadow-sm" />
                </div>
                <div className="w-7 h-7 rounded-full bg-transparent flex items-center justify-center overflow-hidden z-[2]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" className="w-5 h-5 object-contain drop-shadow-sm filter brightness-0 invert opacity-90" />
                </div>
                <div className="w-7 h-7 rounded-full bg-transparent flex items-center justify-center overflow-hidden z-[1]">
                  <img src="https://www.vectorlogo.zone/logos/hubspot/hubspot-icon.svg" alt="Hubspot" className="w-5 h-5 object-contain drop-shadow-sm" />
                </div>
              </div>
              <span className="text-white/80 text-[14px] font-medium tracking-tight">
                100+ integrations
              </span>
            </div>

      </div>
    </section>
  );
}
