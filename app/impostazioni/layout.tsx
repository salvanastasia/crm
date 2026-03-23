import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"

export default function ImpostazioniLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin", "staff", "client"]}>
      {children}
    </ProtectedRoute>
  )
}
