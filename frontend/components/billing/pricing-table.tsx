"use client";

import React, { useState } from "react";
import { Check, Rocket, Zap, Globe, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Provider = "razorpay" | "stripe";

interface PricingPlan {
  id: string;
  name: string;
  price: {
    razorpay: string;
    stripe: string;
  };
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: { razorpay: "₹0", stripe: "$0" },
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
    price: { razorpay: "₹1,299", stripe: "$16" },
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
  const [provider, setProvider] = useState<Provider>("stripe");
  const [config, setConfig] = useState<{ payment_provider: string; razorpay_key_id: string } | null>(null);
  const { getToken } = useAuth();

  React.useEffect(() => {
    fetch("/api/v1/billing/config")
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        if (data.payment_provider && data.payment_provider !== "both") {
          setProvider(data.payment_provider as Provider);
        } else if (data.payment_provider === "both") {
          setProvider("razorpay"); // Default to razorpay if both available for India-focus
        }
      });
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === "free" || !config) return;
    setLoading(planId);
    
    try {
      const token = await getToken();
      const endpoint = provider === "razorpay" 
        ? "/api/v1/billing/create-subscription" 
        : "/api/v1/billing/create-checkout-session";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      
      const data = await res.json();
      
      if (provider === "stripe" && data.url) {
        window.location.href = data.url;
      } else if (provider === "razorpay" && data.subscription_id) {
        const options = {
          key: config?.razorpay_key_id || data.razorpay_key_id,
          subscription_id: data.subscription_id,
          name: "Beaver AI",
          description: "Pro Subscription",
          handler: function () {
            window.location.href = "/dashboard?checkout=success";
          },
          prefill: { email: data.user_email },
          theme: { color: "#000000" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error("Billing error:", err);
    } finally {
      setLoading(null);
    }
  };

  const showToggle = config?.payment_provider === "both";

  return (
    <div className="flex flex-col items-center">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      {/* Provider Toggle */}
      {showToggle && (
        <div className="flex items-center gap-2 p-1 bg-muted rounded-full mb-12 border border-border">
          <button
            onClick={() => setProvider("razorpay")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all",
              provider === "razorpay" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CreditCard className="w-4 h-4" />
            Domestic (UPI/₹)
          </button>
          <button
            onClick={() => setProvider("stripe")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all",
              provider === "stripe" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Globe className="w-4 h-4" />
            International ($)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full p-4">
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
              )}>{plan.price[provider]}</span>
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
    </div>
  );
}
