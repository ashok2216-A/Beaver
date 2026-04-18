import { Link } from "react-router-dom";

interface LogoProps {
  to?: string;
  compact?: boolean;
}

export const Logo = ({ to = "/", compact = false }: LogoProps) => (
  <Link to={to} className="inline-flex items-center gap-2 font-bold text-lg tracking-tight">
    <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-primary-foreground">
        <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 22V12M4 7l8 5 8-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </span>
    {!compact && <span>Agently</span>}
  </Link>
);
