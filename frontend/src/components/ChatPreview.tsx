import React, { useState, useEffect, useRef } from "react";
import { Sparkles, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScriptMessage {
  role: "user" | "assistant";
  text: string;
  extra?: React.ReactNode;
}

const SEQUENCE: ScriptMessage[] = [
  { 
    role: "user", 
    text: "Show me my last 3 customers from Stripe" 
  },
  { 
    role: "assistant", 
    text: "Here are your 3 most recent customers:",
    extra: (
      <div className="mt-3 space-y-2 rounded-lg border border-border bg-background p-3 text-[10px] sm:text-xs font-mono shadow-sm">
        <div className="flex justify-between border-b border-border/50 pb-1 flex-wrap gap-1">
          <span className="text-muted-foreground mr-4">cus_NffrFeUfNV2Hib</span>
          <span className="font-medium">acme@inc.com</span>
        </div>
        <div className="flex justify-between border-b border-border/50 pb-1 flex-wrap gap-1">
          <span className="text-muted-foreground mr-4">cus_NffrAR2Hib2NV</span>
          <span className="font-medium">jane@stark.io</span>
        </div>
        <div className="flex justify-between flex-wrap gap-1">
          <span className="text-muted-foreground mr-4">cus_NffrZ8Hi2NbAR</span>
          <span className="font-medium">tom@nova.app</span>
        </div>
      </div>
    )
  },
  { 
    role: "user", 
    text: "Refund the last charge for the first one" 
  },
  { 
    role: "assistant", 
    text: "Refunded $128.00 to acme@inc.com via POST /v1/refunds. Receipt sent ✅" 
  },
  {
    role: "user",
    text: "Can you summarize our recent Stripe activity?"
  },
  {
    role: "assistant",
    text: "Over the last 24h: 12 new customers, 3 refunds processed, and $4.2k net revenue. 📈"
  },
  {
    role: "user",
    text: "Awesome. Lockdown all endpoints for now."
  },
  {
    role: "assistant",
    text: "Sure, I've locked down all endpoints. You can unlock them anytime by clicking the lock icon in the top right corner."
  },
];

export const ChatPreview = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [history, setHistory] = useState<ScriptMessage[]>([]);
  const [isTyping, setIsTyping] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // EFFECT 1: Handle individual character typing
  useEffect(() => {
    if (!isTyping) return;

    const currentMessage = SEQUENCE[activeIndex];
    
    // Typing animation only for user messages
    if (currentMessage.role === "assistant") {
      setTypedText(currentMessage.text);
      return;
    }

    if (typedText.length < currentMessage.text.length) {
      const lastChar = typedText.slice(-1);
      let baseDelay = 30;
      if (lastChar === "," || lastChar === ":") baseDelay = 250;
      if (lastChar === ".") baseDelay = 400;
      
      const timeout = setTimeout(() => {
        setTypedText(currentMessage.text.slice(0, typedText.length + 1));
      }, baseDelay + Math.random() * 30);
      
      return () => clearTimeout(timeout);
    }
  }, [typedText, isTyping, activeIndex]);

  // EFFECT 2: Handle transitions between messages
  useEffect(() => {
    const currentMessage = SEQUENCE[activeIndex];
    
    // Check if current message actually finished typing
    if (isTyping && typedText === currentMessage.text) {
      const nextIndex = activeIndex + 1;
      const isLast = nextIndex >= SEQUENCE.length;
      
      // Delay before switching to next step
      const advanceDelay = activeIndex % 2 === 0 ? 800 : 2500;
      const endDelay = 5000;

      const timeout = setTimeout(() => {
        setIsTyping(false); 
        setHistory(prev => [...prev, currentMessage]);
        setTypedText("");

        // Schedule start of next message
        setTimeout(() => {
          if (!isLast) {
            setActiveIndex(nextIndex);
            setIsTyping(true);
          } else {
            // Restart loop
            setHistory([]);
            setActiveIndex(0);
            setIsTyping(true);
          }
        }, 500); // Brief moment of silence between bubbles
      }, isLast ? endDelay : advanceDelay);

      return () => clearTimeout(timeout);
    }
  }, [typedText, activeIndex, isTyping]);

  // EFFECT 3: Smoothly slide down when new messages are added or being typed
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [history, typedText, isTyping]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated transition-colors hover:shadow-glow/20">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(0_72%_65%)] shadow-sm" />
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(38_92%_60%)] shadow-sm" />
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(152_69%_50%)] shadow-sm" />
        </div>
        <div className="text-xs font-semibold text-muted-foreground tracking-wide">Stripe API Agent Preview</div>
        <div className="flex items-center gap-1.5 text-xs text-success font-bold">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
          Live
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="h-[430px] overflow-y-auto space-y-5 bg-gradient-card p-6 flex flex-col pt-10 modern-scrollbar"
      >
        <div className="flex flex-col gap-5">
          {history.map((msg, i) => (
            <Message key={`hist-${i}`} role={msg.role} text={msg.text} extra={msg.extra} />
          ))}
          {isTyping && (
             <Message 
              key={`active-${activeIndex}`}
              role={SEQUENCE[activeIndex].role} 
              text={typedText} 
              isTyping={SEQUENCE[activeIndex].role === "user"} 
              extra={SEQUENCE[activeIndex].extra}
             />
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 shadow-inner">
          <div className="flex-1 text-sm text-muted-foreground/60 italic min-h-[1.25rem]">
            {activeIndex % 2 === 0 && isTyping && typedText === "" ? (
               <span className="flex items-center gap-1">
                 Generating response<span className="flex gap-0.5"><span className="animate-bounce">.</span><span className="animate-bounce [animation-delay:0.2s]">.</span><span className="animate-bounce [animation-delay:0.4s]">.</span></span>
               </span>
            ) : "Ask your agent anything..."}
          </div>
          <button 
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow"
          >
            <Sparkles className="h-4 w-4" />
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
  isTyping 
}: { 
  role: "user" | "assistant"; 
  text: string; 
  extra?: React.ReactNode;
  isTyping?: boolean;
}) => {
  const isUser = role === "user";
  
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse text-right" : ""}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md ${
          isUser ? "bg-secondary text-foreground" : "bg-gradient-primary text-primary-foreground"
        }`}
      >
        {isUser ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed relative ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-none shadow-soft"
            : "bg-background border border-border rounded-tl-none shadow-sm"
        }`}
      >
        <span className="block">{text}</span>
        {isTyping && (
          <span className="absolute bottom-4 right-2 inline-block w-1.5 h-4 bg-primary/40 animate-pulse align-middle" />
        )}
        
        {extra && (
          <div className="overflow-hidden">
            {extra}
          </div>
        )}
      </div>
    </div>
  );
};
