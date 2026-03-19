"use server"

import { MockDataStore } from "./mock-data"
import type {
  Service,
  Resource,
  BrandSettings,
  BusinessHours,
  NotificationSettings,
  Client,
  Appointment,
} from "./types"

// Funzioni per gestire i servizi
export async function getServices(barberId: string): Promise<Service[]> {
  const store = MockDataStore.getInstance()

  try {
    const services = store.getServices(barberId)
    return services
  } catch (error) {
    console.error("Errore durante il recupero dei servizi:", error)
    return []
  }
}

export async function getServiceById(id: string): Promise<Service | null> {
  try {
    const store = MockDataStore.getInstance()
    return store.getServiceById(id)
  } catch (error) {
    console.error("Errore durante il recupero del servizio:", error)
    return null
  }
}

export async function addService(serviceData: Omit<Service, "id" | "isActive">): Promise<Service | null> {
  try {
    const store = MockDataStore.getInstance()
    const newService = store.createService({
      ...serviceData,
      isActive: true
    })
    return newService
  } catch (error) {
    console.error("Errore durante l'aggiunta del servizio:", error)
    return null
  }
}

export async function updateService(serviceData: Service): Promise<Service | null> {
  try {
    const store = MockDataStore.getInstance()
    const updated = store.updateService(serviceData.id, serviceData)
    return updated
  } catch (error) {
    console.error("Errore durante l'aggiornamento del servizio:", error)
    return null
  }
}

export async function deleteService(id: string): Promise<boolean> {
  try {
    const store = MockDataStore.getInstance()
    return store.deleteService(id)
  } catch (error) {
    console.error("Errore durante l'eliminazione del servizio:", error)
    return false
  }
}

// Funzioni per gestire le risorse (barbieri)
export async function getResources(barberId: string): Promise<Resource[]> {
  // const supabase = MockDataStore.getInstance()

  try {
    // Ottieni tutte le risorse
    const { data: resourcesData, error: resourcesError } = await supabase
      .from("resources")
      .select("*")
      .eq("barber_id", barberId)
      .order("name")

    if (resourcesError) {
      console.error("Errore durante il recupero delle risorse:", resourcesError)
      return []
    }

    // Per ogni risorsa, ottieni i servizi associati
    const resourcesWithServices = await Promise.all(
      resourcesData.map(async (resource) => {
        const { data: servicesData, error: servicesError } = await supabase
          .from("resource_services")
          .select("service_id")
          .eq("resource_id", resource.id)

        const serviceIds = servicesError ? [] : servicesData.map((s) => s.service_id)

        return {
          id: resource.id,
          name: resource.name,
          email: resource.email || "",
          phone: resource.phone || "",
          role: resource.role,
          bio: resource.bio || "",
          imageUrl: resource.image_url || "",
          isActive: resource.is_active,
          barberId: resource.barber_id,
          serviceIds,
        }
      }),
    )

    return resourcesWithServices
  } catch (error) {
    console.error("Errore durante il recupero delle risorse:", error)
    return []
  }
}

export async function getResourceById(id: string): Promise<Resource | null> {
  // const supabase = MockDataStore.getInstance()

  try {
    // Ottieni la risorsa
    const { data: resource, error: resourceError } = store.from("resources").select("*").eq("id", id).single()

    if (resourceError || !resource) {
      console.error("Errore durante il recupero della risorsa:", resourceError)
      return null
    }

    // Ottieni i servizi associati
    const { data: servicesData, error: servicesError } = await supabase
      .from("resource_services")
      .select("service_id")
      .eq("resource_id", id)

    const serviceIds = servicesError ? [] : servicesData.map((s) => s.service_id)

    return {
      id: resource.id,
      name: resource.name,
      email: resource.email || "",
      phone: resource.phone || "",
      role: resource.role,
      bio: resource.bio || "",
      imageUrl: resource.image_url || "",
      isActive: resource.is_active,
      barberId: resource.barber_id,
      serviceIds,
    }
  } catch (error) {
    console.error("Errore durante il recupero della risorsa:", error)
    return null
  }
}

export async function addResource(resourceData: Omit<Resource, "id">): Promise<Resource | null> {
  try {
    const store = MockDataStore.getInstance()
    const newResource = store.createResource(resourceData)
    return newResource
  } catch (error) {
    console.error("Errore durante l'aggiunta della risorsa:", error)
    return null
  }
}

export async function updateResource(resourceData: Resource): Promise<Resource | null> {
  try {
    const store = MockDataStore.getInstance()
    const updated = store.updateResource(resourceData.id, resourceData)
    return updated
  } catch (error) {
    console.error("Errore durante l'aggiornamento della risorsa:", error)
    return null
  }
}

export async function deleteResource(id: string): Promise<boolean> {
  try {
    const store = MockDataStore.getInstance()
    return store.deleteResource(id)
  } catch (error) {
    console.error("Errore durante l'eliminazione della risorsa:", error)
    return false
  }
}

// Funzioni per gestire le impostazioni dell'attività
export async function getBrandSettings(barberId: string): Promise<BrandSettings | null> {
  try {
    const store = MockDataStore.getInstance()
    const settings = store.getBrandSettings(barberId)
    return settings
  } catch (error) {
    console.error("Errore durante il recupero delle impostazioni del brand:", error)
    return null
  }
}

export async function updateBrandSettings(settings: BrandSettings): Promise<BrandSettings | null> {
  try {
    const store = MockDataStore.getInstance()
    const updated = store.updateBrandSettings(settings.barberId, settings)
    return updated
  } catch (error) {
    console.error("Errore durante l'aggiornamento delle impostazioni del brand:", error)
    return null
  }
}

// Funzioni per gestire gli orari di apertura
export async function getBusinessHours(barberId: string): Promise<BusinessHours | null> {
  // const supabase = MockDataStore.getInstance()

  try {
    const { data, error } = await supabase
      .from("business_hours")
      .select("*")
      .eq("barber_id", barberId)
      .order("day_of_week")

    if (error) {
      console.error("Errore durante il recupero degli orari di apertura:", error)
      return null
    }

    // Converti i dati dal formato del database al formato dell'applicazione
    const businessHours: BusinessHours = {
      monday: { isOpen: false, open: "09:00", close: "18:00" },
      tuesday: { isOpen: false, open: "09:00", close: "18:00" },
      wednesday: { isOpen: false, open: "09:00", close: "18:00" },
      thursday: { isOpen: false, open: "09:00", close: "18:00" },
      friday: { isOpen: false, open: "09:00", close: "18:00" },
      saturday: { isOpen: false, open: "09:00", close: "13:00" },
      sunday: { isOpen: false, open: "09:00", close: "18:00" },
    }

    // Popola gli orari con i dati dal database
    data.forEach((day) => {
      const dayKey = day.day_of_week as keyof BusinessHours
      businessHours[dayKey] = {
        isOpen: day.is_open,
        open: day.open_time || "09:00",
        close: day.close_time || "18:00",
      }
    })

    return businessHours
  } catch (error) {
    console.error("Errore durante il recupero degli orari di apertura:", error)
    return null
  }
}

export async function updateBusinessHours(hours: BusinessHours, barberId: string): Promise<BusinessHours | null> {
  // const supabase = MockDataStore.getInstance()

  try {
    // Verifica se esistono già degli orari
    const { data: existingData, error: existingError } = await supabase
      .from("business_hours")
      .select("id, day_of_week")
      .eq("barber_id", barberId)

    if (existingError) {
      console.error("Errore durante la verifica degli orari esistenti:", existingError)
      return null
    }

    // Crea un oggetto per mappare i giorni agli ID esistenti
    const existingDays: Record<string, string> = {}
    if (existingData) {
      existingData.forEach((day) => {
        existingDays[day.day_of_week] = day.id
      })
    }

    // Aggiorna o inserisci gli orari per ogni giorno
    for (const [day, dayHours] of Object.entries(hours)) {
      if (existingDays[day]) {
        // Aggiorna l'orario esistente
        const { error } = await supabase
          .from("business_hours")
          .update({
            is_open: dayHours.isOpen,
            open_time: dayHours.open,
            close_time: dayHours.close,
          })
          .eq("id", existingDays[day])

        if (error) {
          console.error(`Errore durante l'aggiornamento degli orari per ${day}:`, error)
        }
      } else {
        // Inserisci un nuovo orario
        const { error } = await supabase.from("business_hours").insert({
          day_of_week: day,
          is_open: dayHours.isOpen,
          open_time: dayHours.open,
          close_time: dayHours.close,
          barber_id: barberId,
        })

        if (error) {
          console.error(`Errore durante l'inserimento degli orari per ${day}:`, error)
        }
      }
    }

    return hours
  } catch (error) {
    console.error("Errore durante l'aggiornamento degli orari di apertura:", error)
    return null
  }
}

// Funzioni per gestire le impostazioni delle notifiche
export async function getNotificationSettings(barberId: string): Promise<NotificationSettings | null> {
  // const supabase = MockDataStore.getInstance()

  try {
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("barber_id", barberId)
      .limit(1)
      .single()

    if (error || !data) {
      console.error("Errore durante il recupero delle impostazioni delle notifiche:", error)
      return null
    }

    return {
      id: data.id,
      emailEnabled: data.email_enabled,
      smsEnabled: data.sms_enabled,
      emailTemplate: data.email_template || "",
      smsTemplate: data.sms_template || "",
      reminderHours: data.reminder_hours,
      barberId: data.barber_id,
    }
  } catch (error) {
    console.error("Errore durante il recupero delle impostazioni delle notifiche:", error)
    return null
  }
}

export async function updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings | null> {
  // const supabase = MockDataStore.getInstance()

  try {
    // Verifica se esistono già delle impostazioni
    const { data: existingData, error: existingError } = await supabase
      .from("notification_settings")
      .select("id")
      .eq("barber_id", settings.barberId)
      .limit(1)

    if (existingError) {
      console.error("Errore durante la verifica delle impostazioni esistenti:", existingError)
      return null
    }

    let data
    let error

    if (existingData && existingData.length > 0) {
      // Aggiorna le impostazioni esistenti
      const result = await supabase
        .from("notification_settings")
        .update({
          email_enabled: settings.emailEnabled,
          sms_enabled: settings.smsEnabled,
          email_template: settings.emailTemplate,
          sms_template: settings.smsTemplate,
          reminder_hours: settings.reminderHours,
        })
        .eq("id", existingData[0].id)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      // Inserisci nuove impostazioni
      const result = await supabase
        .from("notification_settings")
        .insert({
          email_enabled: settings.emailEnabled,
          sms_enabled: settings.smsEnabled,
          email_template: settings.emailTemplate,
          sms_template: settings.smsTemplate,
          reminder_hours: settings.reminderHours,
          barber_id: settings.barberId,
        })
        .select()
        .single()

      data = result.data
      error = result.error
    }

    if (error || !data) {
      console.error("Errore durante l'aggiornamento delle impostazioni delle notifiche:", error)
      return null
    }

    return {
      id: data.id,
      emailEnabled: data.email_enabled,
      smsEnabled: data.sms_enabled,
      emailTemplate: data.email_template || "",
      smsTemplate: data.sms_template || "",
      reminderHours: data.reminder_hours,
      barberId: data.barber_id,
    }
  } catch (error) {
    console.error("Errore durante l'aggiornamento delle impostazioni delle notifiche:", error)
    return null
  }
}

// Funzione per prenotare un appuntamento
export async function bookAppointment(data: {
  clientId: string
  serviceId: string
  resourceId: string
  barberId: string
  date: Date | string
  time: string
  paymentMethod: "card" | "paypal" | "cash" | null
}): Promise<{ success: boolean; message: string; appointmentId?: string }> {
  try {
    const store = MockDataStore.getInstance()
    
    // Get client and service names
    const client = store.getClientById(data.clientId)
    const service = store.getServiceById(data.serviceId)
    const resource = store.getResourceById(data.resourceId)
    
    if (!client || !service || !resource) {
      return {
        success: false,
        message: "Dati non validi per la prenotazione",
      }
    }
    
    // Format date
    const formattedDate = typeof data.date === "string" ? data.date : data.date.toISOString().split("T")[0]
    
    // Create appointment
    const appointment = store.createAppointment({
      clientId: data.clientId,
      clientName: client.name,
      serviceId: data.serviceId,
      serviceName: service.name,
      resourceId: data.resourceId,
      resourceName: resource.name,
      barberId: data.barberId,
      date: formattedDate,
      time: data.time,
      status: "pending",
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === "cash" ? "pending" : "paid"
    })

    return {
      success: true,
      message: "Appuntamento prenotato con successo",
      appointmentId: appointment.id,
    }
  } catch (error) {
    console.error("Errore durante la prenotazione dell'appuntamento:", error)
    return {
      success: false,
      message: "Si è verificato un errore durante la prenotazione dell'appuntamento",
    }
  }
}

// Funzioni per gestire i clienti
export async function getClients(barberId?: string): Promise<Client[]> {
  try {
    const store = MockDataStore.getInstance()
    const clients = store.getClients(barberId)
    
    // Calculate appointment counts for each client
    const clientsWithCounts = clients.map(client => {
      const appointments = store.getAppointments(barberId, client.id)
      return {
        ...client,
        appointmentsCount: appointments.length
      }
    })
    
    return clientsWithCounts
  } catch (error) {
    console.error("Errore durante il recupero dei clienti:", error)
    return []
  }
}

export async function addClient(clientData: Omit<Client, "id" | "appointmentsCount">): Promise<Client | null> {
  try {
    const store = MockDataStore.getInstance()
    const currentUser = store.getCurrentUser()
    const barberId = clientData.barberId || currentUser?.barberId || "barber-1"
    
    const newClient = store.createClient({
      ...clientData,
      barberId
    })
    
    return newClient
  } catch (error) {
    console.error("Errore durante l'aggiunta del cliente:", error)
    return null
  }
}

export async function updateClient(clientData: Client): Promise<Client | null> {
  try {
    const store = MockDataStore.getInstance()
    const updated = store.updateClient(clientData.id, {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      notes: clientData.notes,
      barberId: clientData.barberId
    })
    return updated
  } catch (error) {
    console.error("Errore durante l'aggiornamento del cliente:", error)
    return null
  }
}

export async function deleteClient(id: string): Promise<boolean> {
  try {
    const store = MockDataStore.getInstance()
    return store.deleteClient(id)
  } catch (error) {
    console.error("Errore durante l'eliminazione del cliente:", error)
    return false
  }
}

export async function getAppointments(barberId: string): Promise<Appointment[]> {
  try {
    const store = MockDataStore.getInstance()
    const appointments = store.getAppointments(barberId)
    
    // Enrich appointments with names
    return appointments.map(appt => {
      const client = store.getClientById(appt.clientId)
      const service = store.getServiceById(appt.serviceId)
      const resource = store.getResourceById(appt.resourceId)
      
      return {
        ...appt,
        clientName: client?.name || "Cliente sconosciuto",
        serviceName: service?.name || "Servizio sconosciuto",
        resourceName: resource?.name || "Risorsa sconosciuta"
      }
    })
  } catch (error) {
    console.error("Errore durante il recupero degli appuntamenti:", error)
    return []
  }
}

export async function getClientAppointments(clientId: string): Promise<Appointment[]> {
  try {
    const store = MockDataStore.getInstance()
    const appointments = store.getAppointments(undefined, clientId)
    
    // Enrich appointments with names
    return appointments.map(appt => {
      const client = store.getClientById(appt.clientId)
      const service = store.getServiceById(appt.serviceId)
      const resource = store.getResourceById(appt.resourceId)
      
      return {
        ...appt,
        clientName: client?.name || "Cliente sconosciuto",
        serviceName: service?.name || "Servizio sconosciuto",
        resourceName: resource?.name || "Risorsa sconosciuta"
      }
    })
  } catch (error) {
    console.error("Errore durante il recupero degli appuntamenti del cliente:", error)
    return []
  }
}

