"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User, LogOut, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { getBrandSettings } from "@/lib/actions"
import { useAuth } from "@/components/auth-context"
import type { BrandSettings } from "@/lib/types"

const staffNavItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Clienti", href: "/clienti" },
  { name: "Servizi", href: "/servizi" },
  { name: "Dipendenti", href: "/risorse" },
  { name: "Calendario", href: "/calendario" },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [settings, setSettings] = useState<BrandSettings | null>(null)
  const { user, isAuthenticated, logout } = useAuth()

  const isStaff = user && (user.role === "admin" || user.role === "staff")
  const isClient = user?.role === "client"

  const isClientBookingFlow = isClient && pathname.startsWith("/booking")

  useEffect(() => {
    const loadSettings = async () => {
      const barberId = user?.barberId
      const data = barberId ? await getBrandSettings(barberId) : null
      setSettings(data)
    }

    void loadSettings()

    const handleSettingsUpdate = (e: CustomEvent<BrandSettings>) => {
      setSettings(e.detail)
    }

    window.addEventListener("brandSettingsUpdated", handleSettingsUpdate as EventListener)

    return () => {
      window.removeEventListener("brandSettingsUpdated", handleSettingsUpdate as EventListener)
    }
  }, [user?.barberId])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const brandLabel = settings?.businessName || "Barber CRM"

  /** Client booking: solo logo, tema, utente — niente CRM */
  if (isAuthenticated && isClientBookingFlow) {
    return (
      <header className="border-b bg-background">
        <div className="max-w-3xl mx-auto w-full px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/booking" className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={settings?.logoUrl || "/placeholder.svg?height=32&width=32"} alt="" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold truncate">{brandLabel}</span>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <ModeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarUrl || "/placeholder.svg?height=32&width=32"} alt="" />
                      <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/booking" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Prenota
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/le-tue-prenotazioni" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Le Tue Prenotazioni
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={isStaff ? "/dashboard" : isClient ? "/booking" : "/"} className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={settings?.logoUrl || "/placeholder.svg?height=32&width=32"} alt="Logo" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold">{brandLabel}</span>
            </Link>

            {isAuthenticated && isStaff && (
              <nav className="hidden md:flex items-center space-x-4">
                {staffNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 text-sm transition-colors hover:text-primary",
                      pathname === item.href ? "text-primary font-medium" : "text-muted-foreground",
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            <ModeToggle />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarUrl || "/placeholder.svg?height=32&width=32"} alt="Avatar" />
                      <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isClient && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/booking">Prenota</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/le-tue-prenotazioni">Le Tue Prenotazioni</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {isStaff && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/impostazioni" className="w-full">
                          Impostazioni
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link href="/login">Accedi</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
