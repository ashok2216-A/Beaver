'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useUser, useAuth, useClerk } from "@clerk/nextjs"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface UserPreferences {
  email_notifications: boolean
  weekly_reports: boolean
}

export default function SettingsPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const { signOut } = useClerk()
  const router = useRouter()
  const [prefs, setPrefs] = useState<UserPreferences>({
    email_notifications: true,
    weekly_reports: false
  })
  const [loading, setLoading] = useState(true)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function fetchPrefs() {
      try {
        const token = await getToken()
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setPrefs({
            email_notifications: data.email_notifications,
            weekly_reports: data.weekly_reports
          })
        }
      } catch (err) {
        console.error("Failed to fetch preferences:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPrefs()
  }, [getToken])

  const updatePreference = async (key: keyof UserPreferences, value: boolean) => {
    // Optimistic update
    const oldPrefs = { ...prefs }
    setPrefs(prev => ({ ...prev, [key]: value }))

    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [key]: value })
      })

      if (!res.ok) throw new Error("Failed to update")
      toast.success("Preferences updated")
    } catch (err) {
      setPrefs(oldPrefs)
      toast.error("Failed to save preference")
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return

    setIsDeleting(true)
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        toast.success("Account deleted successfully")
        await signOut()
        router.push("/")
      } else {
        throw new Error("Failed to delete account")
      }
    } catch (err) {
      toast.error("An error occurred while deleting your account")
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl md:ml-8 lg:ml-12">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Card className="rounded-3xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              value={user?.primaryEmailAddress?.emailAddress || ''} 
              readOnly
              disabled 
              className="bg-white/40 border-white/50"
            />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input 
              value={user?.fullName || ''} 
              readOnly
              placeholder="Your name"
              className="bg-white/40 border-white/50"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/20 border border-white/30 transition-all">
            <div className="space-y-0.5">
              <Label>Email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your agents
              </p>
            </div>
            <Switch 
              checked={prefs.email_notifications} 
              onCheckedChange={(val) => updatePreference('email_notifications', val)}
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/20 border border-white/30 transition-all">
            <div className="space-y-0.5">
              <Label>Weekly reports</Label>
              <p className="text-sm text-muted-foreground">
                Get weekly usage summaries
              </p>
            </div>
            <Switch 
              checked={prefs.weekly_reports} 
              onCheckedChange={(val) => updatePreference('weekly_reports', val)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl bg-rose-500/5 backdrop-blur-xl border-rose-500/20 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-rose-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions. All your data will be permanently wiped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="rounded-xl shadow-lg shadow-rose-500/20">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl bg-background/95 backdrop-blur-2xl border-white/20 shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-semibold text-rose-600">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  This action cannot be undone. This will permanently delete your
                  account and remove all your data from our servers.
                </AlertDialogDescription>
                <div className="mt-6 space-y-3">
                  <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Type <b className="font-semibold text-foreground">DELETE</b> to confirm:</Label>
                  <Input 
                    placeholder="DELETE" 
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="h-12 rounded-xl border-0 bg-muted/50 shadow-none focus-visible:ring-1 focus-visible:ring-rose-500/50"
                  />
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel onClick={() => setDeleteConfirmation("")} className="rounded-xl border-white/50">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== "DELETE" || isDeleting}
                  className="rounded-xl bg-rose-500 hover:bg-rose-600 font-semibold shadow-lg shadow-rose-500/20"
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
