"use client"
import { Loader } from "@/components/ui/loader";

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { cn } from "@/lib/utils"

import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { getToken, isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    async function checkOnboarding() {
      if (!isLoaded) return
      if (!isSignedIn) {
        setIsCheckingOnboarding(false)
        return
      }
      try {
        const token = await getToken()
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          if (!data.onboarding_completed) {
            router.push('/onboarding')
            return
          }
        }
      } catch (e) {
        console.error("Failed to check onboarding status", e)
      }
      setIsCheckingOnboarding(false)
    }
    checkOnboarding()
  }, [isLoaded, isSignedIn, getToken, router])

  // Hide sidebar/header ONLY on the agent builder (IDE) page
  const isBuilderPage = pathname.match(/\/dashboard\/agents\/\d+$/)

  if (isCheckingOnboarding) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc]">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (isBuilderPage) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: '#f8fafc',
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(234, 168, 214, 0.2) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(167, 139, 250, 0.2) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(103, 232, 249, 0.15) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(167, 139, 250, 0.15) 0px, transparent 50%)
          `
        }}
      >
        <main className="h-screen">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(234, 168, 214, 0.2) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(167, 139, 250, 0.2) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(103, 232, 249, 0.08) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(167, 139, 250, 0.15) 0px, transparent 50%)
        `
      }}
    >
      <DashboardSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={cn(
        "transition-all duration-300 ease-in-out relative z-10",
        isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        <DashboardHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
