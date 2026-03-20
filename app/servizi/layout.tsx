import type React from "react"
import { StaffRouteLayout } from "@/components/staff-route-layout"

export default function ServiziLayout({ children }: { children: React.ReactNode }) {
  return <StaffRouteLayout>{children}</StaffRouteLayout>
}
