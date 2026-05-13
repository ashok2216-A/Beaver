"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { cn } from "@/lib/utils"

import { usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  // Hide sidebar/header ONLY on the agent builder (IDE) page
  const isBuilderPage = pathname.match(/\/dashboard\/agents\/\d+$/)

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
