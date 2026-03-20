"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { AuthState, User } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { syncProfileFromAuthUser } from "@/lib/profile-sync"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export type RegisterResult = {
  success: boolean
  message: string
  /** true se serve conferma email prima del login */
  pendingConfirmation?: boolean
}

interface AuthContextType extends AuthState {
  /** Magic Link via email */
  login: (email: string) => Promise<{ success: boolean; message: string }>
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
  const supabase = getSupabaseBrowserClient()

  const upsertAndLoadProfile = useCallback(
    async (sessionUser: SupabaseUser): Promise<User | null> => {
      if (!supabase) return null
      return syncProfileFromAuthUser(supabase, sessionUser)
    },
    [supabase],
  )

  const refreshProfile = useCallback(async () => {
    if (!supabase) return
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const user = await upsertAndLoadProfile(session.user)
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
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          const user = await upsertAndLoadProfile(session.user)
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
        console.error("Errore durante il controllo dell'autenticazione:", error)
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: "Errore durante il controllo dell'autenticazione",
        })
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const user = await upsertAndLoadProfile(session.user)
        if (user) {
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          if (user.role === "client") {
            router.push("/booking")
          } else if (user.role === "admin" && !user.barberId) {
            router.push("/onboarding")
          } else {
            router.push("/")
          }
        }
      } else if (event === "SIGNED_OUT") {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
        router.push("/login")
      }
    })

    checkAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, upsertAndLoadProfile])

  const login = async (email: string) => {
    if (!supabase) {
      return { success: false, message: "Config Supabase mancante" }
    }
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error.message,
        })
        return { success: false, message: error.message }
      }

      setAuthState((prev) => ({ ...prev, isLoading: false, error: null }))
      return { success: true, message: "Ti abbiamo inviato un link di accesso via email." }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Errore durante l'accesso"
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      })

      return { success: false, message: errorMessage }
    }
  }

  const loginWithPassword = async (email: string, password: string) => {
    if (!supabase) {
      return { success: false, message: "Config Supabase mancante" }
    }
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error.message,
        })
        return { success: false, message: error.message }
      }

      setAuthState((prev) => ({ ...prev, isLoading: false, error: null }))
      return { success: true, message: "Accesso effettuato." }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Errore durante l'accesso"
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      })
      return { success: false, message: errorMessage }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    if (!supabase) {
      return { success: false, message: "Config Supabase mancante" }
    }
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name,
          },
        },
      })

      if (error) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }))
        return { success: false, message: error.message }
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
      const errorMessage = error instanceof Error ? error.message : "Errore durante la registrazione"
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))

      return { success: false, message: errorMessage }
    }
  }

  const logout = async () => {
    try {
      if (!supabase) return
      await supabase.auth.signOut()

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })

      router.push("/login")
    } catch (error) {
      console.error("Errore durante il logout:", error)
    }
  }

  const value = {
    ...authState,
    login,
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

