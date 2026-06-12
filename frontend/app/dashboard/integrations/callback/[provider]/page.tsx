'use client'
import { Loader } from "@/components/ui/loader";

import { useEffect, useState, use } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {  CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
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
          const toolkitMap: Record<string, string> = {
            'gmail': 'gmail',
            'google_calendar': 'googlecalendar',
            'google_drive': 'googledrive',
            'google_sheets': 'googlesheets',
            'google_docs': 'googledocs',
            'google_maps': 'googlemaps',
            'google_chat': 'google_chat',
            'github_mcp': 'github',
            'slack_mcp': 'slack',
            'notion': 'notion',
            'instagram': 'instagram',
            'youtube': 'youtube',
            'linear': 'linear',
            'jira': 'jira',
            'apify': 'apify',
            'google_tasks': 'googletasks',
            'google_meet': 'googlemeet',
            'openweathermap': 'weathermap',
            'figma': 'figma',
            'reddit': 'reddit',
            'linkedin': 'linkedin',
            'dropbox': 'dropbox',
            'bitbucket': 'bitbucket',
            'elevenlabs': 'elevenlabs',
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
        console.warn('Failed to mark integration as connected:', e)
      }

      setStatus('success')
      
      // Triple-redundant communication:
      // 1. window.opener.postMessage
      if (window.opener) {
        try {
          window.opener.postMessage('oauth_success', '*');
        } catch (e) {
          console.warn('postMessage to opener failed:', e);
        }
      }

      // 2. BroadcastChannel
      try {
        const bc = new BroadcastChannel('oauth_channel');
        bc.postMessage({ type: 'oauth_success', provider: resolvedParams.provider });
        bc.close();
      } catch (e) {
        console.warn('BroadcastChannel failed:', e);
      }

      // 3. localStorage event trigger
      try {
        localStorage.setItem('oauth_success_trigger', JSON.stringify({
          provider: resolvedParams.provider,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('localStorage trigger failed:', e);
      }

      // Auto-close popup after 1.5 seconds if permitted by browser
      const timer = setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          console.warn('Auto-close failed:', e);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }

    processCallback()
  }, [searchParams, router, getToken, resolvedParams.provider])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4 font-sans relative overflow-hidden">
        {/* Background Ambient Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full bg-rose-500/10 dark:bg-rose-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full bg-orange-500/10 dark:bg-orange-500/20 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 p-8 relative text-center z-10">
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 animate-pulse animate-duration-1000">
              <AlertCircle className="w-10 h-10" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Connection Failed
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            {errorMessage || "OAuth authorization was denied or failed."}
          </p>

          <Button 
            onClick={() => {
              try { window.close(); } catch (e) {}
            }}
            className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors shadow-sm shadow-rose-500/20"
          >
            Close Window
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4 font-sans relative overflow-hidden">
        {/* Background Ambient Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full bg-teal-500/10 dark:bg-teal-500/20 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 p-8 relative text-center z-10">
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Connected!
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Integration authorized successfully. You can now close this window or return to the dashboard.
          </p>

          <Button 
            onClick={() => {
              try { window.close(); } catch (e) {}
            }}
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-sm shadow-emerald-500/20"
          >
            Close Window
          </Button>
        </div>
      </div>
    )
  }

  // Return a beautiful processing view
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4 font-sans relative overflow-hidden">
      {/* Background Ambient Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full bg-purple-500/10 dark:bg-purple-500/20 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 p-8 relative text-center z-10">
        <div className="flex justify-center mb-6">
          <Loader className="w-10 h-10 animate-spin text-primary" text={false} />
        </div>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium">
          Completing authorization connection...
        </p>
      </div>
    </div>
  )
}
