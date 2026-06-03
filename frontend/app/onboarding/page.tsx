"use client"
import { Loader } from "@/components/ui/loader";

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import {  ChevronLeft, Blocks, FileJson, Bot, LayoutTemplate, Rocket, User, Briefcase } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const SIZES = ["Only me", "2-9", "10-99", "100-499", "500-999", "1,000-1,999", "2000+"]
const DEPARTMENTS = [
  "Sales", "RevOps", "HR & Recruitment", "Customer Support", "Operations", 
  "Marketing", "Product & Design", "Engineering", "IT & Technology", 
  "Data & Analytics", "Security", "Finance", "Legal", "Other"
]
const ROLES = [
  "Agency", "Founder", "Business owner", "Executive", "Manager", 
  "Individual contributor", "Freelancer", "Other"
]

export default function OnboardingPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { user } = useUser()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [companyName, setCompanyName] = useState("")
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [companySize, setCompanySize] = useState("")
  const [department, setDepartment] = useState("")
  const [role, setRole] = useState("")
  const [showWelcome, setShowWelcome] = useState(true)
  const [accountType, setAccountType] = useState<"individual" | "business" | "">("")

  useEffect(() => {
    if (step === 6) {
      setShowWelcome(true)
      const timer = setTimeout(() => {
        setShowWelcome(false)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [step])

  const totalSteps = 6

  const handleNext = () => {
    if (step === 1 && !accountType) return
    if (step === 2 && accountType === 'individual') {
      setStep(5)
    } else if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step === 5 && accountType === 'individual') {
      setStep(2)
    } else if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleFinish = async (startingPoint: string) => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) throw new Error("No token")

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          account_type: accountType,
          company_name: companyName,
          company_size: companySize,
          department,
          role,
          onboarding_completed: true
        })
      })

      if (res.ok) {
        toast.success("Welcome to Beaver!")
        if (startingPoint === 'playground') {
          router.push('/dashboard/playground')
        } else if (startingPoint === 'builder') {
          router.push('/dashboard/agents/new')
        } else {
          router.push('/dashboard')
        }
      } else {
        throw new Error("Failed to save profile")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred during onboarding.")
    } finally {
      setLoading(false)
    }
  }

  // Common wrapper layout
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Background Ambient Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full bg-purple-500/10 dark:bg-purple-500/20 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-pink-500/5 dark:bg-pink-500/10 blur-[80px] pointer-events-none" />

      {/* Top Bar */}
      <div className="w-full p-6 flex justify-between items-center text-sm text-slate-500 absolute top-0 left-0">
        <div className="flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          <span>You are signed in as <span className="underline decoration-slate-300 underline-offset-4">{user?.primaryEmailAddress?.emailAddress}</span></span>
        </div>
      </div>
      
      {/* Main Content Centered */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 z-10 animate-in fade-in duration-500">
        
        {/* Progress Dashes */}
        <div className="flex gap-2 mb-8 mt-12 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i + 1 <= step ? "bg-slate-900 dark:bg-white w-8" : "bg-slate-200 dark:bg-slate-800 w-8"
              )}
            />
          ))}
        </div>

        {/* Dynamic Content based on step */}
        <div className="w-full max-w-2xl flex flex-col items-center">
          
          {step === 1 && (
            <div className="w-full flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">How will you use Beaver?</h1>
              <p className="text-sm text-slate-500 mb-10">Choose the account type that best fits your needs.</p>
              
              <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                <button
                  onClick={() => {
                    setAccountType('individual')
                    setStep(2)
                  }}
                  className={cn(
                    "flex flex-col items-start p-6 rounded-xl border-2 transition-all duration-300 text-left",
                    accountType === 'individual' ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 bg-white hover:border-indigo-300 dark:bg-slate-900 dark:border-slate-800"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4">
                    <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Individual</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">For personal projects, freelancers, and independent developers.</p>
                </button>
                <button
                  onClick={() => {
                    setAccountType('business')
                    setStep(2)
                  }}
                  className={cn(
                    "flex flex-col items-start p-6 rounded-xl border-2 transition-all duration-300 text-left",
                    accountType === 'business' ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 bg-white hover:border-indigo-300 dark:bg-slate-900 dark:border-slate-800"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4">
                    <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Business</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">For teams, startups, and established organizations.</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="w-full max-w-sm flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {accountType === 'individual' ? "Your name" : "Your company name"}
              </h1>
              <p className="text-sm text-slate-500 mb-8 text-center">
                {accountType === 'individual' ? "Let's get to know you a bit better." : "What's the name of your organization?"}
              </p>
              
              <div className="w-full space-y-2 mb-6">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {accountType === 'individual' ? "Name" : "Company name"} <span className="text-red-500">*</span>
                </label>
                <Input 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Type here..."
                  className="h-11 rounded-lg border-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                />
              </div>

              <div className="w-full flex items-start gap-2 mb-8">
                <Checkbox 
                  id="terms" 
                  checked={termsAgreed}
                  onCheckedChange={(c) => setTermsAgreed(c === true)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-xs text-slate-600 leading-tight">
                  I agree to Beaver's <a href="#" className="underline">Terms and Conditions</a> and consent to the <a href="#" className="underline">Data Privacy Policy</a>. <span className="text-red-500">*</span>
                </label>
              </div>

              <div className="w-full flex justify-between items-center">
                <button onClick={handleBack} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>
                <Button 
                  onClick={handleNext}
                  disabled={!companyName.trim() || !termsAgreed}
                  className="w-24 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-md"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="w-full flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Your company size</h1>
              <p className="text-sm text-slate-500 mb-10 text-center">This helps us tailor our AI capabilities to the scale of your business.</p>
              
              <div className="flex flex-wrap justify-center gap-3 max-w-lg mb-12">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setCompanySize(s)
                      handleNext()
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-slate-200 bg-white hover:border-indigo-500 hover:text-indigo-600 transition-colors dark:bg-slate-900 dark:border-slate-800"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button onClick={handleBack} className="text-sm text-slate-500 hover:text-slate-800 self-start ml-4 flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Back
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="w-full flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Your department</h1>
              <p className="text-sm text-slate-500 mb-10 text-center">We'll customize your agent templates based on your team's focus.</p>
              
              <div className="flex flex-wrap justify-center gap-3 max-w-xl mb-12">
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDepartment(d)
                      handleNext()
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-slate-200 bg-white hover:border-indigo-500 hover:text-indigo-600 transition-colors dark:bg-slate-900 dark:border-slate-800"
                  >
                    {d}
                  </button>
                ))}
              </div>

              <button onClick={handleBack} className="text-sm text-slate-500 hover:text-slate-800 self-start ml-4 flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Back
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="w-full flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Your role</h1>
              <p className="text-sm text-slate-500 mb-10 text-center">We'll personalize your experience based on your daily workflow.</p>
              
              <div className="flex flex-wrap justify-center gap-3 max-w-lg mb-12">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r)
                      handleNext()
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-slate-200 bg-white hover:border-indigo-500 hover:text-indigo-600 transition-colors dark:bg-slate-900 dark:border-slate-800"
                  >
                    {r}
                  </button>
                ))}
              </div>

              <button onClick={handleBack} className="text-sm text-slate-500 hover:text-slate-800 self-start ml-4 flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Back
              </button>
            </div>
          )}

          {step === 6 && (
            <div className="w-full min-h-[50vh] flex flex-col items-center md:items-start justify-center px-4 md:px-12 mt-8 relative">
              {showWelcome ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
                  <h1 className="text-5xl md:text-7xl font-medium tracking-tighter text-slate-900 dark:text-white text-center mb-6">
                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-bold">Beaver</span>
                  </h1>
                  <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-light animate-in fade-in slide-in-from-left-8 duration-700 delay-300 fill-mode-backwards">
                    Setting up your intelligent workspace...
                  </p>
                </div>
              ) : (
                <div className="w-full max-w-4xl flex flex-col items-start">
                  <h1 className="text-5xl md:text-7xl font-medium tracking-tighter text-slate-900 dark:text-white mb-6 leading-tight animate-in fade-in slide-in-from-left-8 duration-700">
                    Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">workspace</span> <br className="hidden md:block" />
                    is ready.
                  </h1>
              
                  <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-14 max-w-2xl font-light leading-relaxed animate-in fade-in slide-in-from-left-8 duration-700 delay-150 fill-mode-backwards">
                    We've configured everything based on your preferences. You can now start building and deploying your first AI agent.
                  </p>
              
                  <div className="animate-in fade-in slide-in-from-left-8 duration-700 delay-300 fill-mode-backwards">
                    <Button 
                      onClick={() => handleFinish('builder')}
                      disabled={loading}
                      className="h-16 px-8 rounded-full text-lg font-medium bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-all duration-300 hover:scale-[1.03] active:scale-95 flex items-center gap-4 group shadow-md disabled:opacity-80 disabled:pointer-events-none"
                    >
                      {loading ? (
                        <>
                          Entering...
                          <Loader className="w-5 h-5 ml-1" text={false} />
                        </>
                      ) : (
                        <>
                          Enter Workspace 
                          <span className="bg-white/20 dark:bg-black/10 p-1.5 rounded-full group-hover:translate-x-1 transition-transform">
                            <ChevronLeft className="w-4 h-4 rotate-180" />
                          </span>
                        </>
                      )}
                    </Button>
                  </div>

              <div className="animate-in fade-in slide-in-from-left-8 duration-700 delay-500 fill-mode-backwards">
                <button onClick={handleBack} className="text-sm text-slate-500 hover:text-slate-800 self-start flex items-center gap-1 mt-8">
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>
              </div>
            </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
