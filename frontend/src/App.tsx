import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from "@clerk/clerk-react";
import { setClerkToken } from "@/lib/api";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateAgent from "./pages/CreateAgent";
import AgentBuilder from "./pages/AgentBuilder";
import Deploy from "./pages/Deploy";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import Agents from "./pages/Agents";
import NotFound from "./pages/NotFound";
import Docs from "./pages/Docs";
import About from "./pages/About";
import ApiReference from "./pages/ApiReference";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Prevent background refetches when switching tabs/windows
      retry: 1, // Limit retries to prevent long loading states on failure
    },
  },
});

const TokenSync = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  useEffect(() => {
    const sync = async () => {
      if (isLoaded && isSignedIn) {
        const token = await getToken();
        setClerkToken(token);
      } else {
        setClerkToken(null);
      }
    };
    sync();
    // Refresh every 45 seconds to keep the token fresh (Clerk tokens expire every 60s)
    const interval = setInterval(sync, 45000);
    return () => clearInterval(interval);
  }, [getToken, isLoaded, isSignedIn]);
  
  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TokenSync />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/about" element={<About />} />
          <Route path="/api-reference" element={<ApiReference />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
          <Route path="/agents/new" element={<ProtectedRoute><CreateAgent /></ProtectedRoute>} />
          <Route path="/agents/builder" element={<ProtectedRoute><AgentBuilder /></ProtectedRoute>} />
          <Route path="/deploy" element={<ProtectedRoute><Deploy /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
