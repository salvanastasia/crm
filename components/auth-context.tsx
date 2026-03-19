"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { AuthState, User } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface AuthContextType extends AuthState {
  login: (email: string) => Promise<{ success: boolean; message: string }>
  register: (name: string, email: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
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

  const upsertAndLoadProfile = async (sessionUser: SupabaseUser): Promise<User | null> => {
    if (!supabase) return null
    const fallbackName =
      (sessionUser.user_metadata?.name as string | undefined) ||
      (sessionUser.email ? sessionUser.email.split("@")[0] : "Utente")
    const fallbackRole = (sessionUser.user_metadata?.role as string | undefined) || "client"

    await supabase.from("profiles").upsert(
      {
        id: sessionUser.id,
        email: sessionUser.email ?? "",
        name: fallbackName,
        role: fallbackRole,
      },
      { onConflict: "id" },
    )

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", sessionUser.id).single()

    if (!profileData) return null

    return {
      id: profileData.id,
      email: profileData.email,
      name: profileData.name,
      role: profileData.role,
      phone: profileData.phone || undefined,
      barberId: profileData.barber_id || undefined,
    }
  }

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
            if (user.barberId) {
              router.push("/booking")
            } else {
              router.push("/find-barber")
            }
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
  }, [supabase, router])

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

  const register = async (name: string, email: string) => {
    if (!supabase) {
      return { success: false, message: "Config Supabase mancante" }
    }
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?name=${encodeURIComponent(name)}`,
          data: {
            name,
            role: "client",
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

      return { success: true, message: "Controlla la tua email per completare la registrazione." }
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
    register,
    logout,
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

