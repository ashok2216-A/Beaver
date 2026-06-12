'use client'

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UploadCloud,
  FileJson,
  Sparkles,
  ArrowRight,
  Check,
  Globe,
  Search,
  ArrowLeft,
  X,
  Boxes,
  Wrench,
  FileCode2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Loader } from "@/components/ui/loader";

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
  const [step, setStep] = useState(1);

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
        const { templateId, name, mcpUrl, sType, desc, aType, apiSpec } = pending;

        // Restore state and show the configuration form
        setAgentName(name);
        setBaseUrl(mcpUrl);
        setMcpServerUrl(mcpUrl);
        setSourceType(sType || "mcp_sse");
        setDescription(desc);
        setAuthType(aType);
        if (apiSpec) {
          setApiSpec(apiSpec);
        }
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
          const rawTemplates = data.templates || [];
          // Hide composio, perplexity, and soundcloud integrations from the frontend UI
          const hiddenIds = ["composio", "perplexity", "soundcloud"];
          const filtered = rawTemplates.filter((t: any) => !hiddenIds.includes((t.id || "").toLowerCase()));
          setTemplates(filtered);
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
    const cleanId = id.replace(/[-_]/g, "");
    
    // 1. Try exact match first
    for (const key in providersRegistry) {
      const item = providersRegistry[key];
      if (item.aliases && (item.aliases.includes(id) || item.aliases.includes(cleanId))) {
        return item;
      }
    }
    
    // 2. Fallback to substring matching (only if it's the exact prefix or suffix to be safer)
    for (const key in providersRegistry) {
      const item = providersRegistry[key];
      if (item.aliases && item.aliases.some((alias: string) => id.startsWith(alias + "_") || id.endsWith("_" + alias) || cleanId.startsWith(alias) || cleanId.endsWith(alias))) {
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
    if (id === "google_maps") return "https://www.google.com/s2/favicons?sz=128&domain=maps.google.com";
    if (id === "google_chat") return "https://www.google.com/s2/favicons?sz=128&domain=chat.google.com";
    if (id === "duffel_flights" || id === "duffel") return "https://www.google.com/s2/favicons?sz=128&domain=duffel.com";
    if (id === "apify") return "https://www.google.com/s2/favicons?sz=128&domain=apify.com";
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
    if (id === "spotify") return "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg";
    if (id === "google_classroom") return "https://upload.wikimedia.org/wikipedia/commons/1/19/Google_Classroom_Logo.svg";
    if (id === "whatsapp") return "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg";
    if (id === "telegram") return "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg";
    if (id === "discord") return "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png";
    if (id === "google_tasks") return "https://static.wikia.nocookie.net/logopedia/images/f/f1/Google_Tasks.svg";
    if (id === "figma") return "https://www.google.com/s2/favicons?sz=128&domain=figma.com";
    if (id === "reddit") return "https://www.google.com/s2/favicons?sz=128&domain=reddit.com";
    if (id === "elevenlabs") return "https://www.google.com/s2/favicons?sz=128&domain=elevenlabs.io";
    if (id === "linkedin") return "https://www.google.com/s2/favicons?sz=128&domain=linkedin.com";
    if (id === "openweathermap") return "https://www.google.com/s2/favicons?sz=128&domain=openweathermap.org";
    if (id === "google_meet") return "https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_(2020).svg";
    if (id === "dropbox") return "https://www.google.com/s2/favicons?sz=128&domain=dropbox.com";
    if (id === "bitbucket") return "https://www.google.com/s2/favicons?sz=128&domain=bitbucket.org";
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
        if (detail.api_spec) {
          setApiSpec(detail.api_spec);
        }
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
          if (authTypeForProvider === "NONE") {
            setAgentName(name);
            setBaseUrl(mcpUrl);
            setMcpServerUrl(mcpUrl);
            setSourceType(sType);
            setDescription(desc);
            setAuthType(aType);
            if (detail.api_spec) {
              setApiSpec(detail.api_spec);
            }
            setTab("manual");
            toast.info(`Review configuration for ${name} and click Save Integration.`);
            
            setConnectedTools(prev => {
              if (prev.includes(t.id)) return prev;
              const next = [...prev, t.id];
              try { localStorage.setItem("beaver_connected_tools", JSON.stringify(next)); } catch (e) {}
              return next;
            });
            return;
          }

          if (authTypeForProvider === "API_KEY" && !mcpUrl.startsWith("composio:")) {
            // Save pending template to resume after API key is entered
            localStorage.setItem('oauth_pending_template', JSON.stringify({
              templateId: t.id,
              name,
              mcpUrl,
              sType,
              desc,
              aType,
              apiSpec: detail.api_spec || ""
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
            aType,
            apiSpec: detail.api_spec || ""
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

          let isSuccess = false;
          let timer: NodeJS.Timeout;
          const channel = new BroadcastChannel('oauth_channel');

          const cleanup = () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('storage', handleStorage);
            try {
              channel.close();
            } catch (e) {}
            if (timer) clearInterval(timer);
          };

          const handleSuccess = () => {
            if (isSuccess) return;
            isSuccess = true;
            cleanup();
            
            // Optimistically update state so the UI button reflects the connection
            setOauthIntegrations(prev => [...prev, { provider: oauthProvider }]);
            setConnectedTools(prev => {
              const next = [...prev, t.id];
              try { localStorage.setItem("beaver_connected_tools", JSON.stringify(next)); } catch (e) {}
              return next;
            });

            resumePendingTemplate();
            setActionLoading(null);
          };

          const handleMessage = (event: MessageEvent) => {
            if (event.data === 'oauth_success') {
              handleSuccess();
            }
          };

          const handleStorage = (event: StorageEvent) => {
            if (event.key === 'oauth_success_trigger' && event.newValue) {
              try {
                const data = JSON.parse(event.newValue);
                if (data.provider === oauthProvider) {
                  localStorage.removeItem('oauth_success_trigger');
                  handleSuccess();
                }
              } catch (e) {}
            }
          };

          window.addEventListener('message', handleMessage);
          window.addEventListener('storage', handleStorage);
          
          channel.onmessage = (event) => {
            if (event.data && event.data.type === 'oauth_success' && event.data.provider === oauthProvider) {
              handleSuccess();
            }
          };

          // Poll to stop loading state if user manually closes the popup
          timer = setInterval(() => {
            if (popup && popup.closed) {
              cleanup();
              
              if (!isSuccess) {
                // If closed without the callback success message, it means the user aborted or it failed.
                toast.error("Integration setup was cancelled or incomplete.");
                localStorage.removeItem('oauth_pending_template');
                localStorage.removeItem('oauth_return_to');
              }
              
              setActionLoading(null);
            }
          }, 1000);

          return;
        }
      }

      // Instead of auto-connecting, load the configuration into the manual form
      // so the user can review it and provide any required authentication secrets.
      setAgentName(name);
      setBaseUrl(mcpUrl);
      setMcpServerUrl(mcpUrl);
      setSourceType(sType);
      setDescription(desc);
      setAuthType(aType);
      if (detail.api_spec) {
        setApiSpec(detail.api_spec);
      }
      setTab("manual");
      
      if (aType !== "none") {
        toast.info(`Please provide authentication credentials for ${name} before connecting.`);
      } else {
        toast.info(`Review configuration for ${name} and click Save Integration.`);
      }

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
            model_id: "gemini/gemini-3.1-flash-lite",
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
          type: "success",
          title: `Agent "${agentName || data.name || "Custom"}" Created`,
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
        <Loader className="h-8 w-8 animate-spin text-primary" />
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
                  <><Loader className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
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
                  <Wrench className="w-8 h-8" />
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
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Sticky Header Group */}
          <div className="sticky top-16 z-30 bg-white/20 dark:bg-slate-950/20 backdrop-blur-xl -mx-6 px-6 pt-6 pb-4 -mt-6 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            {/* Page Title */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {tab === "templates" ? "Integrations" : sourceType === "mcp_sse" ? "New Integration" : "New Agent"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {tab === "templates" ? "Connect verified tools and services to your workspace" : "Configure your agent's settings and capabilities"}
              </p>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm pt-1">
              <button
                onClick={() => setTab(null)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Agents
              </button>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              {tab === "manual" && sourceType === "mcp_sse" ? (
                <>
                  <button
                    onClick={() => setTab("templates")}
                    className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    Integrations
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <span className="text-slate-900 dark:text-white font-medium">{agentName || "Setup"}</span>
                </>
              ) : tab === "templates" ? (
                <span className="text-slate-900 dark:text-white font-medium">Integrations</span>
              ) : (
                <span className="text-slate-900 dark:text-white font-medium">New Agent</span>
              )}
            </div>
          </div>

          <div>
            {tab === "templates" ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 pb-12">
                {isLoadingTemplates ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto w-full px-2">
                        {filteredTemplates.filter((t) => t.category === cat).map((t) => {
                          const isConnecting = actionLoading === t.id;
                          const isConnected = isTemplateConnected(t);
                          const isHovered = hoveredTool === t.id;

                          return (
                            <div
                              key={t.id}
                              onClick={() => !isConnecting && handleTemplateClick(t)}
                              className={cn(
                                "group flex items-center justify-between px-3 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 text-left cursor-pointer hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/5",
                                isConnected && "hover:border-emerald-500/50 hover:shadow-emerald-500/5"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                                <div className="h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-md p-0.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                  <img
                                    src={getLogoForTemplate(t)}
                                    alt={t.name}
                                    className="h-5 w-5 object-contain transition-transform group-hover:scale-110"
                                  />
                                </div>
                                <span className="font-medium text-slate-800 dark:text-slate-200 text-[13px] truncate">
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
                                    "inline-flex items-center gap-1 px-2 py-1 rounded-md font-semibold text-[11px] whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0",
                                    isHovered
                                      ? "bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
                                      : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
                                  )}
                                >
                                  {isHovered ? (
                                    <>
                                      <X className="w-3 h-3 stroke-[3px]" /> Disconnect
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3 stroke-[3px]" /> Connected
                                    </>
                                  )}
                                </button>
                              ) : isConnecting ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-600/50 text-white font-medium text-[11px] whitespace-nowrap shrink-0">
                                  <Loader className="w-3 h-3 animate-spin" /> Connecting
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition-all whitespace-nowrap cursor-pointer shrink-0">
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
              <div className="max-w-xl mx-auto animate-in fade-in duration-400 border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 shadow-sm">
                
                <div className="mb-6 pt-2">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Integration Details</h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Provide the essential information to identify this integration.</p>
                </div>
                {/* Horizontal row form — Agent Name */}
                <div className="py-5 border-b border-slate-200/70 dark:border-slate-800/70">
                  <div className="flex items-start gap-8">
                    <div className="w-36 shrink-0 pt-2.5">
                      <label className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Name</label>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">Identifies this agent</p>
                    </div>
                    <div className="flex-1">
                      <input
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="e.g. Gmail Agent"
                        className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-400/10 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-350 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Horizontal row form — Description */}
                <div className="py-5 border-b border-slate-200/70 dark:border-slate-800/70">
                  <div className="flex items-start gap-8">
                    <div className="w-36 shrink-0 pt-2.5">
                      <label className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Description</label>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">Helps route tasks</p>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={100}
                        placeholder="What capabilities does this agent provide?"
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-400/10 transition-all text-slate-900 dark:text-slate-100 leading-relaxed resize-none placeholder:text-slate-350 dark:placeholder:text-slate-600"
                      />
                      <div className="flex justify-end mt-1.5">
                        <span className={cn(
                          "text-[11px] font-mono tabular-nums",
                          description.length > 90 ? "text-amber-500" : "text-slate-300 dark:text-slate-600"
                        )}>{description.length}/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection Status row */}
                <div className="py-5">
                  <div className="flex items-start gap-8">
                    <div className="w-36 shrink-0 pt-0.5">
                      <label className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Connection</label>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[13px] text-slate-600 dark:text-slate-400">Verified MCP integration</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto animate-in fade-in duration-400 border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 shadow-sm">
                <div className="mb-6 pt-2 flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">API Configuration</h2>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Configure your custom OpenAPI or REST integration.</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn("h-1.5 rounded-full transition-all duration-300", step === 1 ? "w-6 bg-slate-900 dark:bg-white" : step > 1 ? "w-1.5 bg-slate-900 dark:bg-white" : "w-1.5 bg-slate-200 dark:bg-slate-700")} />
                    <span className={cn("h-1.5 rounded-full transition-all duration-300", step === 2 ? "w-6 bg-slate-900 dark:bg-white" : step > 2 ? "w-1.5 bg-slate-900 dark:bg-white" : "w-1.5 bg-slate-200 dark:bg-slate-700")} />
                    <span className={cn("h-1.5 rounded-full transition-all duration-300", step === 3 ? "w-6 bg-slate-900 dark:bg-white" : "w-1.5 bg-slate-200 dark:bg-slate-700")} />
                  </div>
                </div>

                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                    {/* Agent Name */}
                    <div className="py-5 border-b border-slate-200/70 dark:border-slate-800/70">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
                        <div className="w-40 shrink-0 sm:pt-2.5">
                          <label className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Agent Name</label>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">Identifies this API</p>
                        </div>
                        <div className="flex-1">
                          <input
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            placeholder="e.g. Internal CRM"
                            className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-400/10 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-350 dark:placeholder:text-slate-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Base URL */}
                    <div className="py-5 border-b border-slate-200/70 dark:border-slate-800/70">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
                        <div className="w-40 shrink-0 sm:pt-2.5">
                          <label className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Base URL</label>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">The API server URL</p>
                        </div>
                        <div className="flex-1">
                          <input
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder="https://api.example.com"
                            className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-400/10 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-350 dark:placeholder:text-slate-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="py-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
                        <div className="w-40 shrink-0 sm:pt-2.5">
                          <label className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Description</label>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">Helps the LLM route requests</p>
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={100}
                            placeholder="What capabilities does this API provide?"
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-400/10 transition-all text-slate-900 dark:text-slate-100 leading-relaxed resize-none placeholder:text-slate-350 dark:placeholder:text-slate-600"
                          />
                          <div className="flex justify-end mt-1.5">
                            <span className={cn(
                              "text-[11px] font-mono tabular-nums",
                              description.length > 90 ? "text-amber-500" : "text-slate-300 dark:text-slate-600"
                            )}>{description.length}/100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                    {/* Security */}
                    <div className="py-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
                        <div className="w-40 shrink-0 sm:pt-2.5">
                          <label className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Authentication</label>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">How to authenticate</p>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="relative">
                            <select
                              value={authType}
                              onChange={(e) => setAuthType(e.target.value)}
                              className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-400/10 transition-all text-slate-900 dark:text-slate-100 appearance-none"
                            >
                              <option value="none">No Auth</option>
                              <option value="bearer">Bearer Token</option>
                              <option value="apikey">Custom Header (API Key)</option>
                              <option value="query_key">Query Parameter (URL)</option>
                            </select>
                          </div>

                          {authType !== "none" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                              <div>
                                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">Header/Param Name</label>
                                <input
                                  value={authHeader}
                                  onChange={(e) => setAuthHeader(e.target.value)}
                                  placeholder="Authorization"
                                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-350 dark:placeholder:text-slate-600"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">Secret Token</label>
                                <input
                                  type="password"
                                  value={authSecret}
                                  onChange={(e) => setAuthSecret(e.target.value)}
                                  placeholder="sk-..."
                                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-350 dark:placeholder:text-slate-600"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                    {/* API Specification */}
                    <div className="py-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
                        <div className="w-40 shrink-0 sm:pt-2.5">
                          <label className="text-[13px] font-medium text-slate-600 dark:text-slate-400">OpenAPI Spec</label>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">JSON or YAML <span className="italic text-slate-400/80">(Optional)</span></p>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                            className={cn(
                              "relative w-full min-h-[120px] rounded-xl border border-dashed p-4 text-center transition-all flex flex-col items-center justify-center",
                              dragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                          >
                            <UploadCloud className="h-5 w-5 text-slate-400 mb-2" />
                            <h3 className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Drag & Drop file</h3>
                            <label className="mt-2">
                              <input type="file" accept=".json,.yaml,.yml" className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
                              <span className="inline-flex h-7 cursor-pointer items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                                Browse Files
                              </span>
                            </label>
                            {file && (
                              <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 text-left w-full max-w-sm mx-auto">
                                <FileJson className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 truncate">{file.name}</p>
                                </div>
                                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />
                              </div>
                            )}
                          </div>

                          <div className="relative">
                            <div className="absolute top-3 right-3">
                              <span className="text-[10px] text-slate-400 font-medium">RAW EDITOR</span>
                            </div>
                            <textarea
                              value={apiSpec}
                              onChange={(e) => setApiSpec(e.target.value)}
                              placeholder='{"openapi": "3.0.0", ...}'
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 pt-8 text-[11px] outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-400/10 transition-all font-mono min-h-[160px] text-slate-800 dark:text-slate-200 resize-y placeholder:text-slate-350 dark:placeholder:text-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}



            {generating && (
              <div className="max-w-xl mx-auto mt-6 animate-in fade-in slide-in-from-top-2 border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between text-[13px] mb-4">
                  <span className="font-semibold flex items-center gap-2.5 text-slate-900 dark:text-white">
                    <Loader className="h-4 w-4 animate-spin text-slate-500" />
                    Generating your agent engine...
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 font-medium">{progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200/50 dark:bg-slate-800/50 overflow-hidden mb-6">
                  <div className="h-full bg-slate-900 dark:bg-slate-100 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <ul className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <Step done={progress > 20} label="Parsing schema" />
                  <Step done={progress > 50} label="Mapping tools" />
                  <Step done={progress > 80} label="System prompt" />
                  <Step done={progress >= 100} label="Finalizing" />
                </ul>
              </div>
            )}

            {tab === "manual" && (
              <div className="mt-6 max-w-3xl mx-auto flex items-center justify-between px-2">
                <button 
                  onClick={() => {
                    if (sourceType !== "mcp_sse" && step > 1) {
                      setStep(step - 1);
                    } else {
                      router.back();
                    }
                  }} 
                  disabled={generating} 
                  className="text-[13px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors disabled:opacity-40"
                >
                  {sourceType !== "mcp_sse" && step > 1 ? "Back" : "Cancel"}
                </button>
                
                {sourceType !== "mcp_sse" && step < 3 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={generating || (step === 1 && (!agentName || !baseUrl))}
                    className={cn(
                      "h-9 px-4 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2",
                      "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100",
                      "disabled:opacity-40 disabled:pointer-events-none"
                    )}
                  >
                    Continue <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !agentName}
                    className={cn(
                      "h-9 px-4 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2",
                      "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100",
                      "disabled:opacity-40 disabled:pointer-events-none"
                    )}
                  >
                    {generating ? (
                      <>
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                        Working...
                      </>
                    ) : sourceType === "mcp_sse" ? (
                      <>
                        Save Integration
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Generate Agent
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                )}
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
    <Suspense fallback={<div className="py-20 flex justify-center"><Loader className="h-8 w-8 animate-spin text-primary" /></div>}>
      <NewAgentContent />
    </Suspense>
  );
}

const Step = ({ done, label }: { done: boolean; label: string }) => (
  <li className="flex items-center gap-3">
    <div className={cn(
      "flex h-[18px] w-[18px] items-center justify-center rounded-full transition-all duration-500",
      done ? "bg-emerald-500 text-white rotate-0" : "bg-slate-200 dark:bg-slate-800 text-slate-400 -rotate-90"
    )}>
      {done ? <Check className="h-2.5 w-2.5 stroke-[3px]" /> : <div className="h-1 w-1 rounded-full bg-current" />}
    </div>
    <span className={cn(
      "text-[13px] font-medium transition-colors duration-300",
      done ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
    )}>
      {label}
    </span>
  </li>
);
