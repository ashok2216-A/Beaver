import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/clerk-react";

export const Navbar = () => {
  return (
    <header className="fixed top-6 left-0 right-0 z-50 px-4 md:px-0 animate-fade-in">
      <div className="container max-w-5xl mx-auto">
        <div className="glass-premium rounded-2xl px-6 py-2.5 flex items-center justify-between border-white/5 ring-1 ring-white/10 shadow-glow-sm transition-all duration-500">
          <div className="flex items-center gap-12">
            <Logo />
            <nav className="hidden md:flex items-center gap-8">
              {[
                { name: "Features", href: "#features" },
                { name: "Eco", href: "#integrations" },
                { name: "Pricing", href: "#pricing" },
                { name: "Docs", href: "/docs" },
              ].map((link) => (
                <a 
                  key={link.name}
                  href={link.href} 
                  className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-primary transition-all duration-300"
                >
                  {link.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="hidden md:inline-flex text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-primary transition-colors">
                  Log in
                </button>
              </SignInButton>
              <Button asChild variant="hero" size="sm" className="rounded-xl px-5 h-9 text-[10px] font-extrabold uppercase tracking-[0.2em] shadow-glow">
                <Link to="/dashboard">Get started</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-primary">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
};
