"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-context"
import { createStaffMember, deleteStaffMember, getStaffMembers, resetPassword } from "@/lib/auth"
import type { StaffMember } from "@/lib/types"

export default function StaffPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "staff" as "admin" | "staff",
  })

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role !== "admin") {
        router.push("/dashboard")
      } else {
        loadStaffMembers()
      }
    }
  }, [isAuthenticated, isLoading, router, user])

  const loadStaffMembers = async () => {
    if (!user?.barberId) return

    setIsLoadingStaff(true)
    try {
      const staff = await getStaffMembers(user.barberId)
      setStaffMembers(staff)
    } catch (err) {
      setError("Errore durante il caricamento degli utenti")
    } finally {
      setIsLoadingStaff(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.barberId) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await createStaffMember({
        ...newStaff,
        barberId: user.barberId,
      })

      if (result.success) {
        setSuccess(result.message)
        setNewStaff({
          name: "",
          email: "",
          role: "staff",
        })
        loadStaffMembers()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Si è verificato un errore durante la creazione dell'utente")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo utente?")) {
      try {
        const result = await deleteStaffMember(id)
        if (result.success) {
          setSuccess(result.message)
          loadStaffMembers()
        } else {
          setError(result.message)
        }
      } catch (err) {
        setError("Si è verificato un errore durante l'eliminazione dell'utente")
      }
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      const result = await resetPassword(email)
      if (result.success) {
        setSuccess(result.message)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Si è verificato un errore durante l'invio dell'email di reset")
    }
  }

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestione Staff</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Aggiungi Nuovo Membro dello Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome e Cognome</Label>
                <Input
                  id="name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Ruolo</Label>
                <Select
                  value={newStaff.role}
                  onValueChange={(value) => setNewStaff({ ...newStaff, role: value as "admin" | "staff" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Amministratore</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isSubmitting ? "Creazione in corso..." : "Aggiungi Membro"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membri dello Staff</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStaff ? (
            <p>Caricamento in corso...</p>
          ) : staffMembers.length === 0 ? (
            <p>Nessun membro dello staff trovato</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 font-medium text-sm text-muted-foreground">
                <div>Nome</div>
                <div>Email</div>
                <div>Ruolo</div>
                <div>Azioni</div>
              </div>
              <div className="divide-y">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="grid grid-cols-1 md:grid-cols-4 py-3">
                    <div>{staff.name}</div>
                    <div>{staff.email}</div>
                    <div>{staff.role === "admin" ? "Amministratore" : "Staff"}</div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(staff.email)}
                        title="Invia email di reset password"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(staff.id)}
                        title="Elimina utente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

