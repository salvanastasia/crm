"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-context"
import { getBrandSettings, getServices } from "@/lib/actions"
import { bookAppointment } from "@/lib/actions"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { linkClientToDefaultSalonIfNeeded } from "@/lib/link-default-salon"
import { ServiceSelector } from "@/components/service-selector"
import { ResourceSelector } from "@/components/resource-selector"
import { DateTimeSelector } from "@/components/date-time-selector"
import { PaymentSelector } from "@/components/payment-selector"
import { BookingSummary } from "@/components/booking-summary"
import { Steps, Step } from "@/components/ui/steps"
import { Skeleton } from "@/components/ui/skeleton"
import type { Service, Resource, BrandSettings } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

export default function BookingPage() {
  const { isAuthenticated, user, refreshProfile } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null)
  const [isLogoBroken, setIsLogoBroken] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBookingConfirming, setIsBookingConfirming] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

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
    // If the logo url changes (new upload), re-attempt rendering.
    setIsLogoBroken(false)
  }, [brandSettings?.logoUrl])

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
    if (!user?.barberId) return
    if (!selectedService || !selectedResource || !selectedDate || !selectedTime || !paymentMethod) return

    setIsBookingConfirming(true)
    setBookingError(null)

    try {
      const res = await bookAppointment({
        barberId: user.barberId,
        clientName: user.name,
        clientEmail: user.email,
        clientPhone: user.phone ?? "",
        serviceId: selectedService.id,
        resourceId: selectedResource.id,
        date: selectedDate,
        time: selectedTime,
        paymentMethod: paymentMethod as "card" | "paypal" | "cash" | null,
      })

      if (!res.success) {
        setBookingError(res.message)
        return
      }

      toast({
        title: "Prenotazione completata",
        description: "La tua prenotazione e' stata inviata con successo.",
      })

      router.push("/le-tue-prenotazioni?booked=1")
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Errore durante la prenotazione")
    } finally {
      setIsBookingConfirming(false)
    }
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
              Non risulta nessuna attività collegata. Aggiungi un dipendente in Supabase o imposta{" "}
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
        <div className="space-y-8">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>

          <Card className="w-full max-w-2xl mx-auto shadow-sm">
            <CardHeader>
              <div className="space-y-4">
                <Skeleton className="h-5 w-60 rounded-md" />
                <div className="flex items-center gap-4">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-3 w-16 mt-2 rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full rounded-md" />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="rounded-lg border border-border/50 p-4 space-y-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-2/3 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-2 md:py-4">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          {brandSettings?.logoUrl && !isLogoBroken ? (
            <img
              src={brandSettings.logoUrl || "/placeholder.svg"}
              alt={brandSettings.businessName}
              className="h-16 w-16 object-contain"
              onError={() => setIsLogoBroken(true)}
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
            <Step title="Collaboratore" />
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
              resourceId={selectedResource?.id || ""}
              serviceDuration={selectedService?.duration ?? 30}
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
              isConfirming={isBookingConfirming}
            />
          )}

          {bookingError && currentStep === 4 && (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {bookingError}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

