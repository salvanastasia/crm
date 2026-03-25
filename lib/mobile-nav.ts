import type { LucideIcon } from "lucide-react"
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  LayoutDashboard,
  ListOrdered,
  Scissors,
  UserCircle,
  Users,
  UsersRound,
} from "lucide-react"

export type StaffNavItem = {
  name: string
  href: string
  icon: LucideIcon
}

/** Stessi percorsi della nav staff in header; icone per la bottom bar su Capacitor. */
export const staffNavItems: StaffNavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clienti", href: "/clienti", icon: Users },
  { name: "Servizi", href: "/servizi", icon: Scissors },
  { name: "Team", href: "/risorse", icon: UsersRound },
  { name: "Calendario", href: "/calendario", icon: CalendarDays },
]

export type ClientMobileNavItem = {
  name: string
  href: string
  icon: LucideIcon
}

export const clientMobileNavItems: ClientMobileNavItem[] = [
  { name: "Prenota", href: "/booking", icon: CalendarPlus },
  { name: "Prenotazioni", href: "/le-tue-prenotazioni", icon: ListOrdered },
  { name: "Notifiche", href: "/notifiche", icon: Bell },
  { name: "Profilo", href: "/impostazioni", icon: UserCircle },
]

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  if (href === "/") return false
  return pathname.startsWith(`${href}/`)
}
