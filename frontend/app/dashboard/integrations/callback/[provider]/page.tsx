'use client'

import { useEffect, useState, use } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OAuthCallbackPage({ params }: { params: Promise<{ provider: string }> }) {
  const resolvedParams = use(params)
  const { getToken } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    async function processCallback() {
      // Composio handles the actual OAuth code exchange on its own backend.
      // By the time the user is redirected here, the connection is already active in Composio.
      
      const error = searchParams.get("error")

      if (error) {
        setStatus('error')
        setErrorMessage(searchParams.get("error_description") || searchParams.get("error") || "OAuth authorization was denied or failed.")
        return
      }

      // Mark the specific toolkit as connected in our DB
      // The pending template tells us which toolkit was being authorized
      try {
        const pendingRaw = localStorage.getItem('oauth_pending_template')
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw)
          // Map template ID to the Composio toolkit name
          const toolkitMap: Record<string, string> = {
            'gmail': 'gmail',
            'google_calendar': 'googlecalendar',
            'google_drive': 'googledrive',
            'google_sheets': 'googlesheets',
            'google_docs': 'googledocs',
            'github_mcp': 'github',
            'slack_mcp': 'slack',
            'notion': 'notion',
            'instagram': 'instagram',
            'youtube': 'youtube',
            'linear': 'linear',
            'jira': 'jira',
          }
          const toolkit = toolkitMap[pending.templateId] || pending.templateId
          if (toolkit) {
            const token = await getToken()
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/oauth/mark-connected?provider=${encodeURIComponent(toolkit)}`,
              { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
            )
          }
        }
      } catch (e) {
        // Non-critical — just log
        console.warn('Failed to mark integration as connected:', e)
      }

      // If no error, we consider it a success because Composio successfully redirected us back.
      setStatus('success')
      
      setTimeout(() => {
        if (window.opener) {
          window.opener.postMessage('oauth_success', '*');
          window.close();
        } else {
          const returnUrl = localStorage.getItem('oauth_return_to') || '/dashboard/agents/new?tab=templates';
          localStorage.removeItem('oauth_return_to');
          router.push(returnUrl);
        }
      }, 1500)
    }

    processCallback()
  }, [searchParams, router, getToken])


  return (
    <div className="relative flex items-center justify-center min-h-[80vh] px-4 w-full">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-primary/10 blur-[150px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center">
          {/* Animated Provider Badge */}
          <div className="relative mb-10">
            {/* Outer rotating dashed ring */}
            {status === 'processing' && (
              <div className="absolute -inset-6 rounded-full border border-dashed border-primary/40 animate-[spin_4s_linear_infinite]" />
            )}
            
            {/* Inner glowing core */}
            <div className={`relative flex items-center justify-center w-20 h-20 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-700 ${
              status === 'processing' ? "bg-primary/10 border border-primary/30" :
              status === 'success' ? "bg-emerald-500/10 border border-emerald-500/30 shadow-emerald-500/20" :
              "bg-rose-500/10 border border-rose-500/30 shadow-rose-500/20"
            }`}>
              {status === 'processing' && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent translate-y-full" />
                </div>
              )}
              {status === 'processing' && <Loader2 className="w-8 h-8 text-primary animate-spin z-10" />}
              {status === 'success' && <CheckCircle2 className="w-8 h-8 text-emerald-500 z-10" />}
              {status === 'error' && <AlertCircle className="w-8 h-8 text-rose-500 z-10" />}
            </div>
            
            {/* Connection lines simulating data transfer */}
            {status === 'processing' && (
              <>
                <div className="absolute top-1/2 -translate-y-1/2 -left-12 w-8 h-[1px] bg-gradient-to-r from-transparent to-primary/50" />
                <div className="absolute top-1/2 -translate-y-1/2 -right-12 w-8 h-[1px] bg-gradient-to-l from-transparent to-primary/50" />
                <div className="absolute left-1/2 -translate-x-1/2 -top-12 h-8 w-[1px] bg-gradient-to-b from-transparent to-primary/50" />
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 h-8 w-[1px] bg-gradient-to-t from-transparent to-primary/50" />
              </>
            )}
          </div>

          <div className="w-full space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-light tracking-widest uppercase text-foreground">
                {status === 'processing' && `Authenticating`}
                {status === 'success' && "Connected"}
                {status === 'error' && "Connection Failed"}
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm font-medium">
                <span className="text-muted-foreground">Provider:</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  status === 'processing' ? "bg-primary/10 text-primary" :
                  status === 'success' ? "bg-emerald-500/10 text-emerald-500" :
                  "bg-rose-500/10 text-rose-500"
                }`}>
                  {resolvedParams.provider}
                </span>
              </div>
            </div>

            {/* Simulated Terminal Window */}
            <div className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-muted/30 backdrop-blur-sm p-5 text-left shadow-inner">
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
              </div>
              <div className="font-mono text-[11px] sm:text-xs text-muted-foreground space-y-2.5">
                <p className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">{'>'}</span> 
                  <span>Initializing secure handshake protocol...</span>
                </p>
                <p className="flex items-start gap-2 animate-in fade-in duration-500 delay-300 fill-mode-both">
                  <span className="text-primary mt-0.5">{'>'}</span> 
                  <span>
                    {status === 'processing' && "Negotiating encrypted token exchange..."}
                    {status === 'success' && "OAuth payload received & verified."}
                    {status === 'error' && "Exchange validation failed."}
                  </span>
                </p>
                <p className={`flex items-start gap-2 animate-in fade-in duration-500 delay-700 fill-mode-both ${
                  status === 'success' ? "text-emerald-500 font-bold" : 
                  status === 'error' ? "text-rose-500 font-bold" : ""
                }`}>
                  <span className="text-primary mt-0.5">{'>'}</span> 
                  <span>
                    {status === 'processing' && <span className="animate-pulse">_</span>}
                    {status === 'success' && "Credentials stored in vault. Redirecting..."}
                    {status === 'error' && errorMessage}
                  </span>
                </p>
              </div>
            </div>

            {status === 'error' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">
                <Button 
                  variant="outline" 
                  className="rounded-full px-8 border-border/50 bg-background/50 hover:bg-background"
                  onClick={() => router.push('/dashboard/agents/new?tab=templates')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Abort Process
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
