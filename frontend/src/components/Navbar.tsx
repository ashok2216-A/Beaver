import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/clerk-react";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "How it Works", href: "#how-it-works" },
  { name: "Pricing", href: "#pricing" },
  { name: "Docs", href: "/docs" },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 animate-fade-in">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <nav className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-6 py-3 shadow-lg">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Log in
                </button>
              </SignInButton>
              <Button asChild size="sm" className="rounded-lg px-5 font-semibold">
                <Link to="/dashboard">Get Started</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button asChild variant="ghost" size="sm" className="font-medium">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-lg animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="text-base font-medium text-muted-foreground py-2">
                      Log in
                    </button>
                  </SignInButton>
                  <Button asChild className="w-full rounded-xl font-semibold">
                    <Link to="/dashboard">Get Started</Link>
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Button asChild className="w-full rounded-xl font-semibold">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                </SignedIn>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
