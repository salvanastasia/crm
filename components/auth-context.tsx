"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { AuthState, User } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { syncProfileFromAuthUser } from "@/lib/profile-sync"
import { toItalianAuthErrorMessage } from "@/lib/auth-error-messages"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export type RegisterResult = {
  success: boolean
  message: string
  /** true se serve conferma email prima del login */
  pendingConfirmation?: boolean
}

interface AuthContextType extends AuthState {
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (name: string, email: string, password: string) => Promise<RegisterResult>
  logout: () => Promise<void>
  /** Ricarica profilo da Supabase (es. dopo auto-link al salone di default) */
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseBrowserClient()
  const authMutationInFlightRef = useRef(false)
  const pathnameRef = useRef<string | null>(null)
  pathnameRef.current = pathname ?? null

  const isNavigatorLockRaceError = (error: unknown) => {
    const name = (error as any)?.name
    const msg = String((error as any)?.message ?? "")
    // Supabase/Auth (GoTrue) può emettere errori transitori quando più richieste contendono
    // lo stesso "navigator lock" (token refresh / getSession / signIn).
    return (
      name?.includes("NavigatorLock") ||
      msg.includes("NavigatorLockAcquireTimeoutError") ||
      msg.includes("another request stole it") ||
      msg.includes("was released because another request stole it")
    )
  }

  const upsertAndLoadProfile = useCallback(
    async (sessionUser: SupabaseUser): Promise<User | null> => {
      if (!supabase) return null
      return syncProfileFromAuthUser(supabase, sessionUser)
    },
    [supabase],
  )

  const resolveProfileWithTimeout = useCallback(
    async (sessionUser: SupabaseUser, timeoutMs = 8000): Promise<User | null> => {
      try {
        const timeout = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), timeoutMs)
        })
        const profile = await Promise.race([upsertAndLoadProfile(sessionUser), timeout])
        if (!profile) {
          console.warn("Auth profile resolution timed out or returned null")
        }
        return profile
      } catch (error) {
        console.error("resolveProfileWithTimeout error:", error)
        return null
      }
    },
    [upsertAndLoadProfile],
  )

  const refreshProfile = useCallback(async () => {
    if (!supabase) return
    let session
    try {
      const {
        data: { session: s },
      } = await supabase.auth.getSession()
      session = s
    } catch (error) {
      const name = (error as any)?.name
      const msg = (error as any)?.message
      if (name === "NavigatorLockAcquireTimeoutError" || String(msg ?? "").includes("NavigatorLockAcquireTimeoutError")) return
      console.error("refreshProfile:getSession error:", error)
      return
    }
    if (!session) return
    const user = await resolveProfileWithTimeout(session.user)
    if (user) {
      setAuthState((prev) => ({
        ...prev,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }))
    }
  }, [supabase, upsertAndLoadProfile])

  useEffect(() => {
    if (!supabase) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Config Supabase mancante",
      })
      return
    }

    const checkAuth = async () => {
      const currentPath =
        pathnameRef.current ?? (typeof window !== "undefined" ? window.location.pathname : "")
      // Evita race: mentre stiamo facendo sign-in/sign-up, non chiamiamo `getSession()`
      // (che può contendere lo stesso token lock).
      if (
        authMutationInFlightRef.current ||
        currentPath.startsWith("/update-password") ||
        currentPath.startsWith("/auth/callback")
      )
        return
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          const user = await resolveProfileWithTimeout(session.user)
          if (user) {
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } else {
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: "Profilo utente non trovato",
            })
          }
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      } catch (error) {
        if (isNavigatorLockRaceError(error)) {
          // Non resettare lo stato auth: potrebbe essere in corso un SIGNED_IN che
          // aggiornerà poi `authState` via onAuthStateChange.
          setAuthState((prev) => ({ ...prev, isLoading: false, error: null }))
          return
        }

        console.error("Errore durante il controllo dell'autenticazione:", error)
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: "Errore durante il controllo dell'autenticazione",
        }))
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const currentPath =
          pathnameRef.current ?? (typeof window !== "undefined" ? window.location.pathname : "")

        // Durante /update-password evitiamo sync di `profiles` (può fallire per RLS
        // in questa fase) e soprattutto evitiamo redirect automatici.
        if (currentPath.startsWith("/update-password") || currentPath.startsWith("/auth/callback")) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
          return
        }

        const user = await resolveProfileWithTimeout(session.user)
        if (user) {
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          // Keep current page on hard refresh/session restore.
          // Redirect only when user is on auth pages right after login.
          const isAuthPage =
            currentPath === "/login" || currentPath.startsWith("/signup") || currentPath.startsWith("/register")

          let target: string
          if (user.role === "client") {
            target = "/booking"
          } else if (user.role === "admin" && !user.barberId) {
            target = "/onboarding"
          } else {
            target = "/dashboard"
          }
          if (isAuthPage && currentPath !== target) {
            router.replace(target)
          }
        }
      } else if (event === "SIGNED_OUT") {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
        const currentPath = pathnameRef.current ?? (typeof window !== "undefined" ? window.location.pathname : "")
        if (currentPath !== "/login") {
          router.replace("/login")
        }
      }
    })

    checkAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, resolveProfileWithTimeout])

  const loginWithPassword = async (email: string, password: string) => {
    if (!supabase) {
      return { success: false, message: "Config Supabase mancante" }
    }
    authMutationInFlightRef.current = true
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        const message = toItalianAuthErrorMessage(error.message)
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: message,
        })
        return { success: false, message }
      }

      setAuthState((prev) => ({ ...prev, isLoading: false, error: null }))
      return { success: true, message: "Accesso effettuato." }
    } catch (error) {
      const errorMessage = toItalianAuthErrorMessage(error instanceof Error ? error.message : null)
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      })
      return { success: false, message: errorMessage }
    } finally {
      authMutationInFlightRef.current = false
    }
  }

  const register = async (name: string, email: string, password: string) => {
    if (!supabase) {
      return { success: false, message: "Config Supabase mancante" }
    }
    authMutationInFlightRef.current = true
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Per email/password-only: dopo conferma email vai alla pagina login,
          // evitando `/auth/callback` (che gestisce OTP/magic link).
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            name,
          },
        },
      })

      if (error) {
        const message = toItalianAuthErrorMessage(error.message)
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }))
        return { success: false, message }
      }

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
      }))

      const pendingConfirmation = !data.session
      if (pendingConfirmation) {
        return {
          success: true,
          message: "Controlla la tua email per confermare l'account, poi accedi con email e password.",
          pendingConfirmation: true,
        }
      }

      return {
        success: true,
        message: "Account creato.",
        pendingConfirmation: false,
      }
    } catch (error) {
      const errorMessage = toItalianAuthErrorMessage(error instanceof Error ? error.message : null)
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))

      return { success: false, message: errorMessage }
    }
    finally {
      authMutationInFlightRef.current = false
    }
  }

  const logout = async () => {
    try {
      if (!supabase) return
      authMutationInFlightRef.current = true
      await supabase.auth.signOut()

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })

      router.replace("/login")
    } catch (error) {
      console.error("Errore durante il logout:", error)
    } finally {
      authMutationInFlightRef.current = false
    }
  }

  const value = {
    ...authState,
    loginWithPassword,
    register,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth deve essere usato all'interno di un AuthProvider")
  }

  return context
}

