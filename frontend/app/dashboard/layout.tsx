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
      <div className="min-h-screen bg-background">
        <main className="h-screen">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
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
