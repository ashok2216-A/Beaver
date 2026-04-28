import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function addNotification(title: string, description: string) {
  try {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("api2bot_notifications")
    const list = stored ? JSON.parse(stored) : []
    list.unshift({
      id: Date.now(),
      title,
      description
    })
    localStorage.setItem("api2bot_notifications", JSON.stringify(list.slice(0, 50))) // Keep max 50
  } catch (e) {
    console.error("Notification Error:", e)
  }
}
