'use client'

import React from 'react'
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Menu, Bell } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"
import { 
  LayoutGrid, 
  Cpu, 
  Settings, 
  Terminal, 
  Sparkles,
  Activity,
  Fingerprint,
  LifeBuoy,
  Search,
  Info,
  CheckCircle2,
  Shield
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomUserButton } from "./custom-user-button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { name: "Agents", href: "/dashboard/agents", icon: Cpu },
  { name: "Playground", href: "/dashboard/playground", icon: Sparkles },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Fingerprint },
  { name: "Analytics", href: "/dashboard/analytics", icon: Activity },
  { name: "Logs", href: "/dashboard/logs", icon: Terminal },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help", href: "/dashboard/help", icon: LifeBuoy },
]

export function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [mounted, setMounted] = React.useState(false)
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [notifications, setNotifications] = React.useState<any[]>([])
  const [tier, setTier] = React.useState<'free' | 'pro' | null>(null)
  const [loadingTier, setLoadingTier] = React.useState(true)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (globalSearch.trim()) {
      if (pathname.includes("/agents/new")) {
        router.push(`/dashboard/agents/new?tab=templates&query=${encodeURIComponent(globalSearch.trim())}`)
      } else {
        router.push(`/dashboard/agents?query=${encodeURIComponent(globalSearch.trim())}`)
      }
    }
  }

  React.useEffect(() => {
    setMounted(true)

    // 1. Check cache for instant load
    const cachedTier = localStorage.getItem("beaver_user_tier")
    if (cachedTier === 'pro') {
      setTier('pro')
      setLoadingTier(false)
    } else if (cachedTier === 'free') {
      setTier('free')
      setLoadingTier(false)
    }

    if (isLoaded && isSignedIn) {
      // 2. Fetch fresh tier from backend
      getToken().then(token => {
        if (!token) {
          setLoadingTier(false)
          return
        }
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => { 
            if (data?.plan_type === 'pro') {
              setTier('pro')
              localStorage.setItem("beaver_user_tier", "pro")
            } else {
              setTier('free')
              localStorage.setItem("beaver_user_tier", "free")
            }
          })
          .catch(() => {})
          .finally(() => setLoadingTier(false))
      })
    } else if (isLoaded && !isSignedIn) {
      setLoadingTier(false)
    }

    const loadNotifs = () => {
      const stored = localStorage.getItem("api2bot_notifications")
      if (stored) {
        setNotifications(JSON.parse(stored))
      } else {
        const initial = [
          { id: 1, type: "info", title: "Welcome to Beaver", description: "Start configuring and auto-discovering custom agents effortlessly." },
          { id: 2, type: "success", title: "System Initialized", description: "Core services and databases are running optimally." },
          { id: 3, type: "security", title: "Workspace Secured", description: "Your environment is protected by enterprise-grade encryption." }
        ]
        localStorage.setItem("api2bot_notifications", JSON.stringify(initial))
        setNotifications(initial)
      }
    }

    loadNotifs()
    window.addEventListener("storage", loadNotifs)
    const interval = setInterval(loadNotifs, 1500)

    return () => {
      window.removeEventListener("storage", loadNotifs)
      clearInterval(interval)
    }
  }, [isLoaded, isSignedIn, getToken])

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/20 bg-card/20 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
              <Link href="/" className="flex items-center gap-2">
                <div className="relative w-8 h-8 shrink-0">
                  <Image 
                    src="/logo.svg" 
                    alt="Beaver Logo" 
                    fill
                    className="object-contain dark:invert"
                    priority
                  />
                </div>
                <span className="text-xl font-bold text-foreground">Beaver</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4">
              <ul role="list" className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Separator */}
      <div className="h-6 w-px bg-border lg:hidden" />

      {/* Search */}
      <div className="flex-1 hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder={pathname.includes("/agents/new") ? "Search integrations (e.g. Gmail)..." : "Search agents, logs..."} 
            className="pl-10 bg-white/40 border border-white/20 rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </form>
      </div>

      {/* Right side */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                <span className="sr-only">View notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-[1.5px] ring-white dark:ring-slate-950 animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] rounded-2xl p-0 shadow-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</span>
                  {notifications.length > 0 && (
                    <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={() => {
                      localStorage.setItem("api2bot_notifications", "[]")
                      setNotifications([])
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                {notifications.length > 0 ? (
                  notifications.map((n, idx) => {
                    let Icon = Bell;
                    let iconWrapper = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                    
                    if (n.type === 'success') { 
                      Icon = CheckCircle2; 
                      iconWrapper = "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"; 
                    } else if (n.type === 'security') { 
                      Icon = Shield; 
                      iconWrapper = "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"; 
                    } else if (n.type === 'info') { 
                      Icon = Info; 
                      iconWrapper = "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"; 
                    }

                    return (
                      <DropdownMenuItem key={n.id || idx} className="flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-slate-50 dark:focus:bg-slate-800/50 transition-all outline-none group mb-1 last:mb-0">
                        <div className={`mt-0.5 p-2 rounded-full shrink-0 ${iconWrapper} ring-1 ring-inset ring-black/5 dark:ring-white/5 group-hover:scale-105 transition-transform`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none truncate">{n.title}</span>
                            <span className="text-[10px] font-medium text-slate-400 shrink-0">{n.time || "Just now"}</span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{n.description}</span>
                        </div>
                      </DropdownMenuItem>
                    )
                  })
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                      <Bell className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">You're all caught up</p>
                    <p className="text-xs text-slate-500 mt-1">No new notifications right now.</p>
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle — hidden for now */}
          {/* <ModeToggle /> */}

          {/* Tier Badge */}
          <Link href="/dashboard/billing">
            {loadingTier ? (
              <div className="h-6 w-16 rounded-full bg-slate-200/50 dark:bg-white/5 animate-pulse" />
            ) : tier === 'pro' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-white shadow-md shadow-yellow-300/60 hover:shadow-yellow-400/80 hover:brightness-110 transition-all">
                ✦ Pro
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all">
                Free
                <span className="text-[8px] font-bold text-slate-400">↑ Upgrade</span>
              </span>
            )}
          </Link>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" />

          {/* User menu */}
          {mounted ? (
            <CustomUserButton />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          )}
        </div>
      </div>
    </header>
  )
}
