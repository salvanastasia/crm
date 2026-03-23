"use client"

import { BrandSettings } from "@/components/brand-settings"
import { NotificationSettings } from "@/components/notification-settings"
import { BusinessHours } from "@/components/business-hours"
import { ProfileSettings } from "@/components/profile-settings"
import { useAuth } from "@/components/auth-context"

export default function SettingsPage() {
  const { user } = useAuth()
  const isClient = user?.role === "client"

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Impostazioni</h1>
      <div className="grid grid-cols-1 gap-6">
        <ProfileSettings />
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

