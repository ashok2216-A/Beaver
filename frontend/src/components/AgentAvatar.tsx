import { useMemo } from "react";

interface AgentAvatarProps {
  id: number;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const AgentAvatar = ({ id, name, className = "", size = "md" }: AgentAvatarProps) => {
  // Ultra-vibrant tech palettes with higher luminosity
  const palettes = [
    { bg: "bg-slate-950", accent: "bg-indigo-400", glow: "shadow-[0_0_12px_rgba(129,140,248,0.8)]" },
    { bg: "bg-slate-950", accent: "bg-emerald-400", glow: "shadow-[0_0_12px_rgba(52,211,153,0.8)]" },
    { bg: "bg-slate-950", accent: "bg-rose-400", glow: "shadow-[0_0_12px_rgba(251,113,133,0.8)]" },
    { bg: "bg-slate-950", accent: "bg-violet-400", glow: "shadow-[0_0_12px_rgba(167,139,250,0.8)]" },
    { bg: "bg-slate-950", accent: "bg-sky-400", glow: "shadow-[0_0_12px_rgba(56,189,248,0.8)]" },
    { bg: "bg-slate-950", accent: "bg-amber-400", glow: "shadow-[0_0_12px_rgba(251,191,36,0.8)]" },
  ];

  const palette = palettes[id % palettes.length];

  const sizeClasses = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-10 w-10 rounded-xl",
    lg: "h-12 w-12 rounded-2xl",
  };

  // Deterministic 4x4 data pattern
  const dots = useMemo(() => {
    const d = [];
    let seed = id * 54321;
    for (let i = 0; i < 16; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      d.push({
        filled: seed % 2 === 0, // More density
        scale: 0.7 + (seed % 3) * 0.15,
      });
    }
    return d;
  }, [id]);

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 shadow-lg overflow-hidden ${palette.bg} ${sizeClasses[size]} ${className}`}>
      {/* Subtle radial inner glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]" />
      
      {/* Pattern Layer: 4x4 Bright Dot Matrix */}
      <div className="grid grid-cols-4 grid-rows-4 gap-1.5 w-full h-full p-2">
        {dots.map((dot, i) => (
          <div
            key={i}
            className={`relative w-full h-full rounded-full transition-all duration-700 ${
              dot.filled ? palette.accent : "bg-white/10"
            } ${dot.filled ? palette.glow : ""}`}
            style={{ 
              opacity: dot.filled ? 1 : 0.15,
              transform: dot.filled ? `scale(${dot.scale})` : "scale(0.5)",
            }}
          >
            {/* White core for extra brightness */}
            {dot.filled && (
              <div className="absolute inset-[30%] bg-white rounded-full opacity-60 blur-[1px]" />
            )}
          </div>
        ))}
      </div>

      {/* Surface shine */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 border border-white/10 rounded-[inherit] pointer-events-none" />
    </div>
  );
};
