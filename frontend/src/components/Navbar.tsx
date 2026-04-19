import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-10">
            <Logo />
            <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-base">Features</a>
              <a href="#demo" className="hover:text-foreground transition-base">Demo</a>
              <a href="#pricing" className="hover:text-foreground transition-base">Pricing</a>
              <a href="#" className="hover:text-foreground transition-base">Docs</a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button>
            <Button asChild variant="hero" size="sm">
              <Link to="/dashboard">Get started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
