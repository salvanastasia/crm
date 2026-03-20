"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"

/** Wraps CRM routes: only admin + staff; clients are redirected */
export function StaffRouteLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["admin", "staff"]}>{children}</ProtectedRoute>
}
