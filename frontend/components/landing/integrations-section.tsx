"use client";

import { useEffect, useState, useRef } from "react";

const integrations = [
  { name: "Slack", description: "Build workspace bots that can query your APIs and bridge communications.", icon: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" },
  { name: "Jira", description: "Automate ticket creation, status updates, and sprint summaries natively.", icon: "https://cdn.simpleicons.org/jira" },
  { name: "Stripe", description: "Manage refunds, check customer status, and summarize revenue in chat.", icon: "https://cdn.simpleicons.org/stripe" },
  { name: "Discord", description: "Deploy powerful community agents directly to your server.", icon: "https://cdn.simpleicons.org/discord" },
  { name: "Shopify", description: "E-commerce assistants that check inventory and order status.", icon: "https://cdn.simpleicons.org/shopify" },
  { name: "Salesforce", description: "Update leads and query your CRM directly from a chat interface.", icon: "https://www.vectorlogo.zone/logos/salesforce/salesforce-icon.svg" },
  { name: "Zendesk", description: "Resolve tier-1 support tickets autonomously with API access.", icon: "https://cdn.simpleicons.org/zendesk" },
  { name: "GitHub", description: "Manage issues, pull requests, and repo stats via agent commands.", icon: "https://cdn.simpleicons.org/github" },
  { name: "Google Maps", description: "Calculate routes, search places, get directions, and geocode addresses dynamically.", icon: "https://www.google.com/s2/favicons?sz=128&domain=maps.google.com" },
  { name: "Linear", description: "Streamline issue tracking and team updates through natural language.", icon: "https://cdn.simpleicons.org/linear" },
  { name: "Apify", description: "Run web scraping, data extraction, and automation actors on the Apify platform.", icon: "https://cdn.simpleicons.org/apify" },
];

function SignalWaveCanvas() {
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

    const COLORS = ["#eca8d6", "#a78bfa", "#67e8f9"];

    const render = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      const t = timeRef.current;

      // Draw multiple overlapping signal waves
      COLORS.forEach((color, ci) => {
        const phase = (ci / COLORS.length) * Math.PI * 2;
        const freq = 0.012 + ci * 0.003;
        const amp = H * (0.12 + ci * 0.04);
        const speed = 0.8 + ci * 0.3;
        const yBase = H * 0.5 + (ci - 1) * H * 0.08;
        const alpha = 0.4 - ci * 0.08;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5 - ci * 0.3;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;

        for (let x = 0; x <= W; x += 2) {
          const y = yBase + Math.sin(x * freq + t * speed + phase) * amp
                         + Math.sin(x * freq * 2.3 + t * (speed * 0.7) + phase) * amp * 0.3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Traveling dot on each wave
        const dotX = ((t * speed * 80) % (W + 100)) - 50;
        const dotY = yBase + Math.sin(dotX * freq + t * speed + phase) * amp
                           + Math.sin(dotX * freq * 2.3 + t * (speed * 0.7) + phase) * amp * 0.3;
        ctx.globalAlpha = 0.9;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
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

const PipedriveIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.302 0c-4.108 0-7.302 3.194-7.302 7.302v6.698h4.698V7.302c0-1.42.923-2.604 2.604-2.604 1.68 0 2.604 1.184 2.604 2.604v6.698h4.698V7.302C19.604 3.194 16.41 0 12.302 0zM4.698 16.698h14.906V24H4.698v-7.302z"/>
  </svg>
);

export function IntegrationsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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
    <section id="integrations" ref={sectionRef} className="relative overflow-hidden">
      {/* Header */}
      <div className="relative z-10 pt-32 lg:pt-40 text-center">
        <span className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 justify-center ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          <span className="w-12 h-px bg-foreground/20" />
          Connect Everything
          <span className="w-12 h-px bg-foreground/20" />
        </span>

        <h2 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[1.1] md:leading-[0.9] transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          World-Class
          <br />
          <span className="text-muted-foreground">Ecosystem.</span>
        </h2>

        <p className={`mt-6 md:mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto transition-all duration-1000 delay-100 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          Beaver natively bridges your existing tech stack with any LLM, turning standard docs into actionable intelligence.
        </p>
      </div>

      {/* Canvas signal wave */}
      <div className={`relative left-1/2 -translate-x-1/2 w-screen h-[180px] md:h-[240px] mt-8 lg:mt-12 transition-all duration-1000 delay-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}>
        <SignalWaveCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background pointer-events-none" />
      </div>

      {/* Integration grid */}
      <div className="relative z-10 mt-12 lg:mt-20 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-20">
          {integrations.map((integration, index) => (
            <div
              key={integration.name}
              className={`group relative overflow-hidden p-6 border transition-all duration-500 cursor-default ${
                hoveredIndex === index
                  ? "border-foreground bg-white/[0.03] scale-[1.02]"
                  : "border-foreground/10 hover:border-foreground/30"
              } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${index * 30 + 300}ms` }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={() => setHoveredIndex(index)}
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={integration.icon}
                  alt={integration.name}
                  className={`w-6 h-6 transition-all duration-300 ${
                    integration.name === "GitHub" || integration.name === "Zendesk"
                      ? `brightness-0 invert ${hoveredIndex === index ? "opacity-100" : "opacity-60"}`
                      : `brightness-0 invert opacity-60 ${hoveredIndex === index ? "!filter-none !opacity-100" : "group-hover:filter-none group-hover:opacity-100"}`
                  }`}
                />
                <h3 className="font-medium text-sm">{integration.name}</h3>
              </div>
              <p className={`text-[11px] text-muted-foreground leading-relaxed transition-opacity duration-300 ${
                hoveredIndex === index ? "opacity-100" : "opacity-60"
              }`}>
                {integration.description}
              </p>

              {/* Animated underline */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground/20 overflow-hidden">
                <div className={`h-full bg-gradient-to-r from-[#eca8d6] via-[#a78bfa] to-[#67e8f9] transition-all duration-500 ${
                  hoveredIndex === index ? "w-full" : "w-0"
                }`} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section: Ecosystem Core + Custom Side-by-Side */}
        <div className={`relative z-10 flex flex-col lg:flex-row items-stretch justify-center gap-4 max-w-[1000px] mx-auto px-6 mb-16 transition-all duration-1000 delay-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          {/* Ecosystem Core (Left Side) */}
          <div className="flex-[2] relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#eca8d6]/30 via-[#a78bfa]/30 to-[#67e8f9]/30 rounded-[24px] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
            
            <div className="relative h-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[24px] p-6 text-center flex flex-col justify-between">
              <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mb-6">
                {[
                  "snowflake", "notion", "hubspot", "figma", "gitlab", "asana", "spotify", "gmail", "googledrive", "googlesheets", "googlecalendar", "googlemaps",
                  "trello", "zoom", "pipedrive", "atlassian", "linear", "intercom", "zendesk", "dropbox", "airtable", "webflow", "framer",
                  "sentry", "datadog", "posthog", "vercel"
                ].map((icon) => (
                  icon === "pipedrive" ? (
                    <PipedriveIcon key={icon} className="h-3.5 md:h-4 text-white opacity-40 active:opacity-100 hover:opacity-100 hover:scale-110 transition-all duration-300 cursor-pointer" />
                  ) : (
                    <img
                      key={icon}
                      src={`https://cdn.simpleicons.org/${icon}/white`}
                      alt={icon}
                      className="h-3.5 md:h-4 opacity-40 active:opacity-100 hover:opacity-100 hover:scale-110 transition-all duration-300 cursor-pointer"
                    />
                  )
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-6 bg-white/10" />
                <span className="text-[8px] md:text-[9px] font-mono tracking-[0.3em] text-white/40 uppercase">Ecosystem Core</span>
                <div className="h-px w-6 bg-white/10" />
              </div>
            </div>
          </div>

          {/* Custom Integration (Right Side) */}
          <div className="flex-1 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#67e8f9]/30 to-[#a78bfa]/30 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
            
            <div className="relative h-full p-6 border border-dashed border-foreground/20 bg-black hover:bg-white/[0.02] transition-all duration-500 rounded-2xl text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 mb-4 rounded-full bg-gradient-to-br from-[#eca8d6]/20 via-[#a78bfa]/20 to-[#67e8f9]/20 flex items-center justify-center text-base font-bold">
                +
              </div>
              <h3 className="font-medium text-base mb-1">Custom</h3>
              <p className="text-[11px] text-muted-foreground leading-snug opacity-80">
                Bring any OpenAPI spec & we&apos;ll handle the rest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
