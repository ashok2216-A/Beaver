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
      const code = searchParams.get("code")
      const state = searchParams.get("state")
      const error = searchParams.get("error")

      if (error) {
        setStatus('error')
        setErrorMessage(searchParams.get("error_description") || "OAuth authorization was denied or failed.")
        return
      }

      if (!code || !state) {
        setStatus('error')
        setErrorMessage("Missing required authorization code or state parameters.")
        return
      }

      try {
        const token = await getToken()
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/oauth/callback/${resolvedParams.provider}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        if (res.ok) {
          setStatus('success')
          setTimeout(() => {
            const returnUrl = localStorage.getItem('oauth_return_to') || '/dashboard/agents/new?tab=templates';
            localStorage.removeItem('oauth_return_to');
            router.push(returnUrl);
          }, 1500)
        } else {
          const errData = await res.json().catch(() => ({}))
          setStatus('error')
          setErrorMessage(errData.detail || "Failed to verify OAuth token with provider.")
        }
      } catch (err) {
        setStatus('error')
        setErrorMessage("Network error while completing integration exchange.")
      }
    }

    processCallback()
  }, [searchParams, resolvedParams.provider, getToken, router])

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md rounded-3xl backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden bg-card/60">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {status === 'processing' && (
              <div className="p-4 rounded-full bg-primary/10 text-primary animate-pulse border border-primary/20">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-in zoom-in-75">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            )}
            {status === 'error' && (
              <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-in zoom-in-75">
                <AlertCircle className="h-10 w-10" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'processing' && `Connecting ${resolvedParams.provider.toUpperCase()}...`}
            {status === 'success' && "Integration Successful!"}
            {status === 'error' && "Integration Failed"}
          </CardTitle>
          <CardDescription className="text-sm mt-1.5">
            {status === 'processing' && "Securely exchanging authorization codes and storing credentials in encrypted vault."}
            {status === 'success' && "Your account has been securely connected. Redirecting back to studio..."}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        {status === 'error' && (
          <CardContent className="pt-2 pb-6 text-center">
            <Button 
              variant="outline" 
              className="rounded-xl border-border/60 shadow-sm"
              onClick={() => router.push('/dashboard/agents/new?tab=templates')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Studio
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
