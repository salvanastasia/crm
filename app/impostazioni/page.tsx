"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { BrandSettings } from "@/components/brand-settings"
import { NotificationSettings } from "@/components/notification-settings"
import { BusinessHours } from "@/components/business-hours"
import { ProfileSettings } from "@/components/profile-settings"
import { useAuth } from "@/components/auth-context"
import { useIsCapacitorNative } from "@/hooks/use-is-capacitor-native"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const isClient = user?.role === "client"
  const isCapacitorNative = useIsCapacitorNative()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Impostazioni</h1>
      <div className="grid grid-cols-1 gap-6">
        <ProfileSettings />
        {isClient && isCapacitorNative && (
          <Card>
            <CardHeader>
              <CardTitle>App</CardTitle>
              <CardDescription>Tema e uscita dall&apos;app</CardDescription>
            </CardHeader>
            <CardContent className="space-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Tema</span>
                <ModeToggle className="h-9 w-9 shrink-0" />
              </div>
              <Button type="button" variant="destructive" className="w-full" onClick={() => void handleLogout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Esci
              </Button>
            </CardContent>
          </Card>
        )}
        {!isClient && (
          <>
            <BrandSettings />
            <BusinessHours />
            <NotificationSettings />
          </>
        )}
      </div>
    </div>
  )
}
