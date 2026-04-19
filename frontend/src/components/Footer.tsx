import { Logo } from "@/components/Logo";

export const Footer = () => (
  <footer className="border-t border-border bg-secondary/30">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            Turn any API into a production-ready AI assistant in seconds.
          </p>
        </div>
        {[
          { title: "Product", items: ["Features", "Pricing", "Changelog", "Roadmap"] },
          { title: "Developers", items: ["Documentation", "API Reference", "Examples", "Status"] },
          { title: "Company", items: ["About", "Blog", "Careers", "Contact"] },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="font-semibold text-sm mb-3">{col.title}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {col.items.map((i) => (
                <li key={i}><a href="#" className="hover:text-foreground transition-base">{i}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Agently, Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground transition-base">Privacy</a>
          <a href="#" className="hover:text-foreground transition-base">Terms</a>
          <a href="#" className="hover:text-foreground transition-base">Security</a>
        </div>
      </div>
    </div>
  </footer>
);
