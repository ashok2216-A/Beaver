import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Menu } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/clerk-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Navbar = () => {
  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Demo", href: "#demo" },
    { name: "Ecosystem", href: "#integrations" },
  ];

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-0">
      <div className="container max-w-7xl mx-auto">
        <div className="glass-premium rounded-2xl px-6 h-16 flex items-center justify-between transition-all duration-500">
          <div className="flex items-center gap-10">
            <Logo />
            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
              {navLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href} 
                  className="relative text-foreground/70 hover:text-primary transition-colors group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-primary font-medium transition-colors">Sign in</Button>
                </SignInButton>
                <Button asChild variant="hero" size="sm" className="shadow-glow px-6 font-bold">
                  <Link to="/dashboard">Get started</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button asChild variant="ghost" size="sm" className="mr-2 text-foreground/70 hover:text-primary font-medium transition-colors">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground/70">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-zinc-950 border-l border-white/5 p-8">
                  <SheetHeader className="text-left mb-12">
                    <SheetTitle><Logo /></SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-8">
                    {navLinks.map((link) => (
                      <a 
                        key={link.name}
                        href={link.href} 
                        className="text-2xl font-bold text-foreground/60 hover:text-primary transition-colors"
                      >
                        {link.name}
                      </a>
                    ))}
                    <div className="pt-8 border-t border-white/5 space-y-4">
                       <SignedOut>
                         <SignInButton mode="modal">
                           <Button variant="outline" className="w-full glass-premium h-12 text-lg">Sign in</Button>
                         </SignInButton>
                         <Button asChild variant="hero" className="w-full h-12 text-lg font-bold">
                           <Link to="/dashboard">Get started</Link>
                         </Button>
                       </SignedOut>
                       <SignedIn>
                         <Button asChild variant="hero" className="w-full h-12 text-lg font-bold">
                           <Link to="/dashboard">Go to Dashboard</Link>
                         </Button>
                       </SignedIn>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
