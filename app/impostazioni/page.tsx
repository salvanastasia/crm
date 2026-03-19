import { BrandSettings } from "@/components/brand-settings"
import { NotificationSettings } from "@/components/notification-settings"
import { BusinessHours } from "@/components/business-hours"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Impostazioni</h1>
      <div className="grid grid-cols-1 gap-6">
        <BrandSettings />
        <BusinessHours />
        <NotificationSettings />
      </div>
    </div>
  )
}

