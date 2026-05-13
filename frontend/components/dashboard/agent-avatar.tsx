'use client'

import { useMemo } from "react";
import { cn, hash, getAgentColor } from "@/lib/utils";

interface AgentAvatarProps {
  id: number;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  minimal?: boolean;
}

export const AgentAvatar = ({ id, name, className = "", size = "md", minimal = false }: AgentAvatarProps) => {
  const avatarData = useMemo(() => {
    const colors = getAgentColor(id);
    const accentColor = colors.accent;
    const glowColor = colors.glow;
    const mutedColor = colors.muted;

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
    xl: "h-16 w-16 rounded-3xl",
  };

  const gridCols = {
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  };

  return (
    <div 
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300",
        minimal 
          ? "bg-transparent border-none shadow-none" 
          : "bg-gradient-to-br from-white to-slate-100 dark:from-muted/50 dark:to-muted/20 border-t border-white/80 dark:border-white/10 backdrop-blur-sm shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_4px_8px_-2px_rgba(0,0,0,0.06),inset_0_-2px_4px_rgba(0,0,0,0.05)]",
        "[--avatar-top-shine:rgba(255,255,255,0.9)] dark:[--avatar-top-shine:rgba(255,255,255,0.05)]",
        sizeClasses[size],
        className
      )}
    >
      {/* Subtle radial inner glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_70%)]" />
      
      {/* Pattern Layer: Dynamic Dot Matrix */}
      <div 
        className={cn(
          "grid w-full h-full",
          size === "sm" ? "gap-0.5" : "gap-1",
          minimal ? "p-0" : size === "sm" ? "p-1" : "p-2",
          gridCols[avatarData.gridSize as keyof typeof gridCols] || "grid-cols-4"
        )}
        style={{ gridTemplateRows: `repeat(${avatarData.gridSize}, minmax(0, 1fr))` }}
      >
        {avatarData.dots.map((dot, i) => (
          <div
            key={i}
            className={cn("relative w-full h-full transition-all duration-700", dot.rounded)}
            style={{ 
              backgroundColor: dot.filled ? avatarData.accentColor : "rgba(0,0,0,0.03)",
              boxShadow: dot.filled ? `0 1px 6px ${avatarData.glowColor}` : "none",
              opacity: dot.filled ? 1 : 0.05,
              transform: dot.filled ? `scale(${dot.scale})` : "scale(0.4)",
            }}
          >
            {/* White core for extra brightness */}
            {dot.filled && (
              <div className="absolute inset-[30%] bg-white rounded-full opacity-60 blur-[0.5px]" />
            )}
          </div>
        ))}
      </div>

      {/* Surface shine & 3D effects */}
      {!minimal && (
        <>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none dark:opacity-0" />
          <div className="absolute inset-0 border border-white/20 dark:border-white/5 rounded-[inherit] pointer-events-none" />
          {/* Bevel effect - Light mode only */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-white/60 dark:hidden" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/5 dark:hidden" />
        </>
      )}
    </div>
  );
};
