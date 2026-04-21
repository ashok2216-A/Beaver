import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { UploadCloud, Link2, FileJson, Sparkles, ArrowRight, Check, Loader2, Globe } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

const CreateAgent = () => {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  
  // New States for Metadata
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

  // Effect to handle URL Preview discovery
  useEffect(() => {
    const fetchPreview = async () => {
      if (!url || url.length < 10 || !url.startsWith("http")) return;
      
      setIsPreviewing(true);
      try {
        const data = await api.post<{name: string, description: string, base_url: string}>("/agents/ingest/preview", { url });
        setAgentName(data.name);
        setBaseUrl(data.base_url);
        setDescription(data.description);
        toast.info("API details discovered!");
      } catch (err) {
        console.error("Preview failed", err);
      } finally {
        setIsPreviewing(false);
      }
    };

    const timer = setTimeout(fetchPreview, 1000);
    return () => clearTimeout(timer);
  }, [url]);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    setFile(files[0]);
    toast.success(`${files[0].name} ready to generate`);
  };

  const { mutate: ingest } = useMutation({
    mutationFn: async () => {
      if (tab === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        return api.post<any>(`/agents/ingest/file?name=${encodeURIComponent(file.name)}`, formData);
      } else if (tab === "url" && url) {
        return api.post<any>("/agents/ingest/url", { 
          url, 
          name: agentName || "New Agent from URL",
          description,
          base_url: baseUrl,
          auth_type: authType,
          auth_header: authHeader || null,
          auth_secret: authSecret
        });
      }
      throw new Error("Missing file or URL");
    },
    onSuccess: (data) => {
      toast.success("Agent generated successfully!");
      navigate(`/agents/builder?id=${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate agent");
      setGenerating(false);
    },
  });

  const handleGenerate = () => {
    if (!file && !url) {
      toast.error("Upload a spec or paste a URL first");
      return;
    }
    setGenerating(true);
    setProgress(10);
    
    // Fake progress simulation
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 10;
      });
    }, 400);

    ingest();
  };

  return (
    <AppShell title="Create a new agent" subtitle="Upload an OpenAPI spec or paste a URL to get started.">
      <div className="mx-auto max-w-3xl">
        {/* Tabs */}
        <div className="inline-flex rounded-xl border border-border bg-secondary/40 p-1">
          <button
            onClick={() => setTab("upload")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-base ${
              tab === "upload" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UploadCloud className="h-4 w-4" /> Upload file
          </button>
          <button
            onClick={() => setTab("url")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-base ${
              tab === "url" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link2 className="h-4 w-4" /> Paste URL
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-gradient-card p-8 shadow-soft">
          {tab === "upload" ? (
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
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-medium">OpenAPI spec URL</label>
                <div className="relative">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/openapi.json"
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary/50 focus:ring-soft transition-base"
                  />
                  {isPreviewing && (
                    <div className="absolute right-4 top-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>

              {/* Discovery Fields */}
              {(agentName || isPreviewing) && (
                <div className="grid gap-6 animate-in fade-in slide-in-from-top-4">
                  <div className="grid grid-cols-2 gap-4">
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
              
              {!agentName && !isPreviewing && (
                <p className="text-xs text-muted-foreground italic">We'll fetch and parse the spec details once you paste a valid URL.</p>
              )}
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
            <Button variant="hero" size="lg" onClick={handleGenerate} disabled={generating || (tab === "url" && !url)}>
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

export default CreateAgent;
