import type React from "react"
import { StaffRouteLayout } from "@/components/staff-route-layout"

export default function StaffSectionLayout({ children }: { children: React.ReactNode }) {
  return <StaffRouteLayout>{children}</StaffRouteLayout>
}
