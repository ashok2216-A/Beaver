import { Sparkles, User } from "lucide-react";

export const ChatPreview = () => {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/40">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(0_72%_65%)]" />
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(38_92%_60%)]" />
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(152_69%_50%)]" />
        </div>
        <div className="text-xs font-medium text-muted-foreground">Stripe API Agent</div>
        <div className="flex items-center gap-1.5 text-xs text-success">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
          Live
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-5 bg-gradient-card p-6">
        <Message role="user" text="Show me my last 3 customers from Stripe" />
        <Message
          role="assistant"
          text="Here are your 3 most recent customers:"
          extra={
            <div className="mt-3 space-y-2 rounded-lg border border-border bg-background p-3 text-xs font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">cus_NffrFeUfNV2Hib</span><span>acme@inc.com</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">cus_NffrAR2Hib2NV</span><span>jane@stark.io</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">cus_NffrZ8Hi2NbAR</span><span>tom@nova.app</span></div>
            </div>
          }
        />
        <Message role="user" text="Refund the last charge for the first one" />
        <Message
          role="assistant"
          text="Refunded $128.00 to acme@inc.com via POST /v1/refunds. Receipt sent ✅"
        />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-background">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
          <input
            disabled
            placeholder="Ask your agent anything..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Message = ({ role, text, extra }: { role: "user" | "assistant"; text: string; extra?: React.ReactNode }) => {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser ? "bg-secondary text-foreground" : "bg-gradient-primary text-primary-foreground"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-background border border-border rounded-tl-sm"
        }`}
      >
        {text}
        {extra}
      </div>
    </div>
  );
};
