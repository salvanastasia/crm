"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type React from "react"

interface Toast {
  id: string
  title: string
  description?: string
  type: "success" | "error" | "warning" | "info"
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => string
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback(({ title, description, type = "info" }: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, description, type }])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (toasts.length > 0) {
        setToasts((prev) => prev.slice(1))
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [toasts])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-md shadow-md ${
              toast.type === "success"
                ? "bg-green-100 text-green-800"
                : toast.type === "error"
                  ? "bg-red-100 text-red-800"
                  : toast.type === "warning"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
            }`}
          >
            <div className="font-semibold">{toast.title}</div>
            {toast.description && <div className="text-sm mt-1">{toast.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast deve essere usato all'interno di un ToastProvider")
  }
  return context
}

