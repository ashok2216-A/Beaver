"use client";

import { useState } from "react";
import { Check, ArrowUpRight, Code2, Terminal, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const tabs = [
  { id: "curl", label: "cURL", icon: Terminal },
  { id: "python", label: "Python", icon: Code2 },
  { id: "react", label: "React", icon: Zap },
  { id: "node", label: "Node.js", icon: Shield },
];

const codeSamples = {
  "curl": {
    file: "request.sh",
    content: `curl -X POST https://api.beaver.dev/v1/agents/sales-coach \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "Analyze this transcript" }
    ],
    "tools": ["crm_search", "calendar"]
  }'`
  },
  "python": {
    file: "api_client.py",
    content: `import requests
import os

API_KEY = os.environ.get("BEAVER_API_KEY")

response = requests.post(
    "https://api.beaver.dev/v1/agents/sales-coach",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "messages": [{"role": "user", "content": "Analyze this transcript"}],
        "tools": ["crm_search"]
    }
)

print(response.json())`
  },
  "react": {
    file: "ChatComponent.tsx",
    content: `import { useState } from 'react';

export function ChatComponent() {
  const [response, setResponse] = useState(null);

  const askAgent = async () => {
    const res = await fetch('https://api.beaver.dev/v1/agents/sales-coach', {
      method: 'POST',
      headers: { 
        'Authorization': \`Bearer \${process.env.NEXT_PUBLIC_BEAVER_KEY}\`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello!' }] })
    });
    setResponse(await res.json());
  };

  return <button onClick={askAgent}>Ask Agent</button>;
}`
  },
  "node": {
    file: "agent.js",
    content: `const fetch = require('node-fetch');

async function runAgent() {
  const response = await fetch('https://api.beaver.dev/v1/agents/sales-coach', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.BEAVER_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Summarize the latest trends.' }]
    })
  });

  const data = await response.json();
  console.log(data.choices[0].message);
}

runAgent();`
  }
};

export function FrameworkSection() {
  const [activeTab, setActiveTab] = useState("curl");

  return (
    <section className="py-24 lg:py-32 bg-black border-y border-white/5 relative overflow-hidden">
      {/* Background glow (soft violet like Beaver brand) */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Content */}
          <div className="max-w-xl">
            <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display tracking-tight text-white mb-6 leading-[1.1]">
              A universal API gateway
              <br />
              for AI agents
            </h2>
            
            <p className="text-lg text-white/50 mb-10 leading-relaxed font-light">
              Beaver handles the heavy lifting of integrations: OpenAPI discovery, secure authentication, rate limiting, and tool routing. 
              That&apos;s thousands of hours of infrastructure work your agents don&apos;t have to worry about. The result? 
              Instant, production-ready capabilities.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                "One-click API discovery and schema generation",
                "Universal REST endpoints for any LLM framework",
                "Built-in authentication and security lockers",
                "Pre-configured templates for 50+ popular APIs"
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/80 font-medium">
                  <Check className="w-5 h-5 text-[#7c3aed]" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>

            <Link 
              href="/docs"
              className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-white/10 text-white font-medium hover:bg-primary/10 hover:border-primary/40 hover:text-white transition-all bg-transparent group"
            >
              Explore the API
              <ArrowUpRight className="w-4 h-4 ml-2 text-[#7c3aed] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Right Column: Code Editor */}
          <div className="relative min-w-0 w-full">
            {/* Top Navigation Pills */}
            <div className="flex mb-8 justify-start lg:justify-end overflow-x-auto pb-2 -mx-6 px-6 lg:mx-0 lg:px-0 lg:pb-0 scrollbar-none">
              <div className="inline-flex items-center p-1 rounded-full border border-white/10 bg-[#0a0a0a] min-w-max">
                {tabs.map((tab) => {
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? "bg-white/10 text-white border border-transparent shadow-[0_0_10px_rgba(124,58,237,0.1)]"
                          : "text-white/40 hover:text-white/60"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor Container */}
            <div className="bg-[#050505] p-1.5 sm:p-2 rounded-[1.5rem] shadow-2xl border border-white/5 ring-1 ring-[#7c3aed]/10">
              <div className="bg-[#0a0a0a] rounded-[1rem] border border-white/5 overflow-hidden">
                
                {/* Editor Header (File Tabs) */}
                <div className="flex border-b border-white/5 bg-white/5">
                  <div className="px-5 py-3.5 border-r border-white/5 flex items-center gap-2.5 bg-[#0a0a0a]">
                    <div className="w-4 h-4 text-[#7c3aed]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    </div>
                    <span className="text-[13px] font-bold text-white/90">
                      {codeSamples[activeTab as keyof typeof codeSamples].file}
                    </span>
                  </div>
                  <div className="px-5 py-3.5 border-r border-white/5 flex items-center gap-2.5 opacity-60">
                    <div className="w-4 h-4 text-[#7c3aed]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    </div>
                    <span className="text-[13px] font-medium text-white/40">
                      utils.py
                    </span>
                  </div>
                </div>

                {/* Code Area */}
                <div className="p-6 md:p-8 font-mono text-[13px] sm:text-sm leading-relaxed overflow-x-auto bg-[#0a0a0a] min-h-[300px] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                  <pre className="text-white/70">
                    {codeSamples[activeTab as keyof typeof codeSamples].content.split("\n").map((line, i) => (
                      <div key={i} className="flex">
                        <span className="flex-1 whitespace-pre">
                          {line.split(/(curl|POST|GET|Authorization|import|from|requests|print|export|function|const|await|fetch|return|require|async|console|JSON)/).map((part, j) => {
                            const highlighted = ["curl", "import", "from", "export", "function", "const", "await", "return", "require", "async"].includes(part);
                            const branded = ["POST", "GET", "Authorization", "requests", "fetch", "print", "console", "JSON"].includes(part);
                            return (
                              <span 
                                key={j} 
                                className={highlighted ? "text-[#a78bfa] font-medium" : branded ? "text-[#2dd4bf] font-medium" : ""}
                              >
                                {part}
                              </span>
                            );
                          })}
                        </span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            </div>

            {/* Decorative Element */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#7c3aed]/10 rounded-full blur-[80px] -z-10 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
