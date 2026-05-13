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
// Deterministic hash for pseudo-random values based on seed
export const hash = (seed: number) => {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const getAgentColor = (id: number) => {
  const r = Math.floor(hash(id * 10) * 256);
  const g = Math.floor(hash(id * 20) * 256);
  const b = Math.floor(hash(id * 30) * 256);
  
  // High saturation, adjusted brightness
  const accent = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
  const glow = `rgba(${r}, ${g}, ${b}, 0.3)`;
  const glass = `rgba(${r}, ${g}, ${b}, 0)`;
  const muted = `rgba(${r}, ${g}, ${b}, 0.05)`;

  return { accent, glow, glass, muted, r, g, b };
};
