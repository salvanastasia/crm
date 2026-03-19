"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-context"
import { getBarbers, associateClientWithBarber } from "@/lib/barber"
import type { Barber } from "@/lib/types"

export default function FindBarberPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([])
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isAssociating, setIsAssociating] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role !== "client") {
        router.push("/")
      } else if (user?.barberId) {
        router.push("/booking")
      } else {
        loadBarbers()
      }
    }
  }, [isAuthenticated, isLoading, router, user])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBarbers(barbers)
    } else {
      const filtered = barbers.filter(
        (barber) =>
          barber.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          barber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (barber.address && barber.address.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredBarbers(filtered)
    }
  }, [searchTerm, barbers])

  const loadBarbers = async () => {
    setIsLoadingBarbers(true)
    try {
      const barbersData = await getBarbers()
      setBarbers(barbersData)
      setFilteredBarbers(barbersData)
    } catch (err) {
      setError("Errore durante il caricamento dei barbieri")
    } finally {
      setIsLoadingBarbers(false)
    }
  }

  const handleAssociate = async (barberId: string) => {
    if (!user?.id) return

    setIsAssociating(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await associateClientWithBarber(user.id, barberId)

      if (result.success) {
        setSuccess(result.message)
        setTimeout(() => {
          router.push("/booking")
        }, 2000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Si è verificato un errore durante l'associazione")
    } finally {
      setIsAssociating(false)
    }
  }

  if (isLoading || !isAuthenticated || user?.role !== "client" || user?.barberId) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trova il tuo Barbiere</h1>
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
          <CardTitle>Cerca un Barbiere</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cerca per nome, attività o indirizzo..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingBarbers ? (
          <p>Caricamento in corso...</p>
        ) : filteredBarbers.length === 0 ? (
          <p>Nessun barbiere trovato</p>
        ) : (
          filteredBarbers.map((barber) => (
            <Card key={barber.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Store className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="text-lg font-medium">{barber.businessName}</h3>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm">
                    <span className="font-medium">Proprietario:</span> {barber.name}
                  </p>
                  {barber.address && (
                    <p className="text-sm">
                      <span className="font-medium">Indirizzo:</span> {barber.address}
                    </p>
                  )}
                  {barber.phone && (
                    <p className="text-sm">
                      <span className="font-medium">Telefono:</span> {barber.phone}
                    </p>
                  )}
                </div>
                <Button className="w-full" onClick={() => handleAssociate(barber.id)} disabled={isAssociating}>
                  {isAssociating ? "Associazione in corso..." : "Seleziona questo Barbiere"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

