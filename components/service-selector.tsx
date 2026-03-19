"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Service } from "@/lib/types"

interface ServiceSelectorProps {
  services: Service[]
  selectedService: Service | null
  onSelectService: (service: Service) => void
  onNext: () => void
}

export function ServiceSelector({ services, selectedService, onSelectService, onNext }: ServiceSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Seleziona un servizio</h2>
        <p className="text-sm text-muted-foreground mt-1">Scegli il servizio che desideri prenotare</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <Card
            key={service.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              selectedService?.id === service.id ? "border-2 border-primary" : "",
            )}
            onClick={() => onSelectService(service)}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-medium">{service.name}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">{service.duration} min</span>
                  <span className="font-semibold">€{service.price.toFixed(2)}</span>
                </div>
              </div>
              {selectedService?.id === service.id && (
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end mt-8">
        <Button onClick={onNext} disabled={!selectedService}>
          Continua
        </Button>
      </div>
    </div>
  )
}

