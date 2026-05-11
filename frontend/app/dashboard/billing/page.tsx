"use client";

import React, { useEffect, useState } from "react";
import { PricingTable } from "@/components/billing/pricing-table";
import { CreditCard, ShieldCheck, History, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useAuth } from "@clerk/nextjs";

export default function BillingPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = await getToken();
        const res = await fetch("/api/v1/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.plan_type) {
          setCurrentPlan(data.plan_type);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    }
    if (user) fetchUser();
  }, [user?.id, getToken]);

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/v1/billing/create-portal-session", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Billing & Subscription</h2>
          <p className="text-muted-foreground">
            Manage your plan, payment methods, and invoices.
          </p>
        </div>
        {currentPlan === "pro" && (
          <Button 
            variant="outline" 
            className="border-border text-foreground hover:bg-accent"
            onClick={handleManageBilling}
            disabled={loading}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {loading ? "Opening..." : "Manage Subscription"}
          </Button>
        )}
      </div>

      <div className="space-y-12">
        <section>
          <div className="mb-8 text-center">
            <span className="px-3 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-xs font-medium text-muted-foreground inline-flex items-center gap-2 mb-4">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Secure payments powered by Stripe
            </span>
            <h3 className="text-2xl font-semibold text-foreground">Choose Your Plan</h3>
          </div>
          <PricingTable currentPlan={currentPlan} />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="p-6 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl shadow-sm">
            <History className="w-5 h-5 text-muted-foreground mb-4" />
            <h4 className="text-foreground font-medium mb-2">Billing History</h4>
            <p className="text-muted-foreground text-sm mb-4">Access all your past invoices and payment receipts.</p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
              onClick={handleManageBilling}
            >
              View Invoices <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="p-6 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl shadow-sm">
            <CreditCard className="w-5 h-5 text-muted-foreground mb-4" />
            <h4 className="text-foreground font-medium mb-2">Payment Methods</h4>
            <p className="text-muted-foreground text-sm mb-4">Update your card details or add a new payment method.</p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
              onClick={handleManageBilling}
            >
              Update Payment <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
 
          <div className="p-6 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl shadow-sm">
            <ShieldCheck className="w-5 h-5 text-muted-foreground mb-4" />
            <h4 className="text-foreground font-medium mb-2">Secure Billing</h4>
            <p className="text-muted-foreground text-sm mb-4">Your data is secured with AES-256 and SSL encryption.</p>
            <div className="flex items-center gap-2 mt-4 opacity-70 dark:opacity-50 grayscale dark:invert-0">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-4" alt="Stripe" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
