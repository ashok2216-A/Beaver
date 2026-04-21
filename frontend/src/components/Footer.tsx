import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export const Footer = () => (
  <footer className="relative border-t border-border bg-background pt-24 pb-12 overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    
    <div className="container">
      <div className="grid gap-12 md:grid-cols-12 mb-16">
        <div className="md:col-span-4 space-y-6">
          <Logo />
          <p className="text-muted-foreground leading-relaxed max-w-sm">
            The world's first API-to-Agent playground. Ship production-ready AI assistants directly from your OpenAPI documentation.
          </p>
          <div className="flex gap-4">
            {/* Social Icons Mockup as they aren't imported currently */}
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
              <span className="text-xs font-bold">X</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
              <span className="text-xs font-bold">GH</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground font-medium">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#demo" className="hover:text-primary transition-colors">Live Demo</a></li>
              <li><a href="#integrations" className="hover:text-primary transition-colors">Integrations</a></li>
              <li><Link to="/changelog" className="hover:text-primary transition-colors">Changelog</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground">Resources</h4>
            <ul className="space-y-3 text-sm text-muted-foreground font-medium">
              <li><Link to="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">SDKs</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground font-medium">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-xs text-muted-foreground/60 font-medium">
          © {new Date().getFullYear()} Agently Studio. Built for developers, by developers.
        </p>
        <div className="flex gap-8 text-[10px] uppercase tracking-widest text-muted-foreground/40 font-bold">
           <span className="hover:text-primary cursor-pointer transition-colors">System Status</span>
           <span className="hover:text-primary cursor-pointer transition-colors">Security</span>
        </div>
      </div>
    </div>
  </footer>
);
