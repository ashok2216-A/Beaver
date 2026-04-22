import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export const Footer = () => (
  <footer className="relative border-t border-white/5 bg-background pt-32 pb-16 overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden />
    
    <div className="container max-w-7xl mx-auto px-4 md:px-0">
      <div className="grid gap-16 md:grid-cols-12 mb-20">
        <div className="md:col-span-5 space-y-8 text-left">
          <Logo />
          <p className="text-muted-foreground/70 leading-relaxed max-w-sm font-medium text-lg">
            Empowering engineers to bridge the gap between static APIs and autonomous reasoning agents with Beaver.
          </p>
          <div className="flex gap-4">
             {[
               { name: 'Github', slug: 'github' },
               { name: 'X', slug: 'x' },
               { name: 'Discord', slug: 'discord' }
             ].map(social => (
               <div key={social.name} className="h-10 w-10 rounded-xl bg-secondary/50 border border-white/5 flex items-center justify-center hover:bg-primary/20 transition-all cursor-pointer group">
                  <img src={`https://cdn.simpleicons.org/${social.slug}/ffffff`} alt={social.name} className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
               </div>
             ))}
          </div>
        </div>

        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10">
          <div className="space-y-6">
            <h4 className="font-extrabold text-xs uppercase tracking-[0.25em] text-foreground/40">Product</h4>
            <ul className="space-y-4 text-sm font-bold tracking-tight text-muted-foreground/60">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#demo" className="hover:text-primary transition-colors">Live Demo</a></li>
              <li><a href="#integrations" className="hover:text-primary transition-colors">Integrations</a></li>

            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-extrabold text-xs uppercase tracking-[0.25em] text-foreground/40">Resources</h4>
            <ul className="space-y-4 text-sm font-bold tracking-tight text-muted-foreground/60">
              <li><Link to="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link to="/api-reference" className="hover:text-primary transition-colors">API Reference</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-extrabold text-xs uppercase tracking-[0.25em] text-foreground/40">Legal</h4>
            <ul className="space-y-4 text-sm font-bold tracking-tight text-muted-foreground/60">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[11px] text-muted-foreground/30 font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Beaver. Built for the agent-first world.
        </p>
        <div className="flex gap-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/20 font-extrabold">
           <span className="hover:text-primary cursor-pointer transition-colors">Security Audit</span>
        </div>
      </div>
    </div>
  </footer>
);
