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
        console.warn('Failed to mark integration as connected:', e)
      }

      setStatus('success')
      
      if (window.opener) {
        window.opener.postMessage('oauth_success', '*');
        window.close();
      } else {
        const returnUrl = localStorage.getItem('oauth_return_to') || '/dashboard/agents/new?tab=templates';
        localStorage.removeItem('oauth_return_to');
        router.push(returnUrl);
      }
    }

    processCallback()
  }, [searchParams, router, getToken])

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-semibold mb-2">Connection Failed</h1>
        <p className="text-muted-foreground mb-6">{errorMessage}</p>
        <Button onClick={() => window.close()}>Close Window</Button>
      </div>
    )
  }

  // Return a simple loader while processing, otherwise null to close instantly
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="w-6 h-6 animate-spin text-primary" text={false} />
    </div>
  )
}
