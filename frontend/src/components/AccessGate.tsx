import React, { useState } from "react";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

interface AccessGateProps {
  children: React.ReactNode;
}

export const AccessGate = ({ children }: AccessGateProps) => {
  const [isLocked, setIsLocked] = useState(!localStorage.getItem("admin_key"));
  const [key, setKey] = useState("");

  const handleUnlock = () => {
    if (key.trim()) {
      localStorage.setItem("admin_key", key.trim());
      setIsLocked(false);
      window.location.reload(); // Refresh to apply headers
    }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Studio Locked</h1>
          <p className="mt-2 text-muted-foreground">
            Please enter your Master Access Key to continue.
          </p>
        </div>

        <div className="space-y-4 rounded-3xl border border-border bg-gradient-card p-8 shadow-soft">
          <div className="space-y-2">
            <label className="text-sm font-medium">Access Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder="••••••••••••••••"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary/50 focus:ring-soft transition-base"
              autoFocus
            />
          </div>

          <Button variant="hero" className="w-full h-12" onClick={handleUnlock}>
            Unlock Studio
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            End-to-end encrypted session
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Contact your administrator if you've lost your key.
        </p>
      </div>
    </div>
  );
};
