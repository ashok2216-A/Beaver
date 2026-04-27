"use client";

import React, { useState } from "react";
import { Check, Rocket, Zap, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Perfect for exploring the power of agentic API tooling.",
    buttonText: "Current Plan",
    features: [
      "1 Active AI Agent",
      "Standard Reasoning Speed",
      "Full OpenAPI 3.0 Support",
      "Embeddable Chat Widget",
      "Community Support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$16",
    description: "For production-ready teams scaling their AI automation.",
    buttonText: "Upgrade to Pro",
    popular: true,
    features: [
      "Unlimited AI Agents",
      "Priority Edge Deployment",
      "Custom Tooling Logic",
      "Extended Context Windows",
      "Priority 24/7 Support",
      "Whitelabel Dashboard",
    ],
  },
];

export function PricingTable({ currentPlan = "free" }: { currentPlan?: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleUpgrade = async (planId: string) => {
    if (planId === "free") return;
    setLoading(planId);
    
    try {
      const token = await getToken();
      const res = await fetch("/api/v1/billing/create-checkout-session", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Billing error:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto p-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative flex flex-col p-8 rounded-2xl border transition-all duration-300",
            plan.popular 
              ? "bg-zinc-900 border-zinc-700 shadow-2xl shadow-zinc-500/10 scale-105 z-10 text-white" 
              : "bg-card border-border text-card-foreground"
          )}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 uppercase tracking-wider shadow-lg">
              <Zap className="w-3 h-3 fill-black" />
              Most Popular
            </div>
          )}

          <div className="mb-8">
            <h3 className={cn(
              "text-3xl font-bold mb-2",
              plan.popular ? "text-white" : "text-foreground"
            )}>{plan.name}</h3>
            <p className={cn(
              "text-sm leading-relaxed",
              plan.popular ? "text-zinc-400" : "text-muted-foreground"
            )}>{plan.description}</p>
          </div>

          <div className="mb-8 flex items-baseline gap-1">
            <span className={cn(
              "text-5xl font-bold tracking-tight",
              plan.popular ? "text-white" : "text-foreground"
            )}>{plan.price}</span>
            <span className={cn(
              "font-medium",
              plan.popular ? "text-zinc-500" : "text-muted-foreground"
            )}>/mo</span>
          </div>

          <div className="space-y-4 mb-10 flex-1">
            {plan.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={cn(
                  "mt-1 rounded-full p-0.5",
                  plan.popular ? "bg-white/10" : "bg-primary/10"
                )}>
                  <Check className={cn(
                    "w-3 h-3",
                    plan.popular ? "text-white" : "text-primary"
                  )} />
                </div>
                <span className={cn(
                  "text-sm",
                  plan.popular ? "text-zinc-300" : "text-foreground"
                )}>{feature}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => handleUpgrade(plan.id)}
            disabled={plan.id === currentPlan || loading === plan.id}
            className={cn(
              "w-full h-12 text-sm font-semibold transition-all group",
              plan.id === currentPlan
                ? (plan.popular ? "bg-zinc-800 text-zinc-500 border-zinc-700" : "bg-muted text-muted-foreground cursor-default")
                : plan.popular
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {loading === plan.id ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : plan.id === currentPlan ? (
              "Current Plan"
            ) : (
              <span className="flex items-center gap-2">
                {plan.buttonText}
                <Rocket className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
