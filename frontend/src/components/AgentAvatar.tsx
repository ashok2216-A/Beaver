import { useMemo } from "react";

interface AgentAvatarProps {
  id: number;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Deterministic hash for pseudo-random values based on seed
const hash = (seed: number) => {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const AgentAvatar = ({ id, name, className = "", size = "md" }: AgentAvatarProps) => {
  const avatarData = useMemo(() => {
    // 1. Generate unique color (256x256x256 variations)
    const r = Math.floor(hash(id * 10) * 256);
    const g = Math.floor(hash(id * 20) * 256);
    const b = Math.floor(hash(id * 30) * 256);
    
    // Adjust colors for light background: lower brightness, higher saturation
    const accentColor = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
    const glowColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
    const mutedColor = `rgba(${r}, ${g}, ${b}, 0.05)`;

    // 2. Generate unique grid size (3x3, 4x4, or 5x5)
    const gridSize = Math.floor(hash(id * 40) * 3) + 3;
    
    // 3. Generate unique dot pattern
    const dots = [];
    const totalDots = gridSize * gridSize;
    for (let i = 0; i < totalDots; i++) {
      const h = hash(id * 50 + i);
      dots.push({
        filled: h > 0.45, // ~55% density
        scale: 0.6 + (hash(id * 60 + i) * 0.4),
        rounded: hash(id * 70 + i) > 0.5 ? "rounded-full" : "rounded-sm",
      });
    }

    return { accentColor, glowColor, mutedColor, gridSize, dots };
  }, [id]);

  const sizeClasses = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-10 w-10 rounded-xl",
    lg: "h-12 w-12 rounded-2xl",
  };

  const gridCols = {
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 shadow-3d overflow-hidden bg-slate-100 border border-white/60 ${sizeClasses[size]} ${className}`}
    >
      {/* Subtle radial inner glow (darker for light mode) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02),transparent_70%)]" />
      
      {/* Pattern Layer: Dynamic Dot Matrix */}
      <div 
        className={`grid ${gridCols[avatarData.gridSize as keyof typeof gridCols]} gap-1 w-full h-full p-2`}
        style={{ gridTemplateRows: `repeat(${avatarData.gridSize}, minmax(0, 1fr))` }}
      >
        {avatarData.dots.map((dot, i) => (
          <div
            key={i}
            className={`relative w-full h-full transition-all duration-700 ${dot.rounded}`}
            style={{ 
              backgroundColor: dot.filled ? avatarData.accentColor : "rgba(0,0,0,0.05)",
              boxShadow: dot.filled ? `0 1px 4px ${avatarData.glowColor}` : "none",
              opacity: dot.filled ? 1 : 0.08,
              transform: dot.filled ? `scale(${dot.scale})` : "scale(0.4)",
            }}
          >
            {/* White core for extra brightness */}
            {dot.filled && (
              <div className="absolute inset-[30%] bg-white rounded-full opacity-40 blur-[0.5px]" />
            )}
          </div>
        ))}
      </div>

      {/* Surface shine */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 border border-white/20 rounded-[inherit] pointer-events-none" />
    </div>
  );
};


