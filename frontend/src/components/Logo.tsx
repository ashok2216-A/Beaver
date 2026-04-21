import { Link } from "react-router-dom";

interface LogoProps {
  to?: string;
  compact?: boolean;
}

export const Logo = ({ to = "/", compact = false }: LogoProps) => (
  <Link to={to} className="inline-flex items-center gap-3 font-extrabold text-xl tracking-tighter group">
    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow transition-transform duration-500 group-hover:scale-110">
      <svg viewBox="0 0 40 40" fill="none" className="h-6 w-6 text-primary-foreground">
        {/* Geometric Hex Frame */}
        <path d="M20 5L33 12.5V27.5L20 35L7 27.5V12.5L20 5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="opacity-40" />
        {/* API-Studio Core Symbol (Stylized Bracket Logic) */}
        <path d="M14 15L10 20L14 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26 15L30 20L26 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="20" r="3" fill="currentColor" className="animate-pulse" />
      </svg>
      <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer-flow" />
    </div>
    {!compact && (
      <div className="flex flex-col leading-none">
        <span className="text-foreground -mb-0.5">API</span>
        <span className="text-primary text-xs uppercase tracking-[0.3em] font-black opacity-80">Studio</span>
      </div>
    )}
  </Link>
);
