"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { getResources } from "@/lib/actions"
import type { Resource } from "@/lib/types"

interface ResourceSelectorProps {
  barberId: string
  serviceId: string
  selectedResource: Resource | null
  onSelectResource: (resource: Resource) => void
  onNext: () => void
  onBack: () => void
}

export function ResourceSelector({
  barberId,
  serviceId,
  selectedResource,
  onSelectResource,
  onNext,
  onBack,
}: ResourceSelectorProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const getRoleLabel = (role: string) => role.replace(/barbiere/gi, "Collaboratore")

  useEffect(() => {
    const loadResources = async () => {
      setIsLoading(true)
      try {
        const allResources = await getResources(barberId)
        const filteredResources = allResources.filter(
          (resource) => resource.isActive && resource.serviceIds?.includes(serviceId),
        )
        setResources(filteredResources)
      } catch (error) {
        console.error("Error loading resources:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (serviceId && barberId) {
      void loadResources()
    }
  }, [serviceId, barberId])

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento dipendenti...</p>
      </div>
    )
  }

  if (resources.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="mb-4">Nessun collaboratore disponibile per questo servizio.</p>
        <Button onClick={onBack} variant="outline">
          Torna indietro
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Seleziona un collaboratore</h2>
        <p className="text-sm text-muted-foreground mt-1">Scegli il professionista che preferisci</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((resource) => (
          <Card
            key={resource.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              selectedResource?.id === resource.id ? "border-2 border-primary" : "",
            )}
            onClick={() => onSelectResource(resource)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={resource.imageUrl || ""} alt={resource.name} />
                <AvatarFallback>
                  {resource.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium">{resource.name}</h3>
                <p className="text-sm text-muted-foreground">{getRoleLabel(resource.role)}</p>
              </div>
              {selectedResource?.id === resource.id && (
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline">
          Indietro
        </Button>
        <Button onClick={onNext} disabled={!selectedResource}>
          Continua
        </Button>
      </div>
    </div>
  )
}

