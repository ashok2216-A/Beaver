'use client'

import { useState } from "react"
import { Copy, Check, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function DeveloperPage() {
  const [copiedCode, setCopiedCode] = useState(false)
  const [activeTab, setActiveTab] = useState("cURL")
  
  const masterEndpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat/orchestrate`

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // --- Python ---
  const pythonSnippet = `import requests

url = "${masterEndpoint}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "message": "Find the latest news about AI and draft a tweet about it."
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`

  const ColoredPython = () => (
    <>
      <span className="text-pink-400">import</span> <span className="text-sky-300">requests</span>{'\n\n'}
      <span className="text-sky-300">url</span> <span className="text-pink-400">=</span> <span className="text-green-300">"{masterEndpoint}"</span>{'\n'}
      <span className="text-sky-300">headers</span> <span className="text-pink-400">=</span> {'{\n'}
      {'    '}<span className="text-green-300">"Authorization"</span>: <span className="text-green-300">"Bearer YOUR_API_KEY"</span>,{'\n'}
      {'    '}<span className="text-green-300">"Content-Type"</span>: <span className="text-green-300">"application/json"</span>{'\n'}
      {'}'}{'\n'}
      <span className="text-sky-300">data</span> <span className="text-pink-400">=</span> {'{\n'}
      {'    '}<span className="text-green-300">"message"</span>: <span className="text-green-300">"Find the latest news about AI and draft a tweet about it."</span>{'\n'}
      {'}'}{'\n\n'}
      <span className="text-sky-300">response</span> <span className="text-pink-400">=</span> requests.<span className="text-yellow-200">post</span>(url, headers<span className="text-pink-400">=</span>headers, json<span className="text-pink-400">=</span>data){'\n'}
      <span className="text-yellow-200">print</span>(response.<span className="text-yellow-200">json</span>())
    </>
  )

  // --- cURL ---
  const curlSnippet = `curl -X POST ${masterEndpoint} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello Agent!"}'`

  const ColoredCurl = () => (
    <>
      <span className="text-yellow-200">curl</span> <span className="text-pink-400">-X</span> <span className="text-sky-300">POST</span> <span className="text-green-300">{masterEndpoint}</span> \{'\n'}
      {'  '}<span className="text-pink-400">-H</span> <span className="text-green-300">"Authorization: Bearer YOUR_API_KEY"</span> \{'\n'}
      {'  '}<span className="text-pink-400">-H</span> <span className="text-green-300">"Content-Type: application/json"</span> \{'\n'}
      {'  '}<span className="text-pink-400">-d</span> <span className="text-green-300">'{"{"}"message": "Hello Agent!"{"}"}'</span>
    </>
  )

  // --- Node.js ---
  const nodeSnippet = `const fetch = require('node-fetch');

async function sendMessage() {
  const response = await fetch('${masterEndpoint}', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: "Hello Agent!" })
  });

  const data = await response.json();
  console.log(data);
}

sendMessage();`

  const ColoredNode = () => (
    <>
      <span className="text-pink-400">const</span> <span className="text-sky-300">fetch</span> <span className="text-pink-400">=</span> <span className="text-yellow-200">require</span>(<span className="text-green-300">'node-fetch'</span>);{'\n\n'}
      <span className="text-pink-400">async function</span> <span className="text-yellow-200">sendMessage</span>() {'{\n'}
      {'  '}<span className="text-pink-400">const</span> <span className="text-sky-300">response</span> <span className="text-pink-400">=</span> <span className="text-pink-400">await</span> <span className="text-yellow-200">fetch</span>(<span className="text-green-300">'{masterEndpoint}'</span>, {'{\n'}
      {'    '}method: <span className="text-green-300">'POST'</span>,{'\n'}
      {'    '}headers: {'{\n'}
      {'      '}<span className="text-green-300">'Authorization'</span>: <span className="text-green-300">'Bearer YOUR_API_KEY'</span>,{'\n'}
      {'      '}<span className="text-green-300">'Content-Type'</span>: <span className="text-green-300">'application/json'</span>{'\n'}
      {'    }'},{'\n'}
      {'    '}body: <span className="text-sky-300">JSON</span>.<span className="text-yellow-200">stringify</span>({'{'} message: <span className="text-green-300">"Hello Agent!"</span> {'}'}){'\n'}
      {'  }'});{'\n\n'}
      {'  '}<span className="text-pink-400">const</span> <span className="text-sky-300">data</span> <span className="text-pink-400">=</span> <span className="text-pink-400">await</span> <span className="text-sky-300">response</span>.<span className="text-yellow-200">json</span>();{'\n'}
      {'  '}<span className="text-sky-300">console</span>.<span className="text-yellow-200">log</span>(<span className="text-sky-300">data</span>);{'\n'}
      {'}'}{'\n\n'}
      <span className="text-yellow-200">sendMessage</span>();
    </>
  )

  // --- React ---
  const reactSnippet = `import { useState } from 'react';

export function AgentChat() {
  const [response, setResponse] = useState(null);

  const sendMessage = async () => {
    const res = await fetch('${masterEndpoint}', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: "Hello Agent!" })
    });
    const data = await res.json();
    setResponse(data);
  };

  return <button onClick={sendMessage}>Send Message</button>;
}`

  const ColoredReact = () => (
    <>
      <span className="text-pink-400">import</span> {'{'} <span className="text-sky-300">useState</span> {'}'} <span className="text-pink-400">from</span> <span className="text-green-300">'react'</span>;{'\n\n'}
      <span className="text-pink-400">export function</span> <span className="text-yellow-200">AgentChat</span>() {'{\n'}
      {'  '}<span className="text-pink-400">const</span> [<span className="text-sky-300">response</span>, <span className="text-sky-300">setResponse</span>] <span className="text-pink-400">=</span> <span className="text-yellow-200">useState</span>(<span className="text-pink-400">null</span>);{'\n\n'}
      {'  '}<span className="text-pink-400">const</span> <span className="text-yellow-200">sendMessage</span> <span className="text-pink-400">=</span> <span className="text-pink-400">async</span> () <span className="text-pink-400">=&gt;</span> {'{\n'}
      {'    '}<span className="text-pink-400">const</span> <span className="text-sky-300">res</span> <span className="text-pink-400">=</span> <span className="text-pink-400">await</span> <span className="text-yellow-200">fetch</span>(<span className="text-green-300">'{masterEndpoint}'</span>, {'{\n'}
      {'      '}method: <span className="text-green-300">'POST'</span>,{'\n'}
      {'      '}headers: {'{\n'}
      {'        '}<span className="text-green-300">'Authorization'</span>: <span className="text-green-300">'Bearer YOUR_API_KEY'</span>,{'\n'}
      {'        '}<span className="text-green-300">'Content-Type'</span>: <span className="text-green-300">'application/json'</span>{'\n'}
      {'      }'},{'\n'}
      {'      '}body: <span className="text-sky-300">JSON</span>.<span className="text-yellow-200">stringify</span>({'{'} message: <span className="text-green-300">"Hello Agent!"</span> {'}'}){'\n'}
      {'    }'});{'\n'}
      {'    '}<span className="text-pink-400">const</span> <span className="text-sky-300">data</span> <span className="text-pink-400">=</span> <span className="text-pink-400">await</span> <span className="text-sky-300">res</span>.<span className="text-yellow-200">json</span>();{'\n'}
      {'    '}<span className="text-yellow-200">setResponse</span>(<span className="text-sky-300">data</span>);{'\n'}
      {'  }'};{'\n\n'}
      {'  '}<span className="text-pink-400">return</span> {'<'}<span className="text-pink-400">button</span> <span className="text-sky-300">onClick</span><span className="text-pink-400">=</span>{'{'}sendMessage{'}'}{'>'}Send Message{'</'}<span className="text-pink-400">button</span>{'>'};{'\n'}
      {'}'}
    </>
  )

  const activeSnippet = activeTab === "Python" ? pythonSnippet :
                        activeTab === "cURL" ? curlSnippet :
                        activeTab === "Node.js" ? nodeSnippet : reactSnippet;

  const ActiveComponent = activeTab === "Python" ? ColoredPython :
                          activeTab === "cURL" ? ColoredCurl :
                          activeTab === "Node.js" ? ColoredNode : ColoredReact;


  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center pt-8 pb-24 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-[32px] font-bold tracking-tight text-foreground">MasterAgent API</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground font-medium">
          Integrate Beaver's orchestration engine directly into your applications.<br />
          Read through our <Link href="/api-reference" className="text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">API reference</Link> or follow the quickstart guide below.
        </p>
      </div>

      {/* Quickstart Card */}
      <div className="mt-14 w-full max-w-[850px] bg-transparent border border-border rounded-md p-8 sm:p-10 text-left">
        
        {/* Card Header */}
        <div className="flex items-center justify-between pb-8">
          <h2 className="text-[20px] font-bold text-foreground">Developer quickstart</h2>
          <div className="flex items-center gap-2 text-[14px] text-foreground font-medium">
            {/* The Select Dropdown for Languages */}
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-fit h-8 px-3 gap-2 bg-transparent hover:bg-muted/30 border-border/60 shadow-none font-medium text-[13px] rounded-md focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="cURL">cURL</SelectItem>
                <SelectItem value="Node.js">Node.js</SelectItem>
                <SelectItem value="React">React</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-10">
          
          {/* API Key Section */}
          <section>
            <h3 className="text-[16px] font-semibold text-foreground">Get your API key</h3>
            <p className="text-[14px] text-muted-foreground mt-1 mb-4">
              You need an API key for secure access to your project.
            </p>
            <Link 
              href="/dashboard/api-keys"
              className="inline-flex items-center gap-2 h-8 px-3 rounded border border-border/70 hover:bg-muted/40 text-[13px] font-medium text-foreground transition-colors w-fit shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-muted-foreground" /> API key
            </Link>
          </section>

          {/* Installation Section */}
          <section>
            <h3 className="text-[16px] font-semibold text-foreground">Call the MasterAgent Orchestration API</h3>
            <p className="text-[14px] text-muted-foreground mt-1 mb-4">
              To start interacting with your agents using {activeTab}, copy and run the snippet below:
            </p>
            
            <div className="relative group rounded-xl bg-[#0D1117] border border-slate-800 flex overflow-hidden shadow-xl">
              {/* Line numbers */}
              <div className="py-4 pl-4 pr-3 text-right text-slate-500 font-mono text-[13px] select-none border-r border-slate-800 bg-[#0A0D12]">
                {activeSnippet.split('\n').map((_, i) => (
                  <div key={i} className="leading-relaxed">{i + 1}</div>
                ))}
              </div>
              
              {/* Code */}
              <pre className="p-4 overflow-x-auto text-[13px] font-mono text-slate-300 w-full leading-relaxed">
                <code><ActiveComponent /></code>
              </pre>

              {/* Copy Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded"
                onClick={() => handleCopy(activeSnippet)}
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </section>
        </div>
      </div>

    </div>
  )
}
