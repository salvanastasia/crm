"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Array<"admin" | "staff" | "client">
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push("/") // Reindirizza alla home se l'utente non ha i permessi necessari
      }
    }
  }, [isAuthenticated, isLoading, router, allowedRoles, user])

  if (isLoading) {
    return <div>Caricamento...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

