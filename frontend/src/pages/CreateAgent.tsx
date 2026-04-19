import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { UploadCloud, Link2, FileJson, Sparkles, ArrowRight, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

const CreateAgent = () => {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    setFile(files[0]);
    toast.success(`${files[0].name} ready to generate`);
  };

  const { mutate: ingest, isPending } = useMutation({
    mutationFn: async () => {
      if (tab === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        return api.post<any>(`/agents/ingest/file?name=${encodeURIComponent(file.name)}`, formData);
      } else if (tab === "url" && url) {
        return api.post<any>("/agents/ingest/url", { url, name: "New Agent from URL" });
      }
      throw new Error("Missing file or URL");
    },
    onSuccess: (data) => {
      toast.success("Agent generated successfully!");
      navigate(`/agents/builder?id=${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate agent");
    },
  });

  const handleGenerate = () => {
    if (!file && !url) {
      toast.error("Upload a spec or paste a URL first");
      return;
    }
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
            <div className="space-y-4">
              <label className="text-sm font-medium">OpenAPI spec URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/openapi.json"
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary/50 focus:ring-soft transition-base"
              />
              <p className="text-xs text-muted-foreground">We'll fetch and parse the spec server-side. Auth headers can be added in the next step.</p>
            </div>
          )}

          {generating && (
            <div className="mt-8">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Generating your agent…</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-gradient-primary transition-all duration-150" style={{ width: `${progress}%` }} />
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
            <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button variant="hero" size="lg" onClick={handleGenerate} disabled={generating}>
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
    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${done ? "bg-success text-success-foreground" : "bg-secondary"}`}>
      {done && <Check className="h-2.5 w-2.5" />}
    </span>
    <span className={done ? "text-foreground" : ""}>{label}</span>
  </li>
);

export default CreateAgent;
