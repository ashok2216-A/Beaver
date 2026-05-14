'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, 
  FileJson, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Loader2, 
  Globe, 
  Search, 
  ArrowLeft,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  category: string;
  domain: string;
  source_url?: string;
  base_url?: string;
  description?: string;
  auth_type?: string;
}

export default function NewAgentPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [tab, setTab] = useState<"templates" | "url" | "manual">("templates");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  
  // States for Metadata
  const [agentName, setAgentName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [description, setDescription] = useState("");
  const [apiSpec, setApiSpec] = useState("");
  const [authType, setAuthType] = useState("bearer");
  const [authHeader, setAuthHeader] = useState("");
  const [authSecret, setAuthSecret] = useState("");
  
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Fetch templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/templates`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
        }
      } catch (err) {
        console.error("Failed to load templates", err);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, [getToken]);

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  const handleTemplateClick = async (t: Template) => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/templates/${t.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load template");
      
      const detail = await res.json();
      setTab("url");
      setUrl(detail.source_url || "");
      
      let name = detail.name || "";
      if (name && !name.toLowerCase().endsWith("agent")) {
        name = `${name} Agent`;
      }
      setAgentName(name);
      setBaseUrl(detail.base_url || "");
      setDescription(detail.description || "");
      setAuthType(detail.auth_type || "bearer");
      toast.success(`Selected ${detail.name} template!`);
    } catch (err) {
      toast.error("Failed to load template");
    }
  };

  // URL Preview Effect
  useEffect(() => {
    const fetchPreview = async () => {
      if (!url || url.length < 10 || !url.startsWith("http")) return;
      
      setIsPreviewing(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/ingest/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        if (res.ok) {
          const data = await res.json();
          if (!agentName) setAgentName(data.name);
          if (!baseUrl) setBaseUrl(data.base_url);
          if (!description) setDescription(data.description);
        }
      } catch (err) {} finally {
        setIsPreviewing(false);
      }
    };
    const timer = setTimeout(fetchPreview, 1000);
    return () => clearTimeout(timer);
  }, [url]);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const spec = JSON.parse(e.target?.result as string);
        if (spec.info) {
          setAgentName(spec.info.title || "");
          setDescription(spec.info.description || "");
          setBaseUrl(spec.servers?.[0]?.url || "");
        }
      } catch (err) {
        setAgentName(f.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsText(f);
    toast.success(`${f.name} ready`);
  };

  const handleGenerate = async () => {
    if (!file && !url && tab !== "manual" && !apiSpec) {
      toast.error("Provide a source first");
      return;
    }
    
    setGenerating(true);
    setProgress(10);
    const interval = setInterval(() => {
      setProgress(p => (p >= 90 ? (clearInterval(interval), 90) : p + 10));
    }, 400);

    try {
      const token = await getToken();
      let res;
      
      if (tab === "manual" && file && !apiSpec) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", agentName || file.name);
        formData.append("description", description);
        formData.append("base_url", baseUrl);
        formData.append("auth_type", authType);
        formData.append("auth_header", authHeader);
        formData.append("auth_secret", authSecret);

        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/ingest/file`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
      } else if (tab === "url" && url) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/ingest/smart`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            url, 
            name: agentName,
            description,
            base_url: baseUrl,
            auth_type: authType,
            auth_header: authHeader,
            auth_secret: authSecret
          })
        });
      } else {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            name: agentName,
            description,
            base_url: baseUrl,
            auth_type: authType,
            auth_header: authHeader,
            auth_secret: authSecret,
            model_id: "gemini-2.0-flash",
            api_spec: apiSpec
          })
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "An unexpected error occurred" }));
        const errorMessage = typeof err.detail === "string" 
          ? err.detail 
          : Array.isArray(err.detail)
            ? err.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ")
            : typeof err.detail === "object" && err.detail !== null
              ? JSON.stringify(err.detail)
              : "Failed to generate agent";
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setProgress(100);
      toast.success("Agent generated!");

      try {
        const stored = localStorage.getItem("api2bot_notifications");
        const list = stored ? JSON.parse(stored) : [];
        list.unshift({
          id: Date.now(),
          title: `🤖 Agent "${agentName || data.name || "Custom"}" Created`,
          description: `Specification parameters parsed cleanly. Available in workspace logs.`
        });
        localStorage.setItem("api2bot_notifications", JSON.stringify(list));
      } catch (e) {
        console.error(e);
      }

      setTimeout(() => {
        router.push(`/dashboard/agents/${data.id}`);
      }, 500);

    } catch (err: any) {
      toast.error(err.message || "Failed to generate agent");
      
      try {
        const stored = localStorage.getItem("api2bot_notifications");
        const list = stored ? JSON.parse(stored) : [];
        list.unshift({
          id: Date.now(),
          title: `🚫 Limit Reached`,
          description: err.message || "Failed to generate agent due to plan limits."
        });
        localStorage.setItem("api2bot_notifications", JSON.stringify(list));
      } catch (e) {
        console.error(e);
      }

      setGenerating(false);
      clearInterval(interval);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create a new agent</h1>
        <p className="text-muted-foreground">
          Choose a template or use your own spec to get started.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-col items-center">
        <div className="inline-flex rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl p-1.5 shadow-xl">
          <TabButton active={tab === "templates"} onClick={() => setTab("templates")} icon={<Sparkles className="h-4 w-4 text-primary" />} label="Templates" />
          <TabButton active={tab === "url"} onClick={() => setTab("url")} icon={<Search className="h-4 w-4 text-primary" />} label="Discover Spec" />
          <TabButton active={tab === "manual"} onClick={() => setTab("manual")} icon={<Globe className="h-4 w-4 text-emerald-500" />} label="Manual / Upload" />
        </div>
      </div>

      <div className="rounded-3xl border border-white/50 bg-white/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="p-10">
          {tab === "templates" ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {isLoadingTemplates ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading template marketplace...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-border rounded-3xl">
                  <Globe className="h-10 w-10 text-muted-foreground opacity-20" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">No templates found</p>
                    <p className="text-xs text-muted-foreground">Check your connection or manifest.json</p>
                  </div>
                </div>
              ) : (
                categories.map((cat) => (
                  <div key={cat} className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-3">
                      <span className="h-px flex-1 bg-border/50" />
                      {cat} ({templates.filter((t) => t.category === cat).length})
                      <span className="h-px flex-1 bg-border/50" />
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {templates.filter((t) => t.category === cat).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleTemplateClick(t)}
                          className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/40 bg-white/20 p-4 text-center transition-all hover:bg-white/40 hover:border-primary/40 hover:shadow-glow-sm hover:-translate-y-1 backdrop-blur-sm"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/40 p-2 shadow-inner transition-colors group-hover:bg-primary/10 overflow-hidden">
                            <img 
                              src={`https://www.google.com/s2/favicons?sz=128&domain=${t.domain}`} 
                              alt={t.name}
                              className="h-full w-full object-contain transition-all duration-300 scale-90 group-hover:scale-110"
                            />
                          </div>
                          <p className="text-xs font-bold leading-tight truncate w-full text-foreground/80">{t.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : tab === "url" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2">
                  Documentation or Spec URL
                </label>
                <div className="relative">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste documentation link (e.g. developers.notion.com)"
                    className="h-14 w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 px-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
                  />
                  {isPreviewing && (
                    <div className="absolute right-4 top-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground italic pl-1">
                  Our system will automatically search the URL for a hidden OpenAPI or Swagger specification file.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Row: Name and URL */}
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Agent Name</label>
                  <input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g. My Custom API"
                    className="h-14 w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 px-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Base URL</label>
                  <input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="h-14 w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 px-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Middle Row: Description */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold">Description (Optional)</label>
                  <span className="text-[10px] font-bold text-muted-foreground/50">{description.length}/150</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={150}
                  placeholder="What does this agent do?"
                  className="w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 p-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner min-h-[100px]"
                />
              </div>

              {/* Bottom Row: Side-by-Side Upload and Spec */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2 flex flex-col">
                  <label className="text-sm font-bold">Import OpenAPI Spec</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                    className={cn(
                      "relative flex-1 min-h-[220px] rounded-[2rem] border-2 border-dashed p-6 text-center transition-all flex flex-col items-center justify-center",
                      dragOver ? "border-primary bg-primary/10 shadow-glow-sm" : "border-white/40 bg-white/20 hover:bg-white/40 hover:border-primary/40"
                    )}
                  >
                    <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow mb-3">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold">Drag & Drop file</h3>
                    <p className="text-[10px] text-muted-foreground mt-1">JSON or YAML supported</p>
                    <label className="mt-4">
                      <input type="file" accept=".json,.yaml,.yml" className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
                      <span className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-border bg-background px-4 text-[10px] font-bold hover:bg-muted transition-all">
                        Browse Files
                      </span>
                    </label>
                    {file && (
                      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-left w-full max-w-[240px]">
                        <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <FileJson className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold truncate">{file.name}</p>
                        </div>
                        <Check className="h-3 w-3 text-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 flex flex-col">
                  <label className="text-sm font-bold flex items-center gap-2">
                    Raw API Specification
                    {!file && <span className="text-[10px] font-normal text-muted-foreground">(Required if no file)</span>}
                  </label>
                  <textarea
                    value={apiSpec}
                    onChange={(e) => setApiSpec(e.target.value)}
                    placeholder='{"openapi": "3.0.0", ...}'
                    className="flex-1 w-full rounded-[2rem] border border-white/50 bg-white/40 p-6 text-xs outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-mono min-h-[220px] shadow-inner"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Configuration & Auth Fields (Visible when name/file/preview exists) */}
          {(agentName || isPreviewing || file) && (
            <div className="mt-10 grid gap-8 animate-in fade-in slide-in-from-top-4 pt-10 border-t border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Final Agent Name</label>
                  <input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 px-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">API Base Endpoint</label>
                  <div className="relative">
                    <input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 pl-12 pr-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                    />
                    <Globe className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Auth Configuration */}
              <div className="pt-6 border-t border-border/50">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-6">Security Configuration</h4>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/70">Auth Type</label>
                    <select 
                      value={authType}
                      onChange={(e) => setAuthType(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 px-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 appearance-none shadow-inner transition-all"
                    >
                      <option value="none">No Auth</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="apikey">Custom Header (API Key)</option>
                      <option value="query_key">Query Parameter (URL)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/70">Auth Header Name</label>
                    <input 
                      value={authHeader}
                      onChange={(e) => setAuthHeader(e.target.value)}
                      placeholder="Authorization"
                      className="h-14 w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 px-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-mono shadow-inner"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-foreground/70">API Secret / Access Token</label>
                    <input 
                      type="password"
                      value={authSecret}
                      onChange={(e) => setAuthSecret(e.target.value)}
                      placeholder="sk-••••••••••••••••••••••••••••"
                      className="h-14 w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 px-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-mono shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {generating && (
            <div className="mt-10 transition-all animate-in fade-in zoom-in-95 bg-slate-500/5 rounded-3xl p-8 border border-slate-200/50 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="font-bold flex items-center gap-3 text-slate-700">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  Generating your agent engine…
                </span>
                <span className="font-mono text-slate-900 font-bold">{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200/50 overflow-hidden mb-6">
                <div className="h-full bg-slate-900 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <ul className="grid grid-cols-2 gap-4">
                <Step done={progress > 20} label="Parsing schema" />
                <Step done={progress > 50} label="Mapping tools" />
                <Step done={progress > 80} label="System prompt" />
                <Step done={progress >= 100} label="Finalizing" />
              </ul>
            </div>
          )}

          <div className="mt-10 flex justify-end items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} disabled={generating} className="rounded-xl px-6">
              Cancel
            </Button>
            <Button 
              variant="hero" 
              size="lg" 
              onClick={handleGenerate} 
              disabled={generating || (tab === "url" && !url) || (tab === "manual" && (!agentName || (!apiSpec && !file)))}
              className="rounded-xl h-12 px-8 min-w-[180px] shadow-glow"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Working...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Agent
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Step = ({ done, label }: { done: boolean; label: string }) => (
  <li className="flex items-center gap-3">
    <div className={cn(
      "flex h-5 w-5 items-center justify-center rounded-full transition-all duration-500",
      done ? "bg-emerald-500 text-white rotate-0" : "bg-muted text-muted-foreground/30 -rotate-90"
    )}>
      {done ? <Check className="h-3 w-3 stroke-[3px]" /> : <div className="h-1 w-1 rounded-full bg-current" />}
    </div>
    <span className={cn(
      "text-sm font-medium transition-colors duration-300",
      done ? "text-foreground" : "text-muted-foreground/40"
    )}>
      {label}
    </span>
  </li>
);

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap",
      active 
        ? "bg-white/60 shadow-xl text-primary scale-105 border border-white/50" 
        : "text-muted-foreground hover:text-foreground hover:bg-white/20"
    )}
  >
    {icon} {label}
  </button>
);
