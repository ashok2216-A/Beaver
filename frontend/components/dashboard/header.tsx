'use client'

import React from 'react'
import { UserButton, useAuth } from "@clerk/nextjs"
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
  Search
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
  const { getToken } = useAuth()
  const [mounted, setMounted] = React.useState(false)
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [notifications, setNotifications] = React.useState<any[]>([])
  const [tier, setTier] = React.useState<'free' | 'pro'>('free')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (globalSearch.trim()) {
      router.push(`/dashboard/agents?query=${encodeURIComponent(globalSearch.trim())}`)
    }
  }

  React.useEffect(() => {
    setMounted(true)

    // Fetch real tier from backend
    getToken().then(token => {
      if (!token) return
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.plan_type === 'pro') setTier('pro') })
        .catch(() => {})
    })

    const loadNotifs = () => {
      const stored = localStorage.getItem("api2bot_notifications")
      if (stored) {
        setNotifications(JSON.parse(stored))
      } else {
        const initial = [
          { id: 1, title: "🎉 Welcome to API Studio", description: "Start configuring and auto-discovering custom API tools effortlessly." },
          { id: 2, title: "🚀 System Upgraded", description: "FastAPI schema validations scaled for premium operations securely." },
          { id: 3, title: "🔑 API Key Generated", description: "A new standalone access secret was bound effectively." },
          { id: 4, title: "⚡ Playground Connected", description: "Master LLM routing channels configured flawlessly." }
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
  }, [])

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
            placeholder="Search agents, logs..." 
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
              <Button variant="ghost" size="icon" className="relative rounded-xl">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="sr-only">View notifications</span>
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-glow-sm">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="font-bold text-xs text-foreground uppercase tracking-widest">Notifications</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={() => {
                      localStorage.setItem("api2bot_notifications", "[]")
                      setNotifications([])
                    }}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest px-2 py-1 rounded-md hover:bg-rose-500/5"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <DropdownMenuSeparator className="my-1" />
              {notifications.length > 0 ? (
                notifications.map((n, idx) => (
                  <DropdownMenuItem key={n.id || idx} className="flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer focus:bg-muted/50">
                    <span className="text-xs font-bold text-foreground">{n.title}</span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">{n.description}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-8 text-center text-[11px] text-muted-foreground font-medium">
                  All caught up! No active notifications.
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle — hidden for now */}
          {/* <ModeToggle /> */}

          {/* Tier Badge */}
          <Link href="/dashboard/billing">
            {tier === 'pro' ? (
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
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          )}
        </div>
      </div>
    </header>
  )
}
