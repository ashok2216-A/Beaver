import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export const CodeBlock = ({ code, language = "bash", filename }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[hsl(222_30%_7%)] text-[hsl(210_20%_92%)] shadow-soft">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex h-2 w-2 rounded-full bg-[hsl(0_72%_60%)]" />
          <span className="inline-flex h-2 w-2 rounded-full bg-[hsl(38_92%_55%)]" />
          <span className="inline-flex h-2 w-2 rounded-full bg-[hsl(152_69%_50%)]" />
          {filename && <span className="ml-3 font-mono text-white/60">{filename}</span>}
          {!filename && <span className="ml-3 font-mono text-white/40 uppercase tracking-wider">{language}</span>}
        </div>
        <Button size="sm" variant="ghost" onClick={onCopy} className="h-7 gap-1.5 text-white/70 hover:bg-white/10 hover:text-white">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
};
