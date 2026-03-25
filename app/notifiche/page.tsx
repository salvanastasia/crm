import { Suspense } from "react"
import { NotificheClient } from "./notifiche-client"

export default function NotifichePage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Caricamento…</div>}>
      <NotificheClient />
    </Suspense>
  )
}

