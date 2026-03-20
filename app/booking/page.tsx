"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-context"
import { getBrandSettings, getServices } from "@/lib/actions"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { linkClientToDefaultSalonIfNeeded } from "@/lib/link-default-salon"
import { ServiceSelector } from "@/components/service-selector"
import { ResourceSelector } from "@/components/resource-selector"
import { DateTimeSelector } from "@/components/date-time-selector"
import { PaymentSelector } from "@/components/payment-selector"
import { BookingSummary } from "@/components/booking-summary"
import { Steps, Step } from "@/components/ui/steps"
import type { Service, Resource, BrandSettings } from "@/lib/types"

export default function BookingPage() {
  const { isAuthenticated, user, refreshProfile } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "client") return

    const loadBookingData = async (barberId: string) => {
      setIsLoading(true)
      try {
        const settings = await getBrandSettings(barberId)
        const servicesData = await getServices(barberId)
        setBrandSettings(settings)
        setServices(servicesData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user.barberId) {
      void loadBookingData(user.barberId)
      return
    }

    let cancelled = false
    setIsLoading(true)
    ;(async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setIsLoading(false)
        return
      }
      const linked = await linkClientToDefaultSalonIfNeeded(supabase, user.id, "client", undefined)
      if (cancelled) return
      if (linked) {
        await refreshProfile()
        if (!cancelled) await loadBookingData(linked)
      } else {
        setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.id, user?.role, user?.barberId, refreshProfile])

  useEffect(() => {
    // Reimposta la risorsa selezionata quando cambia il servizio
    setSelectedResource(null)
  }, [selectedService])

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1)
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleConfirmBooking = async () => {
    // Qui implementeremo la logica per confermare la prenotazione
    // Per ora, mostriamo solo un messaggio di successo
    alert("Prenotazione confermata con successo!")
    router.push("/")
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Accedi per prenotare</CardTitle>
            <CardDescription>Per prenotare un appuntamento, devi prima accedere o creare un account.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={() => router.push("/login")}>Accedi</Button>
            <Button variant="outline" onClick={() => router.push("/signup")}>
              Registrati
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user?.role !== "client") {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Benvenuto nel sistema di prenotazione</CardTitle>
            <CardDescription>Da qui puoi prenotare i tuoi appuntamenti presso il nostro salone.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!user.barberId && !isLoading) {
    return (
      <div className="w-full py-10">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Salon non configurato</CardTitle>
            <CardDescription>
              Non risulta nessuna attività collegata. Aggiungi un barbiere in Supabase o imposta{" "}
              <code className="text-xs">NEXT_PUBLIC_DEFAULT_BARBER_ID</code> nel file env.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="p-10 flex justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Caricamento in corso...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full py-2 md:py-4">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          {brandSettings?.logoUrl ? (
            <img
              src={brandSettings.logoUrl || "/placeholder.svg"}
              alt={brandSettings.businessName}
              className="h-16 w-16 object-contain"
            />
          ) : (
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{brandSettings?.businessName?.charAt(0) || "B"}</span>
            </div>
          )}
        </div>
        <h1 className="text-3xl font-bold">{brandSettings?.businessName || "Barber Shop"}</h1>
        <p className="text-muted-foreground mt-2">Prenota il tuo appuntamento</p>
      </div>

      <Card className="w-full max-w-2xl mx-auto shadow-sm">
        <CardHeader>
          <Steps currentStep={currentStep} className="mb-4">
            <Step title="Servizio" />
            <Step title="Barbiere" />
            <Step title="Data e Ora" />
            <Step title="Pagamento" />
            <Step title="Conferma" />
          </Steps>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <ServiceSelector
              services={services}
              selectedService={selectedService}
              onSelectService={setSelectedService}
              onNext={() => selectedService && handleNextStep()}
            />
          )}

          {currentStep === 1 && user.barberId && (
            <ResourceSelector
              barberId={user.barberId}
              serviceId={selectedService?.id || ""}
              selectedResource={selectedResource}
              onSelectResource={setSelectedResource}
              onNext={() => selectedResource && handleNextStep()}
              onBack={handlePrevStep}
            />
          )}

          {currentStep === 2 && user.barberId && (
            <DateTimeSelector
              barberId={user.barberId}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSelectDate={setSelectedDate}
              onSelectTime={setSelectedTime}
              onNext={() => selectedDate && selectedTime && handleNextStep()}
              onBack={handlePrevStep}
            />
          )}

          {currentStep === 3 && (
            <PaymentSelector
              selectedPaymentMethod={paymentMethod}
              onSelectPaymentMethod={setPaymentMethod}
              onNext={() => paymentMethod && handleNextStep()}
              onBack={handlePrevStep}
            />
          )}

          {currentStep === 4 && (
            <BookingSummary
              service={selectedService}
              resource={selectedResource}
              date={selectedDate}
              time={selectedTime}
              paymentMethod={paymentMethod}
              onConfirm={handleConfirmBooking}
              onBack={handlePrevStep}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

