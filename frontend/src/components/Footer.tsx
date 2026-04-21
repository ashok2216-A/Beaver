import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export const Footer = () => (
  <footer className="border-t border-border bg-secondary/30">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-4 border-b border-border/50 pb-12">
        <div className="space-y-3 col-span-2 md:col-span-1">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            Turn any API into a production-ready AI assistant in seconds.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 col-span-2 md:col-span-3">
          <div>
            <h4 className="font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-medium">
              <li><a href="#features" className="hover:text-primary transition-base">Features</a></li>
              <li><a href="#integrations" className="hover:text-primary transition-base">Ecosystem</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-medium">
              <li><Link to="/about" className="hover:text-primary transition-base">About</Link></li>
              <li><a href="#" className="hover:text-primary transition-base">Blog</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">
        <p>© {new Date().getFullYear()} Agently Studio. All rights reserved.</p>
        <div className="flex gap-6">
           <span>Privacy Security Trust</span>
        </div>
      </div>
    </div>
  </footer>
);
