"use client"

import { useState, useEffect, useCallback } from "react"

interface Toast {
  id: string
  title: string
  description?: string
  type: "success" | "error" | "warning" | "info"
}

export function useToast() {
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

  return { toasts, addToast, removeToast }
}

