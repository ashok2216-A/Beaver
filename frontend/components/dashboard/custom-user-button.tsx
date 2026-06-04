'use client'

import React from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings } from 'lucide-react'

export function CustomUserButton() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  if (!isLoaded) {
    return <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
  }

  if (!user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none focus:ring-2 focus:ring-indigo-500 rounded-full transition-shadow">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shadow-sm relative">
          {user.imageUrl ? (
            <Image 
              src={user.imageUrl} 
              alt={user.fullName || 'User avatar'} 
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold text-xs">
              {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-glow-sm">
        <div className="flex items-center gap-3 p-2 mb-1">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 relative shrink-0">
            {user.imageUrl ? (
              <Image 
                src={user.imageUrl} 
                alt={user.fullName || 'User avatar'} 
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold text-sm">
                {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {user.fullName || 'User'}
            </span>
            <span className="text-xs text-slate-500 truncate">
              {user.primaryEmailAddress?.emailAddress}
            </span>
          </div>
        </div>
        
        <DropdownMenuSeparator className="my-1" />
        
        <DropdownMenuItem 
          onClick={() => router.push('/dashboard/settings')}
          className="p-2.5 rounded-xl cursor-pointer font-medium text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 focus:bg-slate-50 dark:focus:bg-slate-800"
        >
          <Settings className="w-4 h-4 mr-2 text-slate-400" />
          Manage account
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => {
            localStorage.clear()
            signOut(() => router.push('/'))
          }}
          className="p-2.5 rounded-xl cursor-pointer font-medium text-sm text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-500/10"
        >
          <LogOut className="w-4 h-4 mr-2 text-rose-400" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
