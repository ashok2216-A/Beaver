import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Copy, Trash2, Plus, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: number;
  name: string;
  key?: string;
  created_at: string;
  last_used_at: string | null;
}

const Settings = () => {
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const { data: keys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["api-keys"],
    queryFn: () => api.get("/auth/keys"),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post<ApiKey>("/auth/keys", { name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setGeneratedKey(data.key || null);
      setNewKeyName("");
      toast.success("API Key generated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate key");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API Key revoked");
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <AppShell
      title="User Settings"
      subtitle="Manage your personal API keys and security settings."
    >
      <div className="max-w-4xl space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Personal API Keys</h2>
          </div>
          <p className="text-muted-foreground">
            Use these keys to interact with your agents via the API. 
            Keep them secure—they grant full access to your account's agents.
          </p>

          <Card className="glass shadow-glow/10">
            <CardHeader>
              <CardTitle>Generate New Key</CardTitle>
              <CardDescription>
                Give your key a descriptive name (e.g. "Dev Machine", "Production App").
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="key-name">Key Name</Label>
                  <Input
                    id="key-name"
                    placeholder="e.g. Main Interface"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => createMutation.mutate(newKeyName)}
                    disabled={!newKeyName || createMutation.isPending}
                    className="bg-gradient-primary"
                  >
                    {createMutation.isPending ? "Generating..." : <><Plus className="mr-2 h-4 w-4" /> Generate Key</>}
                  </Button>
                </div>
              </div>

              {generatedKey && (
                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-primary">New API Key (Visible Once!)</Label>
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex gap-2">
                    <Input readOnly value={generatedKey} className="font-mono bg-background" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Copy this key now. For your security, we won't show it again.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">Your Active Keys</h3>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-16 w-full animate-pulse bg-muted rounded-lg" />
                <div className="h-16 w-full animate-pulse bg-muted rounded-lg" />
              </div>
            ) : keys.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">You haven't generated any API keys yet.</p>
            ) : (
              <div className="grid gap-4">
                {keys.map((key) => (
                  <Card key={key.id} className="glass transition-base hover:shadow-md">
                    <div className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{key.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground text-pretty">
                          Created on {new Date(key.created_at).toLocaleDateString()} 
                          {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleTimeString()}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm("Are you sure you want to revoke this API key?")) {
                            deleteMutation.mutate(key.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Settings;
