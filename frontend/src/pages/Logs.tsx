import { useState, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Filter, Download, Clock, CircleCheck, CircleX, ExternalLink, Bot } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { api, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";

const statusColor = (s: number) =>
  s < 300 ? "bg-success/10 text-success" : s < 400 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive";

const methodColor: Record<string, string> = {
  GET: "bg-success/10 text-success",
  POST: "bg-primary/10 text-primary",
  DELETE: "bg-destructive/10 text-destructive",
  PUT: "bg-warning/10 text-warning",
};

const Logs = () => {
  const { getToken } = useAuth();
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("id");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["logs", agentId, page],
    queryFn: () => {
      const endpoint = agentId 
        ? `/chat/${agentId}/logs?page=${page}&per_page=10`
        : `/chat/logs/all?page=${page}&per_page=10`;
      return api.get<any>(endpoint);
    },
    // Always enabled now, so the sidebar link works!
    enabled: true,
  });

  const logs = data?.items || [];
  const total = data?.total || 0;
  const errorMessage = error instanceof Error ? error.message : "Failed to load logs";

  return (
    <AppShell
      title={agentId ? "Agent Activity" : "Global Activity"}
      subtitle={agentId ? "Audit trail for this specific agent." : "Unified history across all your agents."}
      actions={
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              try {
                toast.info("Preparing export...");
                const token = await getToken();
                
                const endpoint = agentId 
                  ? `${API_BASE_URL}/chat/${agentId}/logs/export/ndjson`
                  : `${API_BASE_URL}/chat/logs/export/all/ndjson`;

                const blob = await fetch(endpoint, {
                   headers: { "Authorization": `Bearer ${token}` }
                }).then(r => {
                  if (!r.ok) throw new Error("Fetch failed");
                  return r.blob();
                });
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = agentId ? `logs_agent_${agentId}.ndjson` : `all_logs.ndjson`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast.success("Logs exported");
              } catch (e) {
                console.error(e);
                toast.error("Export failed");
              }
            }}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      }
    >
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-secondary/20 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Live monitoring active</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium w-8"></th>
                {!agentId && <th className="px-4 py-3 font-medium">Agent</th>}
                <th className="px-4 py-3 font-medium">User input</th>
                <th className="px-4 py-3 font-medium">API call</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Latency</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={agentId ? 6 : 7} className="px-6 py-10 text-center text-muted-foreground">Loading logs...</td></tr>
              ) : isError ? (
                <tr>
                  <td colSpan={agentId ? 6 : 7} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <p className="text-destructive font-medium">Error: {errorMessage}</p>
                       <p className="text-xs text-muted-foreground">This agent may be orphaned. Try running the migration script.</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={agentId ? 6 : 7} className="px-6 py-10 text-center text-muted-foreground">No logs found.</td></tr>
              ) : (
                logs.map((l: any) => (
                  <Fragment key={l.id}>
                    <tr
                      className="border-b border-border last:border-0 hover:bg-secondary/30 cursor-pointer transition-base"
                      onClick={() => setOpen(open === l.id ? null : l.id)}
                    >
                      <td className="px-4 py-3">
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-base ${open === l.id ? "rotate-180" : ""}`} />
                      </td>
                      {!agentId && (
                        <td className="px-4 py-3 font-medium text-primary flex items-center gap-2">
                          <Bot className="h-3.5 w-3.5" /> {l.agent_name || "Unknown"}
                        </td>
                      )}
                      <td className="px-4 py-3 max-w-xs truncate">{l.user_input}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${methodColor[l.method] || "bg-secondary text-secondary-foreground"}`}>
                            {l.method}
                          </span>
                          <code className="font-mono text-xs truncate max-w-[200px]">{l.matched_path}</code>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(l.status_code)}`}>
                          {l.status_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{l.latency_ms}ms</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{new Date(l.created_at).toLocaleString()}</td>
                    </tr>
                    {open === l.id && (
                      <tr className="bg-secondary/20 border-b border-border last:border-0 animate-fade-in">
                        <td></td>
                        <td colSpan={5} className="px-4 py-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Request Context</p>
                              <pre className="rounded-lg bg-[hsl(222_30%_7%)] text-[hsl(210_20%_92%)] p-3 text-xs font-mono overflow-x-auto">
                                {`Input: ${l.user_input}\nMethod: ${l.method}\nPath: ${l.matched_path}`}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">API Response</p>
                              <pre className="rounded-lg bg-[hsl(222_30%_7%)] text-[hsl(210_20%_92%)] p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                {l.api_response || "No response data captured."}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border bg-secondary/10 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing {logs.length} of {total} events</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * 10 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Logs;
