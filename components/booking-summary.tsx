"use client"

import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Banknote, CreditCardIcon, CalendarIcon, Clock, User } from "lucide-react"
import type { Service, Resource } from "@/lib/types"

interface BookingSummaryProps {
  service: Service | null
  resource: Resource | null
  date: Date | null
  time: string | null
  paymentMethod: string | null
  onConfirm: () => void
  onBack: () => void
  isConfirming?: boolean
}

export function BookingSummary({
  service,
  resource,
  date,
  time,
  paymentMethod,
  onConfirm,
  onBack,
  isConfirming = false,
}: BookingSummaryProps) {
  if (!service || !resource || !date || !time || !paymentMethod) {
    return (
      <div className="text-center p-8">
        <p>Informazioni mancanti. Torna indietro e completa tutti i passaggi.</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Indietro
        </Button>
      </div>
    )
  }

  const getPaymentIcon = () => {
    switch (paymentMethod) {
      case "card":
        return <CreditCard className="h-5 w-5" />
      case "paypal":
        return <CreditCardIcon className="h-5 w-5" />
      case "cash":
        return <Banknote className="h-5 w-5" />
      default:
        return null
    }
  }

  const getPaymentMethodName = () => {
    switch (paymentMethod) {
      case "card":
        return "Carta di Credito/Debito"
      case "paypal":
        return "PayPal"
      case "cash":
        return "Contanti (al barbiere)"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Riepilogo prenotazione</h2>
        <p className="text-sm text-muted-foreground mt-1">Controlla i dettagli e conferma la tua prenotazione</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-4">Dettagli appuntamento</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{format(date, "EEEE d MMMM yyyy", { locale: it })}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Orario</p>
                  <p className="font-medium">{time}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Barbiere</p>
                  <p className="font-medium">{resource.name}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">Servizio selezionato</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground">{service.duration} minuti</p>
              </div>
              <p className="font-semibold">€{service.price.toFixed(2)}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">Metodo di pagamento</h3>
            <div className="flex items-center gap-3">
              {getPaymentIcon()}
              <p>{getPaymentMethodName()}</p>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center pt-2">
            <p className="font-semibold">Totale</p>
            <p className="text-xl font-bold">€{service.price.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline">
          Indietro
        </Button>
        <Button onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? "Prenotazione in corso..." : "Conferma prenotazione"}
        </Button>
      </div>
    </div>
  )
}

