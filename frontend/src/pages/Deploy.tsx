import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Rocket, Globe, Code2, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/CodeBlock";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const Deploy = () => {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("id") || "AGENT_ID";
  const [deployed, setDeployed] = useState(true);

  const apiUrl = `${API_BASE_URL}/chat/${agentId}`;
  const embed = `<script src="${API_BASE_URL.replace("/api/v1", "")}/widget.js"
  data-agent-id="${agentId}"
  data-theme="light"
  defer></script>`;
  const curl = `curl -X POST ${apiUrl} \\
  -H "Authorization: Bearer $YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "How can I help you today?"}'`;

  return (
    <AppShell title="Deploy your agent" subtitle="Ship as a hosted API or drop-in chat widget.">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Status banner */}
        <div className="rounded-2xl border border-success/30 bg-success/5 p-5 flex items-center gap-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-success text-success-foreground shadow-sm">
            <Check className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Agent is live</p>
            <p className="text-sm text-muted-foreground">Deployed 2 minutes ago to production region · us-east-1</p>
          </div>
          <Button
            variant={deployed ? "outline" : "hero"}
            onClick={() => { setDeployed(!deployed); toast.success(deployed ? "Agent paused" : "Agent redeployed"); }}
          >
            <Rocket className="h-4 w-4" />
            {deployed ? "Redeploy" : "Deploy now"}
          </Button>
        </div>

        {/* API endpoint */}
        <Section icon={Globe} title="REST API endpoint" desc="Call your agent from any backend or frontend.">
          <div className="rounded-xl border border-border bg-secondary/40 p-4 flex items-center gap-3">
            <span className="rounded bg-primary/10 px-2 py-1 text-xs font-bold font-mono text-primary">POST</span>
            <code className="flex-1 font-mono text-sm truncate">{apiUrl}</code>
            <Button
              size="sm"
              variant="soft"
              onClick={() => { navigator.clipboard.writeText(apiUrl); toast.success("URL copied"); }}
            >
              Copy URL
            </Button>
          </div>
          <div className="mt-4">
            <CodeBlock code={curl} language="bash" filename="curl" />
          </div>
        </Section>

        {/* Embed widget */}
        <Section icon={Code2} title="Chat widget embed" desc="Drop this script into any HTML page to add a floating chat bubble.">
          <CodeBlock code={embed} language="html" filename="index.html" />
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <CustomizeCard label="Theme" value="Light" />
            <CustomizeCard label="Position" value="Bottom-right" />
            <CustomizeCard label="Greeting" value="Hi! How can I help?" />
          </div>
        </Section>
      </div>
    </AppShell>
  );
};

const Section = ({ icon: Icon, title, desc, children }: { icon: any; title: string; desc: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-sm">
    <div className="flex items-start gap-4 mb-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
    {children}
  </div>
);

const CustomizeCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-background p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium mt-1">{value}</p>
  </div>
);

export default Deploy;
