'use client'

import * as React from 'react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Github Logo SVG
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

// Google Logo SVG
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

// Corner Plus SVG
const CornerPlus = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-slate-200 dark:text-slate-800" />
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" className="text-slate-200 dark:text-slate-800" />
  </svg>
)

export function CustomAuth() {
  const { client, setActive, loaded } = useClerk()
  const signIn = client?.signIn
  const signUp = client?.signUp
  const router = useRouter()
  
  const [email, setEmail] = React.useState('')
  const [otp, setOtp] = React.useState('')
  const [step, setStep] = React.useState<'initial' | 'verify'>('initial')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleOAuth = (strategy: 'oauth_google' | 'oauth_github') => {
    if (!signIn) return
    signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    })
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn || !signUp || !email) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // 1. Check if user exists by attempting sign in
      const { supportedFirstFactors } = await signIn.create({ identifier: email })
      const emailCodeFactor = supportedFirstFactors?.find((f) => f.strategy === 'email_code')
      
      if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
        // User exists, send OTP for sign in
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailCodeFactor.emailAddressId
        })
        setStep('verify')
      } else {
        // Fallback if they have an account but email code is not enabled
        setError('Email code authentication is not supported for this account. Please use OAuth or a password.')
      }
    } catch (err: any) {
      if (err.errors && err.errors[0]?.code === 'form_identifier_not_found') {
        // 2. User doesn't exist, create sign up
        try {
          await signUp.create({ emailAddress: email })
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
          setStep('verify')
        } catch (signupErr: any) {
          setError(signupErr.errors?.[0]?.longMessage || 'An error occurred during sign up.')
        }
      } else {
        setError(err.errors?.[0]?.longMessage || 'An error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn || !signUp || !otp) return
    
    setIsLoading(true)
    setError('')
    
    try {
      if (signIn.status === 'needs_first_factor') {
        const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code: otp })
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId })
          router.push('/dashboard')
        }
      } else if (signUp.status === 'missing_requirements') {
        const result = await signUp.attemptEmailAddressVerification({ code: otp })
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId })
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || 'Invalid code.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4 font-sans relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 p-10 relative">
        {/* Corner Plus Details */}
        <CornerPlus className="absolute top-4 left-4" />
        <CornerPlus className="absolute top-4 right-4" />
        <CornerPlus className="absolute bottom-4 left-4" />
        <CornerPlus className="absolute bottom-4 right-4" />

        {/* Logo Element */}
        <div className="flex justify-center mb-8 relative">
          <img src="/logo.svg" alt="Beaver Logo" className="w-12 h-12 object-contain dark:invert" />
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">Welcome to Beaver</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400">Log in or register with your email</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        {step === 'initial' ? (
          <>
            <form onSubmit={handleEmailSubmit} className="space-y-4 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-200">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email..." 
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-[#635BFF] hover:bg-[#524BEE] text-white font-medium flex items-center justify-center transition-colors shadow-sm shadow-indigo-500/20 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
              </button>
            </form>

            <div className="flex items-center gap-4 mb-8">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <span className="text-sm text-slate-400 dark:text-slate-500">or</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleOAuth('oauth_google')}
                className="w-full h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-medium flex items-center justify-center transition-colors shadow-sm"
              >
                <GoogleIcon className="w-5 h-5 mr-3" />
                Continue with Google
              </button>
              <button 
                onClick={() => handleOAuth('oauth_github')}
                className="w-full h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-medium flex items-center justify-center transition-colors shadow-sm"
              >
                <GithubIcon className="w-5 h-5 mr-3" />
                Continue with Github
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
             <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                We sent a verification code to <strong className="text-slate-900 dark:text-white">{email}</strong>.
              </p>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-200">Verification Code</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code" 
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 tracking-widest text-center text-lg font-medium"
                  required
                  maxLength={6}
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading || otp.length < 6}
                className="w-full h-12 rounded-xl bg-[#635BFF] hover:bg-[#524BEE] text-white font-medium flex items-center justify-center transition-colors shadow-sm shadow-indigo-500/20 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
              </button>
              
              <button 
                type="button" 
                onClick={() => { setStep('initial'); setOtp(''); setError(''); }}
                className="w-full text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Back to login
              </button>
          </form>
        )}
      </div>
    </div>
  )
}
