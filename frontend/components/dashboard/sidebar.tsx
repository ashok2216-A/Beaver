'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutGrid, 
  Cpu, 
  Settings, 
  Terminal, 
  Sparkles,
  Activity,
  Fingerprint,
  LifeBuoy,
  BookOpen,
  Code2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { name: "Agents", href: "/dashboard/agents", icon: Cpu },
  { name: "Playground", href: "/dashboard/playground", icon: Sparkles },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Fingerprint },
  { name: "Analytics", href: "/dashboard/analytics", icon: Activity },
  { name: "Logs", href: "/dashboard/logs", icon: Terminal },
]

const secondaryNavigation = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Documentation", href: "/docs", icon: BookOpen },
  { name: "API Reference", href: "/docs#api-integration", icon: Code2 },
  { name: "Help", href: "/docs", icon: LifeBuoy },
]

export function DashboardSidebar({ 
  isCollapsed, 
  onToggle 
}: { 
  isCollapsed?: boolean, 
  onToggle?: () => void 
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out border-r border-border bg-card shadow-xl",
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Collapse Toggle Button - Outside scroll container */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 z-[60] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-sm transition-transform hover:scale-110"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="flex grow flex-col gap-y-5 overflow-y-auto px-4 pb-4">
          {/* Logo */}
          <div className={cn(
            "flex h-16 shrink-0 items-center transition-all duration-300",
            isCollapsed ? "justify-center" : "px-2"
          )}>
            <Link href="/" className="flex items-center gap-2 group/logo">
              <div className="w-8 h-8 bg-primary dark:bg-gradient-to-br dark:from-[#eca8d6] dark:via-[#a78bfa] dark:to-[#67e8f9] rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover/logo:scale-105 transition-transform shrink-0">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold tracking-tight text-foreground transition-opacity duration-300">Beaver</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== "/dashboard" && pathname.startsWith(item.href))
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex gap-x-3 rounded-xl p-2 text-sm font-medium leading-6 transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            isCollapsed && "justify-center"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>

              <li className="mt-auto">
                <ul role="list" className="-mx-2 space-y-1">
                  {secondaryNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex gap-x-3 rounded-xl p-2 text-sm font-medium leading-6 transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            isCollapsed && "justify-center"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
