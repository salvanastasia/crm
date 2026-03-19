"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { AuthState, User } from "@/lib/types"
import { getInstantClient } from "@/lib/instant/client"
import { signIn, signUp, signOut } from "@/lib/auth"

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; message: string }>
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
  const instant = getInstantClient()

  useEffect(() => {
    // Controlla se l'utente è già autenticato
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await instant.auth.getSession()

        if (session) {
          // Ottieni il profilo utente
          const { data: profileData } = await instant.from("profiles").select("*").eq("id", session.user.id).single()

          if (profileData) {
            setAuthState({
              user: {
                id: profileData.id,
                email: profileData.email,
                name: profileData.name,
                role: profileData.role,
                phone: profileData.phone || undefined,
                barberId: profileData.barber_id || undefined,
              },
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

    // Imposta un listener per i cambiamenti di autenticazione
    const {
      data: { subscription },
    } = instant.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Ottieni il profilo utente
        const { data: profileData } = await instant.from("profiles").select("*").eq("id", session.user.id).single()

        if (profileData) {
          const user: User = {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            role: profileData.role,
            phone: profileData.phone || undefined,
            barberId: profileData.barber_id || undefined,
          }

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          // Reindirizza in base al ruolo
          if (profileData.role === "client") {
            if (profileData.barber_id) {
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
  }, [instant, router])

  const login = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await signIn({ email, password })

      if (!result.success) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: result.message,
        })
        return result
      }

      // Update auth state on successful login
      if (result.user) {
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      }

      return result
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
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await signUp({ name, email, password, role: "client" })

      if (!result.success) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.message,
        }))
      }

      return result
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
      await signOut()

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

  const resetPassword = async (email: string) => {
    try {
      const { error } = await instant.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return { success: true, message: "Email di reset password inviata con successo" }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Errore durante il reset della password"
      return { success: false, message: errorMessage }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await instant.auth.updateUser({
        password,
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return { success: true, message: "Password aggiornata con successo" }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Errore durante l'aggiornamento della password"
      return { success: false, message: errorMessage }
    }
  }

  const value = {
    ...authState,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
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

