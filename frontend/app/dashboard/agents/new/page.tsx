'use client'

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  X,
  Boxes,
  FileCode2
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
  mcp_server_url?: string;
  source_type?: string;
}

function NewAgentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();

  const tabParam = searchParams.get("tab") as "templates" | "manual" | null;
  const [tab, setTab] = useState<"templates" | "manual" | null>(tabParam);
  useEffect(() => {
    if (tabParam) setTab(tabParam);
  }, [tabParam]);

  const [file, setFile] = useState<File | null>(null);

  // States for Metadata
  const [agentName, setAgentName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [description, setDescription] = useState("");
  const [apiSpec, setApiSpec] = useState("");
  const [authType, setAuthType] = useState("bearer");
  const [authHeader, setAuthHeader] = useState("");
  const [authSecret, setAuthSecret] = useState("");
  const [sourceType, setSourceType] = useState("rest");
  const [mcpServerUrl, setMcpServerUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(false);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [oauthIntegrations, setOauthIntegrations] = useState<any[]>([]);
  const [providersRegistry, setProvidersRegistry] = useState<any>({});
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [connectedTools, setConnectedTools] = useState<string[]>([]);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  
  // API Key Modal State
  const [apiKeyModalProvider, setApiKeyModalProvider] = useState<Template | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [submittingApiKey, setSubmittingApiKey] = useState(false);

  const [isInitializing, setIsInitializing] = useState(true);

  const resumePendingTemplate = () => {
    const pendingRaw = localStorage.getItem('oauth_pending_template');
    if (pendingRaw) {
      localStorage.removeItem('oauth_pending_template');
      try {
        const pending = JSON.parse(pendingRaw);
        const { templateId, name, mcpUrl, sType, desc, aType } = pending;

        // Restore state and show the configuration form
        setAgentName(name);
        setBaseUrl(mcpUrl);
        setMcpServerUrl(mcpUrl);
        setSourceType(sType || "mcp_sse");
        setDescription(desc);
        setAuthType(aType);
        setTab("manual");

        toast.success(`OAuth connected! Review your agent settings and click Save Integration.`);
      } catch (parseErr) {
        console.error("Failed to resume pending template:", parseErr);
      }
    }
  };

  useEffect(() => {
    resumePendingTemplate();
    setIsInitializing(false);
  }, [tabParam]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("beaver_connected_tools");
      if (stored) setConnectedTools(JSON.parse(stored));
    } catch (e) {}
  }, []);

  // Fetch templates & OAuth integrations
  useEffect(() => {
    async function loadOauthAndTemplates() {
      try {
        const token = await getToken();
        const [templatesRes, oauthRes, providersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/templates`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/list`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/providers`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data.templates || []);
        }

        if (oauthRes.ok) {
          const data = await oauthRes.json();
          setOauthIntegrations(data || []);
        }
        
        if (providersRes.ok) {
          const data = await providersRes.json();
          setProvidersRegistry(data || {});
        }

        // Resume pending template connection after OAuth callback redirect
        resumePendingTemplate();
      } catch (err) {
        console.error("Failed to load templates or oauth", err);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    loadOauthAndTemplates();
  }, [getToken]);

  const queryParam = searchParams.get("query") || "";
  const filteredTemplates = templates.filter(t => {
    if (!queryParam) return true;
    const q = queryParam.toLowerCase();
    return t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
  });
  const categories = Array.from(new Set(filteredTemplates.map((t) => t.category)));

  // Map template IDs to their provider strings and auth types dynamically from the backend registry
  const getRegistryItemForTemplate = (t: Template) => {
    const id = (t.id || "").toLowerCase();
    for (const key in providersRegistry) {
      const item = providersRegistry[key];
      if (item.aliases && item.aliases.some((alias: string) => id.includes(alias))) {
        return item;
      }
    }
    return null;
  };

  const getProviderForTemplate = (t: Template): string | null => {
    const item = getRegistryItemForTemplate(t);
    return item ? item.provider_name : null;
  };

  const getProviderAuthType = (t: Template): 'OAUTH' | 'API_KEY' | 'NONE' => {
    const item = getRegistryItemForTemplate(t);
    return item?.auth_type || 'OAUTH'; // Default to OAUTH if unknown
  };

  // Check if a template is connected (via localStorage OR server-side Composio active connection)
  const isTemplateConnected = (t: Template): boolean => {
    if (connectedTools.includes(t.id)) return true;
    const provider = getProviderForTemplate(t);
    if (!provider) return false;
    return oauthIntegrations.some((i: any) => i.provider === provider);
  };

  const getLogoForTemplate = (t: Template) => {
    const id = (t.id || "").toLowerCase();
    if (id === "gmail") return "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg";
    if (id === "google_calendar") return "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg";
    if (id === "google_drive") return "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg";
    if (id === "google_sheets") return "https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg";
    if (id === "google_docs") return "https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg";
    if (id === "notion") return "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png";
    if (id === "slack_mcp") return "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg";
    if (id === "github_mcp") return "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg";
    if (id === "instagram") return "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg";
    if (id === "youtube") return "https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg";
    return `https://www.google.com/s2/favicons?sz=128&domain=${t.domain}`;
  };

  const handleTemplateClick = async (t: Template) => {
    setActionLoading(t.id);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/templates/${t.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load template");

      const detail = await res.json();

      let name = detail.name ? detail.name.replace(/\s+MCP$/i, "") : "";
      if (name && !name.toLowerCase().endsWith("agent")) {
        name = `${name} Agent`;
      }
      const mcpUrl = detail.mcp_server_url || detail.base_url || "";
      // Always force mcp_sse for Composio integrations — never "rest"
      const sType = detail.source_type || "mcp_sse";
      const desc = detail.description || "";
      const aType = detail.auth_type || "bearer";

      // If already connected (via localStorage OR Composio active connection), load config directly
      if (isTemplateConnected(t)) {
        setAgentName(name);
        setBaseUrl(mcpUrl);
        setMcpServerUrl(mcpUrl);
        setSourceType(sType);
        setDescription(desc);
        setAuthType(aType);
        setTab("manual");
        toast.info(`Loaded configuration for connected engine "${name}".`);
        return;
      }

      // Check if this template requires OAuth and if user has an active integration
      const oauthProvider = getProviderForTemplate(t);
      const authTypeForProvider = getProviderAuthType(t);
      
      if (oauthProvider) {
        const hasActiveIntegration = oauthIntegrations.some(
          (i: any) => i.provider === oauthProvider
        );

        if (!hasActiveIntegration) {
          if (authTypeForProvider === "API_KEY") {
            // Save pending template to resume after API key is entered
            localStorage.setItem('oauth_pending_template', JSON.stringify({
              templateId: t.id,
              name,
              mcpUrl,
              sType,
              desc,
              aType
            }));
            setApiKeyModalProvider(t);
            return;
          }

          // Save template info so we can resume after OAuth callback
          localStorage.setItem('oauth_return_to', `/dashboard/agents/new?tab=templates`);
          localStorage.setItem('oauth_pending_template', JSON.stringify({
            templateId: t.id,
            name,
            mcpUrl,
            sType,
            desc,
            aType
          }));

          // Redirect to OAuth provider authorization page
          toast.info(`Redirecting to ${oauthProvider} for authorization...`);
          const connectRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/oauth/connect/${oauthProvider}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!connectRes.ok) {
            throw new Error("Failed to generate OAuth authorization URL");
          }
          const { auth_url } = await connectRes.json();
          
          // Open OAuth in a centered popup window
          const width = 500;
          const height = 650;
          const left = window.screenX + (window.innerWidth - width) / 2;
          const top = window.screenY + (window.innerHeight - height) / 2;
          
          const popup = window.open(
            auth_url,
            'OAuth',
            `width=${width},height=${height},left=${left},top=${top},status=yes,scrollbars=yes`
          );

          // Listen for the success message from the callback page
          const handleMessage = (event: MessageEvent) => {
            if (event.data === 'oauth_success') {
              window.removeEventListener('message', handleMessage);
              
              // Optimistically update state so the UI button reflects the connection
              setOauthIntegrations(prev => [...prev, { provider: oauthProvider }]);
              setConnectedTools(prev => {
                const next = [...prev, t.id];
                try { localStorage.setItem("beaver_connected_tools", JSON.stringify(next)); } catch (e) {}
                return next;
              });

              resumePendingTemplate();
              setActionLoading(null);
            }
          };
          window.addEventListener('message', handleMessage);

          // Poll to stop loading state if user manually closes the popup
          const timer = setInterval(() => {
            if (popup && popup.closed) {
              clearInterval(timer);
              window.removeEventListener('message', handleMessage);
              setActionLoading(null);
            }
          }, 1000);

          return;
        }
      }

      toast.info(`Connecting ${detail.name} and initiating MCP discovery...`);

      // Create agent and trigger MCP discovery
      const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name,
          description: desc,
          base_url: mcpUrl,
          auth_type: aType,
          auth_header: "",
          auth_secret: "",
          model_id: "mistral/mistral-small-latest",
          api_spec: null,
          source_type: sType,
          mcp_server_url: mcpUrl
        })
      });

      if (!createRes.ok) {
        throw new Error("Failed to create agent from template");
      }

      const agentData = await createRes.json();

      // Mark as connected in localStorage
      setConnectedTools(prev => {
        const next = [...prev, t.id];
        try { localStorage.setItem("beaver_connected_tools", JSON.stringify(next)); } catch (e) {}
        return next;
      });

      // Navigate directly to the new agent's page
      toast.success(`Connected "${name}" successfully!`);
      setTimeout(() => {
        router.push(`/dashboard/agents/${agentData.id}`);
      }, 300);

    } catch (err) {
      toast.error("Failed to connect engine and discover tools");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApiKeySubmit = async () => {
    if (!apiKeyModalProvider || !apiKeyValue.trim()) return;
    
    setSubmittingApiKey(true);
    try {
      const providerStr = getProviderForTemplate(apiKeyModalProvider);
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/apikey/${providerStr}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ api_key: apiKeyValue })
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to connect API Key.");
      }
      
      toast.success(`${apiKeyModalProvider.name} API Key saved!`);
      
      // Update state optimistically
      if (providerStr) {
        setOauthIntegrations(prev => [...prev, { provider: providerStr }]);
      }
      setConnectedTools(prev => {
        const next = [...prev, apiKeyModalProvider.id];
        try { localStorage.setItem("beaver_connected_tools", JSON.stringify(next)); } catch (e) {}
        return next;
      });

      // Cleanup & Resume
      setApiKeyModalProvider(null);
      setApiKeyValue("");
      resumePendingTemplate();
      
    } catch (err: any) {
      toast.error(err.message || "Failed to save API Key");
    } finally {
      setSubmittingApiKey(false);
      setActionLoading(null);
    }
  };

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
    if (!file && tab !== "manual" && !apiSpec && sourceType === "rest") {
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

      if (tab === "manual" && file && !apiSpec && sourceType === "rest") {
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
            model_id: "mistral/mistral-small-latest",
            api_spec: apiSpec || null,
            source_type: sourceType,
            mcp_server_url: mcpServerUrl || baseUrl
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

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] animate-in fade-in">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-4 font-medium">Initializing workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* API Key Modal */}
      {apiKeyModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 relative animate-in zoom-in-95">
            <button 
              onClick={() => {
                setApiKeyModalProvider(null);
                setApiKeyValue("");
                setActionLoading(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mb-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-border">
                <img src={getLogoForTemplate(apiKeyModalProvider)} alt="Logo" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Connect {apiKeyModalProvider.name.replace(/\s+MCP$/i, "")}</h3>
                <p className="text-xs text-muted-foreground">This integration requires an API key.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">API Key</label>
                <input
                  type="password"
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder="sk-..."
                  className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm font-mono shadow-inner outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  autoFocus
                />
              </div>
              <Button 
                onClick={handleApiKeySubmit}
                disabled={submittingApiKey || !apiKeyValue.trim()}
                className="w-full rounded-xl h-12 shadow-glow"
              >
                {submittingApiKey ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Connect Integration</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === null ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] px-4 animate-in fade-in zoom-in-95 duration-700">
          <div className="text-center max-w-3xl mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold tracking-wider uppercase shadow-xs backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Next-Gen Agent Architecture
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Select your agent <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">engine</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-normal max-w-2xl mx-auto leading-relaxed">
              Choose between pre-built enterprise Integrations or connect your existing REST API specifications in seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
            {/* Option 1: Integrations */}
            <button
              onClick={() => setTab("templates")}
              className="group relative flex flex-col p-10 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-blue-500/50 transition-all duration-500 text-left overflow-hidden hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

              <div className="flex items-center justify-between w-full mb-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-4 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                  <Boxes className="w-8 h-8" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold tracking-wide border border-blue-500/20">
                  ★ Recommended
                </span>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">
                Tool Integrations
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-10 flex-1 text-sm sm:text-base">
                Instant access to official, standardized tools for GitHub, Google Drive, Slack, and PostgreSQL. Zero custom code required.
              </p>

              <div className="flex items-center text-sm font-bold text-blue-600 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80 w-full group-hover:gap-3 transition-all duration-300">
                Explore Verified Integrations <ArrowRight className="w-4 h-4 text-blue-600" />
              </div>
            </button>

            {/* Option 2: Manual / OpenAPI */}
            <button
              onClick={() => setTab("manual")}
              className="group relative flex flex-col p-10 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-emerald-500/50 transition-all duration-500 text-left overflow-hidden hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

              <div className="flex items-center justify-between w-full mb-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 p-4 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                  <FileCode2 className="w-8 h-8" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold tracking-wide border border-slate-200 dark:border-slate-700">
                  Custom Spec
                </span>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-emerald-500 transition-colors">
                OpenAPI / REST Specification
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-10 flex-1 text-sm sm:text-base">
                Upload custom OpenAPI JSON/YAML files or manually configure endpoints, parameters, and authentication secrets for your proprietary microservices.
              </p>

              <div className="flex items-center text-sm font-bold text-emerald-500 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80 w-full group-hover:gap-3 transition-all duration-300">
                Configure Custom Engine <ArrowRight className="w-4 h-4 text-emerald-500" />
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create a new agent</h1>
              <p className="text-muted-foreground">
                Choose a template or use your own spec to get started.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (tab === "manual" && sourceType === "mcp_sse") {
                  setTab("templates");
                } else {
                  setTab(null);
                }
              }}
              className="rounded-xl font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {tab === "manual" && sourceType === "mcp_sse" ? "Back to Integrations" : "Back to Selection"}
            </Button>
          </div>

          <div className="pt-4">
            {tab === "templates" ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 max-h-[65vh] overflow-y-auto pr-4 custom-scrollbar">
                {isLoadingTemplates ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading template marketplace...</p>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-border rounded-3xl">
                    <Globe className="h-10 w-10 text-muted-foreground opacity-20" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No matching integrations found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search query</p>
                    </div>
                  </div>
                ) : (
                  categories.map((cat) => (
                    <div key={cat} className="space-y-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-center gap-4 my-4">
                        <span className="h-px w-12 sm:w-20 bg-slate-200 dark:bg-slate-800" />
                        {cat} ({filteredTemplates.filter((t) => t.category === cat).length})
                        <span className="h-px w-12 sm:w-20 bg-slate-200 dark:bg-slate-800" />
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto w-full px-2">
                        {filteredTemplates.filter((t) => t.category === cat).map((t) => {
                          const isConnecting = actionLoading === t.id;
                          const isConnected = isTemplateConnected(t);
                          const isHovered = hoveredTool === t.id;

                          return (
                            <div
                              key={t.id}
                              onClick={() => !isConnecting && handleTemplateClick(t)}
                              className={cn(
                                "group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 text-left cursor-pointer hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5",
                                isConnected && "hover:border-emerald-500/50 hover:shadow-emerald-500/5"
                              )}
                            >
                              <div className="flex items-center gap-4 min-w-0 pr-2">
                                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg p-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                  <img
                                    src={getLogoForTemplate(t)}
                                    alt={t.name}
                                    className="h-7 w-7 object-contain transition-transform group-hover:scale-110"
                                  />
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm md:text-base truncate max-w-[180px] sm:max-w-[220px]">
                                  {t.name.replace(/\s+MCP$/i, "")}
                                </span>
                              </div>
                              {isConnected ? (
                                <button
                                  type="button"
                                  onMouseEnter={() => setHoveredTool(t.id)}
                                  onMouseLeave={() => setHoveredTool(null)}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const oauthProvider = getProviderForTemplate(t);
                                    setConnectedTools(prev => {
                                      const next = prev.filter(item => item !== t.id);
                                      try { localStorage.setItem("beaver_connected_tools", JSON.stringify(next)); } catch (err) {}
                                      return next;
                                    });
                                    try {
                                      const token = await getToken();
                                      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/disconnect/provider/${t.id}`, {
                                        method: "POST",
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      // Also disconnect the OAuth provider if mapped
                                      if (oauthProvider && oauthProvider !== t.id) {
                                        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/disconnect/provider/${oauthProvider}`, {
                                          method: "POST",
                                          headers: { Authorization: `Bearer ${token}` }
                                        });
                                      }
                                    } catch (err) {}
                                    // Remove provider from oauthIntegrations so reconnect triggers OAuth
                                    if (oauthProvider) {
                                      setOauthIntegrations(prev => prev.filter((i: any) => i.provider !== oauthProvider));
                                    }
                                    toast.success(`Disconnected OAuth session for ${t.name}. Next connection will re-prompt authorization.`);
                                  }}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm whitespace-nowrap transition-all duration-200 cursor-pointer animate-in zoom-in-95",
                                    isHovered
                                      ? "bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
                                      : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
                                  )}
                                >
                                  {isHovered ? (
                                    <>
                                      <X className="w-3.5 h-3.5 stroke-[3px]" /> Disconnect
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5 stroke-[3px]" /> Connected
                                    </>
                                  )}
                                </button>
                              ) : isConnecting ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/50 text-white font-medium text-xs shadow-sm whitespace-nowrap">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting
                                </span>
                              ) : (
                                <span className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-all group-hover:shadow-blue-500/25 whitespace-nowrap cursor-pointer">
                                  Connect
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : sourceType === "mcp_sse" ? (
              <div className="rounded-3xl border border-white/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-10 shadow-2xl space-y-8 animate-in fade-in">
                <div className="flex items-center gap-4 pb-6 border-b border-border/50">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 flex items-center justify-center shadow-inner">
                    <Boxes className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Verified Integration Setup</h2>
                    <p className="text-xs text-muted-foreground">Manage agent profile and execution parameters for this connected integration.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Integration Agent Name</label>
                  <input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g. Gmail Agent"
                    className="h-14 w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 px-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner font-semibold text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Capabilities & Description</label>
                    <span className="text-[10px] font-bold text-muted-foreground/50">{description.length}/150</span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={150}
                    placeholder="What does this agent do?"
                    className="w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 p-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner min-h-[120px] text-foreground leading-relaxed font-medium"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-10 shadow-2xl space-y-8 animate-in fade-in">
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


                {/* Security Configuration */}
                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">Security Configuration</h4>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Auth Type</label>
                      <div className="relative">
                        <select
                          value={authType}
                          onChange={(e) => setAuthType(e.target.value)}
                          className="h-14 w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-slate-900 px-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 appearance-none shadow-inner transition-all"
                        >
                          <option value="none">No Auth</option>
                          <option value="bearer">Bearer Token</option>
                          <option value="apikey">Custom Header (API Key)</option>
                          <option value="query_key">Query Parameter (URL)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Auth Header Name</label>
                      <input
                        value={authHeader}
                        onChange={(e) => setAuthHeader(e.target.value)}
                        placeholder="Authorization"
                        className="h-14 w-full rounded-2xl border border-white/50 bg-white/40 dark:bg-white/5 px-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-mono shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">API Secret / Access Token</label>
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

                {/* Description (Moved below) */}
                <div className="space-y-2 pt-4 border-t border-border/50">
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

            {tab === "manual" && (
              <div className="mt-10 flex justify-end items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()} disabled={generating} className="rounded-xl px-6">
                  Cancel
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={generating || (!agentName || (!apiSpec && !file && sourceType === "rest"))}
                  className="rounded-xl h-12 px-8 min-w-[180px] shadow-glow"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Working...
                    </>
                  ) : sourceType === "mcp_sse" ? (
                    <>
                      <Check className="mr-2 h-4 w-4 stroke-[3px]" />
                      Save Integration
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewAgentPage() {
  return (
    <Suspense fallback={<div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <NewAgentContent />
    </Suspense>
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
