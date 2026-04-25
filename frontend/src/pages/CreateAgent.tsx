import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UploadCloud, Link2, FileJson, Sparkles, ArrowRight, Check, Loader2, Globe, Search, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

const CreateAgent = () => {
  const [tab, setTab] = useState<"templates" | "url" | "upload" | "manual">("templates");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  
  // States for Metadata
  const [agentName, setAgentName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [description, setDescription] = useState("");
  const [authType, setAuthType] = useState("bearer");
  const [authHeader, setAuthHeader] = useState("");
  const [authSecret, setAuthSecret] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  // Fetch templates from manifest
  const { data: templatesData, isLoading: isLoadingTemplates, isError: isTemplatesError } = useQuery({
    queryKey: ["templates"],
    queryFn: () => api.get<any>("/agents/templates"),
  });
  const templates = templatesData?.templates || [];

  // Group templates by category
  const categories = Array.from(new Set(templates.map((t: any) => t.category)));

  const handleTemplateClick = async (t: any) => {
    try {
      const detail = await api.get<any>(`/agents/templates/${t.id}`);
      setTab("url");
      setUrl(detail.source_url || "");
      
      // Smart Name: "Zendesk" -> "Zendesk Agent"
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

  useEffect(() => {
    const fetchPreview = async () => {
      if (!url || url.length < 10 || !url.startsWith("http")) return;
      if (!url.match(/\.(json|yaml|yml)(\?|$)/i)) return;
      
      setIsPreviewing(true);
      try {
        const data = await api.post<{name: string, description: string, base_url: string}>("/agents/ingest/preview", { url });
        if (!agentName) setAgentName(data.name);
        if (!baseUrl) setBaseUrl(data.base_url);
        if (!description) setDescription(data.description);
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

  const { mutate: ingest } = useMutation({
    mutationFn: async () => {
      if (tab === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        const query = new URLSearchParams({
          name: agentName || file.name,
          description,
          base_url: baseUrl,
          auth_type: authType,
          auth_header: authHeader,
          auth_secret: authSecret
        }).toString();
        return api.post<any>(`/agents/ingest/file?${query}`, formData);
      } else if (tab === "url" && url) {
        return api.post<any>("/agents/ingest/smart", { 
          url, 
          name: agentName,
          description,
          base_url: baseUrl
        });
      } else {
        return api.post<any>("/agents", { 
          name: agentName,
          description,
          base_url: baseUrl,
          auth_type: authType,
          auth_secret: authSecret,
          model_id: "gemini-2.0-flash",
          api_spec: ""
        });
      }
    },
    onSuccess: (data) => {
      toast.success("Agent generated!");
      navigate(`/agents/builder?id=${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate agent");
      setGenerating(false);
    },
  });

  const handleGenerate = () => {
    if (!file && !url && tab !== "manual") {
      toast.error("Provide a source first");
      return;
    }
    setGenerating(true);
    setProgress(10);
    const interval = setInterval(() => {
      setProgress(p => (p >= 90 ? (clearInterval(interval), 90) : p + 10));
    }, 400);
    ingest();
  };

  return (
    <AppShell title="Create a new agent" subtitle="Choose a template or use your own spec to get started.">
      <div className="mx-auto max-w-4xl space-y-8 pb-20">
        
        {/* Tab Switcher */}
        <div className="flex flex-col items-center space-y-6">
          <div className="inline-flex rounded-xl border border-border bg-secondary/40 p-1.5 shadow-inner">
            <TabButton active={tab === "templates"} onClick={() => setTab("templates")} icon={<Sparkles className="h-4 w-4 text-primary" />} label="Templates" />
            <TabButton active={tab === "url"} onClick={() => setTab("url")} icon={<Search className="h-4 w-4 text-primary" />} label="Discover Spec" />
            <TabButton active={tab === "upload"} onClick={() => setTab("upload")} icon={<UploadCloud className="h-4 w-4" />} label="Upload file" />
            <TabButton active={tab === "manual"} onClick={() => setTab("manual")} icon={<Globe className="h-4 w-4 text-success" />} label="Manual Setup" />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-gradient-card p-8 shadow-soft">
          {tab === "templates" ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
              {isLoadingTemplates ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading template marketplace...</p>
                </div>
              ) : isTemplatesError || templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-border rounded-2xl">
                  <Globe className="h-10 w-10 text-muted-foreground opacity-20" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">No templates found</p>
                    <p className="text-xs text-muted-foreground">Check your connection or your backend manifest.json</p>
                  </div>
                </div>
              ) : (
                categories.map((cat: any) => (
                  <div key={cat} className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                      <span className="h-px flex-1 bg-border/50" />
                      {cat} ({templates.filter((t: any) => t.category === cat).length})
                      <span className="h-px flex-1 bg-border/50" />
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {templates.filter((t: any) => t.category === cat).map((t: any) => (
                        <button
                          key={t.id}
                          onClick={() => handleTemplateClick(t)}
                          className="group relative flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-3 text-center transition-all hover:border-primary/40 hover:shadow-glow-sm hover:-translate-y-1"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary p-1.5 transition-base group-hover:bg-primary/10 overflow-hidden">
                            <img 
                              src={`https://www.google.com/s2/favicons?sz=128&domain=${t.domain}`} 
                              alt={t.name}
                              className="h-full w-full object-contain transition-all duration-300 scale-90 group-hover:scale-110"
                            />
                          </div>
                          <p className="text-[11px] font-bold leading-tight truncate w-full max-w-[80px]">{t.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : tab === "upload" ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-base ${
                dragOver ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40 hover:bg-primary-soft/40"
              }`}
            >
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">Drop your OpenAPI spec here</h3>
              <p className="mt-1 text-sm text-muted-foreground">JSON or YAML, up to 10 MB</p>
              <label className="mt-6 inline-block">
                <input type="file" accept=".json,.yaml,.yml" className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
                <span className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-accent transition-base">
                  Choose file
                </span>
              </label>
              {file && (
                <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left">
                  <FileJson className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · ready to parse</p>
                  </div>
                  <Check className="h-4 w-4 text-success" />
                </div>
              )}
            </div>
          ) : tab === "url" ? (
            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                Documentation or Spec URL
              </label>
              <div className="relative">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste documentation link (e.g. developers.notion.com)"
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary/50 focus:ring-soft transition-base"
                />
                {isPreviewing && (
                  <div className="absolute right-4 top-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground italic">
                Our system will automatically search the URL for a hidden OpenAPI or Swagger specification file.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Agent Name</label>
                  <input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g. My Custom API"
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary/50 focus:ring-soft transition-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Base URL</label>
                  <input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary/50 focus:ring-soft transition-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this agent do?"
                  className="w-full rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-primary/50 focus:ring-soft transition-base min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* Unified Discovery & Auth Fields */}
          {(agentName || isPreviewing || file) && (
            <div className="grid gap-6 animate-in fade-in slide-in-from-top-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Name</label>
                  <input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Base URL</label>
                  <div className="relative">
                    <input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary/50"
                    />
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary/50"
                />
              </div>

              {/* Auth Configuration */}
              <div className="pt-4 border-t border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Authentication Settings</p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Auth Type</label>
                    <select 
                      value={authType}
                      onChange={(e) => setAuthType(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
                    >
                      <option value="none">None</option>
                      <option value="bearer">Bearer Token (Authorization)</option>
                      <option value="apikey">API Key (Custom Header)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Custom Header Name</label>
                    <input 
                      value={authHeader}
                      onChange={(e) => setAuthHeader(e.target.value)}
                      placeholder="x-api-key"
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50 font-mono"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Auth Secret / Token</label>
                    <input 
                      type="password"
                      value={authSecret}
                      onChange={(e) => setAuthSecret(e.target.value)}
                      placeholder="paste-your-token-here"
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {generating && (
            <div className="mt-8 transition-all animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Generating your agent…
                </span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-gradient-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <Step done={progress > 20} label="Parsing OpenAPI schema" />
                <Step done={progress > 50} label="Generating tool definitions" />
                <Step done={progress > 80} label="Configuring system prompt" />
                <Step done={progress >= 100} label="Spinning up agent runtime" />
              </ul>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)} disabled={generating}>Cancel</Button>
            <Button variant="hero" size="lg" onClick={handleGenerate} disabled={generating || (tab === "url" && !url) || (tab === "upload" && !file) || (tab === "templates")}>
              <Sparkles className="h-4 w-4" />
              {generating ? "Generating…" : "Generate Agent"}
              {!generating && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const Step = ({ done, label }: { done: boolean; label: string }) => (
  <li className="flex items-center gap-2">
    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-300 ${done ? "bg-success text-success-foreground" : "bg-secondary"}`}>
      {done && <Check className="h-2.5 w-2.5" />}
    </span>
    <span className={done ? "text-foreground font-medium" : ""}>{label}</span>
  </li>
);

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-base whitespace-nowrap ${
      active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {icon} {label}
  </button>
);

export default CreateAgent;
