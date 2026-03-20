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
        if (user.role === "client") {
          router.push("/booking")
        } else {
          router.push("/")
        }
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

