import { useState, Fragment } from "react";
import { ChevronDown, Filter, Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

interface Log {
  id: string;
  input: string;
  endpoint: string;
  method: string;
  status: number;
  response: string;
  ts: string;
  ms: number;
}

const logs: Log[] = [
  { id: "1", input: "List my last 3 customers", endpoint: "/v1/customers?limit=3", method: "GET", status: 200, response: '{"data":[{"id":"cus_NffrFeUfNV"}, ...]}', ts: "2026-04-18 14:32:08", ms: 312 },
  { id: "2", input: "Refund the last charge for cus_NffrFeUfNV", endpoint: "/v1/refunds", method: "POST", status: 200, response: '{"id":"re_3O2k","amount":12800,"status":"succeeded"}', ts: "2026-04-18 14:31:44", ms: 528 },
  { id: "3", input: "Create a new product called Pro Plan", endpoint: "/v1/products", method: "POST", status: 201, response: '{"id":"prod_PqA","name":"Pro Plan"}', ts: "2026-04-18 14:28:12", ms: 482 },
  { id: "4", input: "Cancel sub_92kfm", endpoint: "/v1/subscriptions/sub_92kfm", method: "DELETE", status: 200, response: '{"id":"sub_92kfm","status":"canceled"}', ts: "2026-04-18 14:14:55", ms: 290 },
  { id: "5", input: "List products", endpoint: "/v1/products", method: "GET", status: 200, response: '{"data":[...12 items]}', ts: "2026-04-18 14:08:01", ms: 198 },
  { id: "6", input: "Charge $50 to cus_QzM", endpoint: "/v1/charges", method: "POST", status: 402, response: '{"error":{"code":"card_declined"}}', ts: "2026-04-18 14:01:33", ms: 612 },
];

const statusColor = (s: number) =>
  s < 300 ? "bg-success/10 text-success" : s < 400 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive";

const methodColor: Record<string, string> = {
  GET: "bg-success/10 text-success",
  POST: "bg-primary/10 text-primary",
  DELETE: "bg-destructive/10 text-destructive",
  PUT: "bg-warning/10 text-warning",
};

const Logs = () => {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <AppShell
      title="Logs"
      subtitle="Every conversation, API call, and response — fully auditable."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="h-4 w-4" /> Filter</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Export</Button>
        </div>
      }
    >
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium w-8"></th>
              <th className="px-4 py-3 font-medium">User input</th>
              <th className="px-4 py-3 font-medium">API call</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Latency</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <Fragment key={l.id}>
                <tr
                  className="border-b border-border last:border-0 hover:bg-secondary/30 cursor-pointer transition-base"
                  onClick={() => setOpen(open === l.id ? null : l.id)}
                >
                  <td className="px-4 py-3">
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-base ${open === l.id ? "rotate-180" : ""}`} />
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{l.input}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${methodColor[l.method]}`}>
                        {l.method}
                      </span>
                      <code className="font-mono text-xs truncate max-w-[200px]">{l.endpoint}</code>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(l.status)}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{l.ms}ms</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{l.ts}</td>
                </tr>
                {open === l.id && (
                  <tr className="bg-secondary/20 border-b border-border last:border-0 animate-fade-in">
                    <td></td>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Request</p>
                          <pre className="rounded-lg bg-[hsl(222_30%_7%)] text-[hsl(210_20%_92%)] p-3 text-xs font-mono overflow-x-auto">{`${l.method} ${l.endpoint}\nAuthorization: Bearer sk_test_••••\nContent-Type: application/json`}</pre>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Response</p>
                          <pre className="rounded-lg bg-[hsl(222_30%_7%)] text-[hsl(210_20%_92%)] p-3 text-xs font-mono overflow-x-auto">{l.response}</pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
};

export default Logs;
