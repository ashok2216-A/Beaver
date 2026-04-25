import { useState, useEffect, useRef } from "react";
import { Sparkles, User, Send } from "lucide-react";

interface ScriptMessage {
  role: "user" | "assistant";
  text: string;
  extra?: React.ReactNode;
}

const SEQUENCE: ScriptMessage[] = [
  {
    role: "user",
    text: "Show me my last 3 customers from Stripe",
  },
  {
    role: "assistant",
    text: "Here are your 3 most recent customers:",
    extra: (
      <div className="mt-4 rounded-lg border border-border/50 bg-background/50 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            <tr>
              <td className="px-3 py-2 font-mono text-muted-foreground">cus_NffrFeUfNV2Hib</td>
              <td className="px-3 py-2">acme@inc.com</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-mono text-muted-foreground">cus_NffrAR2Hib2NV</td>
              <td className="px-3 py-2">jane@stark.io</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-mono text-muted-foreground">cus_NffrZ8Hi2NbAR</td>
              <td className="px-3 py-2">tom@nova.app</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    role: "user",
    text: "Refund the last charge for the first one",
  },
  {
    role: "assistant",
    text: "Done! Refunded $128.00 to acme@inc.com via POST /v1/refunds. Receipt sent.",
  },
  {
    role: "user",
    text: "Can you summarize our recent Stripe activity?",
  },
  {
    role: "assistant",
    text: "Last 24h: 12 new customers, 3 refunds processed, $4.2k net revenue.",
  },
];

export const ChatPreview = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [history, setHistory] = useState<ScriptMessage[]>([]);
  const [isTyping, setIsTyping] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Typing animation
  useEffect(() => {
    if (!isTyping) return;

    const currentMessage = SEQUENCE[activeIndex];

    if (currentMessage.role === "assistant") {
      setTypedText(currentMessage.text);
      return;
    }

    if (typedText.length < currentMessage.text.length) {
      const timeout = setTimeout(() => {
        setTypedText(currentMessage.text.slice(0, typedText.length + 1));
      }, 30 + Math.random() * 30);

      return () => clearTimeout(timeout);
    }
  }, [typedText, isTyping, activeIndex]);

  // Message transitions
  useEffect(() => {
    const currentMessage = SEQUENCE[activeIndex];

    if (isTyping && typedText === currentMessage.text) {
      const nextIndex = activeIndex + 1;
      const isLast = nextIndex >= SEQUENCE.length;
      const delay = activeIndex % 2 === 0 ? 800 : 2000;

      const timeout = setTimeout(() => {
        setIsTyping(false);
        setHistory((prev) => [...prev, currentMessage]);
        setTypedText("");

        setTimeout(() => {
          if (!isLast) {
            setActiveIndex(nextIndex);
            setIsTyping(true);
          } else {
            setHistory([]);
            setActiveIndex(0);
            setIsTyping(true);
          }
        }, 400);
      }, isLast ? 4000 : delay);

      return () => clearTimeout(timeout);
    }
  }, [typedText, activeIndex, isTyping]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [history, typedText]);

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">Stripe API Agent</span>
        <div className="flex items-center gap-1.5 text-xs font-medium text-green-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="h-[380px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-card to-background"
      >
        {history.map((msg, i) => (
          <Message key={`hist-${i}`} role={msg.role} text={msg.text} extra={msg.extra} />
        ))}
        {isTyping && (
          <Message
            key={`active-${activeIndex}`}
            role={SEQUENCE[activeIndex].role}
            text={typedText}
            isTyping={SEQUENCE[activeIndex].role === "user"}
            extra={typedText === SEQUENCE[activeIndex].text ? SEQUENCE[activeIndex].extra : undefined}
          />
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-4 bg-background/50">
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
          <input
            type="text"
            placeholder="Ask your agent anything..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            readOnly
          />
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Message = ({
  role,
  text,
  extra,
  isTyping,
}: {
  role: "user" | "assistant";
  text: string;
  extra?: React.ReactNode;
  isTyping?: boolean;
}) => {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-md"
            : "bg-muted/50 border border-border/50 rounded-tl-md"
        }`}
      >
        <span>{text}</span>
        {isTyping && (
          <span className="ml-0.5 inline-block w-0.5 h-4 bg-current animate-pulse" />
        )}
        {extra}
      </div>
    </div>
  );
};
