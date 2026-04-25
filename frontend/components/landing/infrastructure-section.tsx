"use client";

import { useEffect, useState, useRef } from "react";
import { FileJson, Wrench, Shield } from "lucide-react";

// ─── Canvas Globe ─────────────────────────────────────────────────────────────

// ─── Neural Engine Canvas ──────────────────────────────────────────────

function NeuralEngineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const timeRef = useRef(0);

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

    // Generate hundreds of particles for the core sphere
    const coreParticles = Array.from({ length: 300 }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = Math.random() * 30 + 20; // radius between 20 and 50
      return { theta, phi, r, speed: Math.random() * 0.03 + 0.01 };
    });

    // Orbital rings of data
    const rings = [
      { radius: 100, tiltX: Math.PI / 3, tiltY: 0, speed: 0.005, color: "#67e8f9", dots: 40 },
      { radius: 140, tiltX: -Math.PI / 4, tiltY: Math.PI / 6, speed: -0.003, color: "#eca8d6", dots: 60 },
      { radius: 180, tiltX: Math.PI / 6, tiltY: -Math.PI / 4, speed: 0.002, color: "#a78bfa", dots: 80 }
    ];

    const render = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      const t = timeRef.current;
      const cx = W / 2;
      const cy = H / 2;

      // Ambient background glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 250);
      bgGrad.addColorStop(0, "rgba(167, 139, 250, 0.08)");
      bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Draw Rings and Accretion Disk
      rings.forEach((ring, i) => {
         ctx.save();
         ctx.translate(cx, cy);
         // Simulate 3D rotation of the entire ring system
         ctx.rotate(t * 0.02 * (i % 2 === 0 ? 1 : -1));
         ctx.scale(1, Math.cos(ring.tiltX)); // Flatten Y to create 3D tilt
         
         ctx.beginPath();
         ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
         ctx.strokeStyle = `rgba(${ring.color === "#67e8f9" ? "103,232,249" : ring.color === "#eca8d6" ? "236,168,214" : "167,139,250"}, 0.1)`;
         ctx.lineWidth = 1;
         ctx.stroke();

         // Ring data packets
         for(let j=0; j<ring.dots; j++) {
            const angle = (Math.PI * 2 / ring.dots) * j + t * ring.speed * 20;
            const px = Math.cos(angle) * ring.radius;
            const py = Math.sin(angle) * ring.radius;
            
            // Fade out dots that are "behind" the core based on Y (simulated Z depth)
            const z = Math.sin(angle) * Math.sin(ring.tiltX);
            const alpha = Math.max(0.1, 0.5 + z * 0.5);
            
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${ring.color === "#67e8f9" ? "103,232,249" : ring.color === "#eca8d6" ? "236,168,214" : "167,139,250"}, ${alpha})`;
            ctx.fill();
         }
         ctx.restore();
      });

      // Draw Neural Core (Breathing sphere of particles)
      const pulse = Math.sin(t * 0.03) * 6;
      
      coreParticles.forEach(p => {
         // Rotate sphere slowly on Y axis
         p.theta += p.speed * 0.2;
         
         // Spherical to Cartesian projection
         const r = p.r + pulse;
         const x = r * Math.sin(p.phi) * Math.cos(p.theta);
         const z = r * Math.sin(p.phi) * Math.sin(p.theta);
         const y = r * Math.cos(p.phi);

         // Simple perspective projection
         const scale = 300 / (300 + z);
         const px = cx + x * scale;
         const py = cy + y * scale;

         if (scale > 0) {
             ctx.beginPath();
             ctx.arc(px, py, 1.2 * scale, 0, Math.PI * 2);
             
             // Dynamic depth shading
             const alpha = Math.max(0, Math.min(1, scale - 0.5));
             // Gradient mix from pink to cyan based on vertical position
             const isPink = y < 0;
             ctx.fillStyle = isPink ? `rgba(236,168,214,${alpha})` : `rgba(103,232,249,${alpha})`;
             ctx.fill();
         }
      });

      // Central Intense Core Flare
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35 + pulse);
      coreGrad.addColorStop(0, "rgba(255,255,255,0.9)");
      coreGrad.addColorStop(0.3, "rgba(167,139,250,0.4)");
      coreGrad.addColorStop(1, "rgba(167,139,250,0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 35 + pulse, 0, Math.PI * 2);
      ctx.fill();

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



const steps = [
  {
    number: "01",
    title: "Spec Ingestion",
    description: "We parse your OpenAPI/Swagger specs instantly, extracting every semantic hint to build a deep structural map.",
    icon: FileJson,
  },
  {
    number: "02",
    title: "Tool Synthesis",
    description: "Endpoints are compiled into native function-calling schemas that LLMs utilize for complex reasoning.",
    icon: Wrench,
  },
  {
    number: "03",
    title: "Secure Runtime",
    description: "Every request is proxied through our secure edge, injecting auth headers and ensuring zero-trust execution.",
    icon: Shield,
  },
];

export function InfrastructureSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
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
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="architecture" ref={sectionRef} className="relative py-32 lg:py-40 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-20">
          <span className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}>
            <span className="w-12 h-px bg-foreground/20" />
            Internal Architecture
          </span>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={`text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}>
                Under the
                <br />
                <span className="text-muted-foreground">Hood.</span>
              </h2>

              <p className={`mt-8 text-xl text-muted-foreground leading-relaxed max-w-lg transition-all duration-1000 delay-100 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}>
                We turn static REST APIs into dynamic reasoning engines using a high-fidelity execution pipeline.
              </p>
            </div>

            {/* Architecture Visual */}
            <div className={`relative h-[320px] lg:h-[400px] transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}>
              <NeuralEngineCanvas />
            </div>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <button
              key={step.number}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`relative text-left p-8 lg:p-10 border transition-all duration-500 ${
                activeStep === index 
                  ? "border-foreground/30 bg-foreground/[0.04]" 
                  : "border-foreground/10 hover:border-foreground/20"
              } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Step number and icon */}
              <div className="flex items-center justify-between mb-6">
                <span className={`text-4xl font-display transition-all duration-300 ${
                  activeStep === index ? "text-transparent bg-clip-text bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9]" : "text-foreground/20"
                }`}>
                  {step.number}
                </span>
                <div className={`w-12 h-12 flex items-center justify-center border rounded-lg transition-all duration-300 ${
                  activeStep === index 
                    ? "border-[#a78bfa]/30 bg-gradient-to-br from-[#eca8d6]/10 via-[#a78bfa]/10 to-[#67e8f9]/10" 
                    : "border-foreground/10 text-muted-foreground"
                }`}>
                  <step.icon className={`w-6 h-6 ${activeStep === index ? "text-[#a78bfa]" : ""}`} />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl lg:text-3xl font-display mb-4">
                {step.title}
              </h3>

              {/* Description */}
              <p className={`text-muted-foreground leading-relaxed transition-opacity duration-300 ${
                activeStep === index ? "opacity-100" : "opacity-70"
              }`}>
                {step.description}
              </p>

              {/* Active indicator */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9] transition-transform duration-500 origin-left ${
                activeStep === index ? "scale-x-100" : "scale-x-0"
              }`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
