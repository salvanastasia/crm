"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type {
  Service,
  Resource,
  BrandSettings,
  BusinessHours,
  NotificationSettings,
  Client,
  Appointment,
} from "./types"

async function db() {
  return createSupabaseServerClient()
}

function mapService(r: {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  compare_price: number | null
  is_active: boolean
  barber_id: string
}): Service {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    duration: r.duration,
    price: Number(r.price),
    comparePrice: r.compare_price != null ? Number(r.compare_price) : undefined,
    isActive: r.is_active,
    barberId: r.barber_id,
  }
}

// --- Servizi ---

export async function getServices(barberId: string): Promise<Service[]> {
  const supabase = await db()
  if (!supabase || !barberId) return []
  const { data, error } = await supabase.from("services").select("*").eq("barber_id", barberId).order("name")
  if (error) {
    console.error("getServices:", error)
    return []
  }
  return (data ?? []).map(mapService)
}

export async function getServiceById(id: string): Promise<Service | null> {
  const supabase = await db()
  if (!supabase) return null
  const { data, error } = await supabase.from("services").select("*").eq("id", id).maybeSingle()
  if (error || !data) return null
  return mapService(data)
}

export async function addService(serviceData: Omit<Service, "id" | "isActive">): Promise<Service | null> {
  const supabase = await db()
  if (!supabase || !serviceData.barberId) return null
  const { data, error } = await supabase
    .from("services")
    .insert({
      name: serviceData.name,
      description: serviceData.description ?? null,
      duration: serviceData.duration,
      price: serviceData.price,
      compare_price: serviceData.comparePrice ?? null,
      is_active: true,
      barber_id: serviceData.barberId,
    })
    .select("*")
    .single()
  if (error || !data) {
    console.error("addService:", error)
    return null
  }
  return mapService(data)
}

export async function updateService(serviceData: Service): Promise<Service | null> {
  const supabase = await db()
  if (!supabase) return null
  const { data, error } = await supabase
    .from("services")
    .update({
      name: serviceData.name,
      description: serviceData.description ?? null,
      duration: serviceData.duration,
      price: serviceData.price,
      compare_price: serviceData.comparePrice ?? null,
      is_active: serviceData.isActive,
    })
    .eq("id", serviceData.id)
    .select("*")
    .single()
  if (error || !data) {
    console.error("updateService:", error)
    return null
  }
  return mapService(data)
}

export async function deleteService(id: string): Promise<boolean> {
  const supabase = await db()
  if (!supabase) return false
  const { error } = await supabase.from("services").delete().eq("id", id)
  if (error) {
    console.error("deleteService:", error)
    return false
  }
  return true
}

// --- Risorse (staff) ---

async function mapResourceRow(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  resource: {
    id: string
    name: string
    email: string | null
    phone: string | null
    role: string
    bio: string | null
    image_url: string | null
    is_active: boolean
    barber_id: string
  },
): Promise<Resource> {
  const { data: links } = await supabase.from("resource_services").select("service_id").eq("resource_id", resource.id)
  return {
    id: resource.id,
    name: resource.name,
    email: resource.email ?? "",
    phone: resource.phone ?? "",
    role: resource.role,
    bio: resource.bio ?? undefined,
    imageUrl: resource.image_url ?? undefined,
    isActive: resource.is_active,
    barberId: resource.barber_id,
    serviceIds: (links ?? []).map((l) => l.service_id),
  }
}

export async function getResources(barberId: string): Promise<Resource[]> {
  const supabase = await db()
  if (!supabase || !barberId) return []
  const { data: rows, error } = await supabase.from("resources").select("*").eq("barber_id", barberId).order("name")
  if (error) {
    console.error("getResources:", error)
    return []
  }
  return Promise.all((rows ?? []).map((r) => mapResourceRow(supabase, r)))
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const supabase = await db()
  if (!supabase) return null
  const { data: resource, error } = await supabase.from("resources").select("*").eq("id", id).maybeSingle()
  if (error || !resource) return null
  return mapResourceRow(supabase, resource)
}

export async function addResource(resourceData: Omit<Resource, "id">): Promise<Resource | null> {
  const supabase = await db()
  if (!supabase) return null
  const { data: r, error } = await supabase
    .from("resources")
    .insert({
      name: resourceData.name,
      email: resourceData.email || null,
      phone: resourceData.phone || null,
      role: resourceData.role,
      bio: resourceData.bio || null,
      image_url: resourceData.imageUrl || null,
      is_active: resourceData.isActive,
      barber_id: resourceData.barberId,
    })
    .select("*")
    .single()
  if (error || !r) {
    console.error("addResource:", error)
    return null
  }
  const sids = resourceData.serviceIds ?? []
  if (sids.length > 0) {
    const { error: jErr } = await supabase.from("resource_services").insert(
      sids.map((service_id) => ({ resource_id: r.id, service_id })),
    )
    if (jErr) console.error("addResource junction:", jErr)
  }
  return mapResourceRow(supabase, r)
}

export async function updateResource(resourceData: Resource): Promise<Resource | null> {
  const supabase = await db()
  if (!supabase) return null
  const { data: r, error } = await supabase
    .from("resources")
    .update({
      name: resourceData.name,
      email: resourceData.email || null,
      phone: resourceData.phone || null,
      role: resourceData.role,
      bio: resourceData.bio || null,
      image_url: resourceData.imageUrl || null,
      is_active: resourceData.isActive,
    })
    .eq("id", resourceData.id)
    .select("*")
    .single()
  if (error || !r) {
    console.error("updateResource:", error)
    return null
  }
  await supabase.from("resource_services").delete().eq("resource_id", resourceData.id)
  const sids = resourceData.serviceIds ?? []
  if (sids.length > 0) {
    await supabase.from("resource_services").insert(
      sids.map((service_id) => ({ resource_id: resourceData.id, service_id })),
    )
  }
  return mapResourceRow(supabase, r)
}

export async function deleteResource(id: string): Promise<boolean> {
  const supabase = await db()
  if (!supabase) return false
  await supabase.from("resource_services").delete().eq("resource_id", id)
  const { error } = await supabase.from("resources").delete().eq("id", id)
  if (error) {
    console.error("deleteResource:", error)
    return false
  }
  return true
}

// --- Brand (business_settings) ---

export async function getBrandSettings(barberId: string): Promise<BrandSettings | null> {
  const supabase = await db()
  if (!supabase || !barberId) return null
  const { data, error } = await supabase.from("business_settings").select("*").eq("barber_id", barberId).limit(1).maybeSingle()
  if (error) {
    console.error("getBrandSettings:", error)
    return null
  }
  if (!data) {
    return {
      businessName: "",
      brandColor: "#4f46e5",
      logoUrl: "",
      barberId,
    }
  }
  return {
    id: data.id,
    businessName: data.business_name,
    brandColor: data.brand_color ?? "#4f46e5",
    logoUrl: data.logo_url ?? "",
    barberId: data.barber_id,
  }
}

export async function updateBrandSettings(settings: BrandSettings): Promise<BrandSettings | null> {
  const supabase = await db()
  if (!supabase || !settings.barberId) return null
  const { data: existing } = await supabase
    .from("business_settings")
    .select("id")
    .eq("barber_id", settings.barberId)
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    const { data, error } = await supabase
      .from("business_settings")
      .update({
        business_name: settings.businessName,
        brand_color: settings.brandColor,
        logo_url: settings.logoUrl || null,
      })
      .eq("id", existing.id)
      .select("*")
      .single()
    if (error || !data) {
      console.error("updateBrandSettings:", error)
      return null
    }
    return {
      id: data.id,
      businessName: data.business_name,
      brandColor: data.brand_color ?? "#4f46e5",
      logoUrl: data.logo_url ?? "",
      barberId: data.barber_id,
    }
  }

  const { data, error } = await supabase
    .from("business_settings")
    .insert({
      business_name: settings.businessName,
      brand_color: settings.brandColor,
      logo_url: settings.logoUrl || null,
      barber_id: settings.barberId,
    })
    .select("*")
    .single()
  if (error || !data) {
    console.error("updateBrandSettings insert:", error)
    return null
  }
  return {
    id: data.id,
    businessName: data.business_name,
    brandColor: data.brand_color ?? "#4f46e5",
    logoUrl: data.logo_url ?? "",
    barberId: data.barber_id,
  }
}

// --- Orari ---

export async function getBusinessHours(barberId: string): Promise<BusinessHours | null> {
  const supabase = await db()
  if (!supabase || !barberId) return null
  const { data, error } = await supabase.from("business_hours").select("*").eq("barber_id", barberId).order("day_of_week")
  if (error) {
    console.error("getBusinessHours:", error)
    return null
  }

  const businessHours: BusinessHours = {
    monday: { isOpen: false, open: "09:00", close: "18:00" },
    tuesday: { isOpen: false, open: "09:00", close: "18:00" },
    wednesday: { isOpen: false, open: "09:00", close: "18:00" },
    thursday: { isOpen: false, open: "09:00", close: "18:00" },
    friday: { isOpen: false, open: "09:00", close: "18:00" },
    saturday: { isOpen: false, open: "09:00", close: "13:00" },
    sunday: { isOpen: false, open: "09:00", close: "18:00" },
  }

  for (const day of data ?? []) {
    const key = day.day_of_week as keyof BusinessHours
    if (key in businessHours) {
      businessHours[key] = {
        isOpen: day.is_open,
        open: day.open_time || "09:00",
        close: day.close_time || "18:00",
      }
    }
  }
  return businessHours
}

export async function updateBusinessHours(hours: BusinessHours, barberId: string): Promise<BusinessHours | null> {
  const supabase = await db()
  if (!supabase || !barberId) return null
  const { data: existingData, error: existingError } = await supabase
    .from("business_hours")
    .select("id, day_of_week")
    .eq("barber_id", barberId)
  if (existingError) {
    console.error("updateBusinessHours:", existingError)
    return null
  }
  const existingDays: Record<string, string> = {}
  for (const day of existingData ?? []) {
    existingDays[day.day_of_week] = day.id
  }

  for (const [day, dayHours] of Object.entries(hours)) {
    if (!dayHours || typeof dayHours !== "object") continue
    const row = dayHours as { isOpen: boolean; open: string; close: string }
    if (existingDays[day]) {
      await supabase
        .from("business_hours")
        .update({
          is_open: row.isOpen,
          open_time: row.open,
          close_time: row.close,
        })
        .eq("id", existingDays[day])
    } else {
      await supabase.from("business_hours").insert({
        day_of_week: day as
          | "monday"
          | "tuesday"
          | "wednesday"
          | "thursday"
          | "friday"
          | "saturday"
          | "sunday",
        is_open: row.isOpen,
        open_time: row.open,
        close_time: row.close,
        barber_id: barberId,
      })
    }
  }
  return hours
}

// --- Notifiche ---

export async function getNotificationSettings(barberId: string): Promise<NotificationSettings | null> {
  const supabase = await db()
  if (!supabase || !barberId) return null
  const { data, error } = await supabase.from("notification_settings").select("*").eq("barber_id", barberId).limit(1).maybeSingle()
  if (error) {
    console.error("getNotificationSettings:", error)
    return null
  }
  if (!data) return null
  return {
    id: data.id,
    emailEnabled: data.email_enabled,
    smsEnabled: data.sms_enabled,
    emailTemplate: data.email_template || "",
    smsTemplate: data.sms_template || "",
    reminderHours: data.reminder_hours,
    barberId: data.barber_id,
  }
}

export async function updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings | null> {
  const supabase = await db()
  if (!supabase || !settings.barberId) return null
  const { data: existingData, error: existingError } = await supabase
    .from("notification_settings")
    .select("id")
    .eq("barber_id", settings.barberId)
    .limit(1)
  if (existingError) {
    console.error("updateNotificationSettings:", existingError)
    return null
  }

  if (existingData && existingData.length > 0) {
    const { data, error } = await supabase
      .from("notification_settings")
      .update({
        email_enabled: settings.emailEnabled,
        sms_enabled: settings.smsEnabled,
        email_template: settings.emailTemplate,
        sms_template: settings.smsTemplate,
        reminder_hours: settings.reminderHours,
      })
      .eq("id", existingData[0].id)
      .select("*")
      .single()
    if (error || !data) return null
    return {
      id: data.id,
      emailEnabled: data.email_enabled,
      smsEnabled: data.sms_enabled,
      emailTemplate: data.email_template || "",
      smsTemplate: data.sms_template || "",
      reminderHours: data.reminder_hours,
      barberId: data.barber_id,
    }
  }

  const { data, error } = await supabase
    .from("notification_settings")
    .insert({
      email_enabled: settings.emailEnabled,
      sms_enabled: settings.smsEnabled,
      email_template: settings.emailTemplate,
      sms_template: settings.smsTemplate,
      reminder_hours: settings.reminderHours,
      barber_id: settings.barberId,
    })
    .select("*")
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    emailEnabled: data.email_enabled,
    smsEnabled: data.sms_enabled,
    emailTemplate: data.email_template || "",
    smsTemplate: data.sms_template || "",
    reminderHours: data.reminder_hours,
    barberId: data.barber_id,
  }
}

// --- Prenotazioni (calendario) ---

export async function bookAppointment(data: {
  barberId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  serviceId: string
  resourceId: string
  date: Date | string
  time: string
  paymentMethod?: "card" | "paypal" | "cash" | null
}): Promise<{ success: boolean; message: string; appointmentId?: string }> {
  const supabase = await db()
  if (!supabase) return { success: false, message: "Database non configurato" }

  const dateStr = typeof data.date === "string" ? data.date : data.date.toISOString().split("T")[0]

  const { data: existing, error: findErr } = await supabase
    .from("clients")
    .select("id")
    .eq("barber_id", data.barberId)
    .eq("email", data.clientEmail.trim().toLowerCase())
    .maybeSingle()
  if (findErr) {
    console.error("bookAppointment find client:", findErr)
    return { success: false, message: findErr.message }
  }

  let clientId = existing?.id
  if (!clientId) {
    const { data: ins, error: insErr } = await supabase
      .from("clients")
      .insert({
        barber_id: data.barberId,
        name: data.clientName,
        email: data.clientEmail.trim().toLowerCase(),
        phone: data.clientPhone,
      })
      .select("id")
      .single()
    if (insErr || !ins) {
      return { success: false, message: insErr?.message ?? "Impossibile creare il cliente" }
    }
    clientId = ins.id
  } else {
    await supabase
      .from("clients")
      .update({ name: data.clientName, phone: data.clientPhone })
      .eq("id", clientId)
  }

  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .insert({
      client_id: clientId,
      resource_id: data.resourceId,
      service_id: data.serviceId,
      barber_id: data.barberId,
      date: dateStr,
      time: data.time,
      status: "confirmed",
      payment_method: data.paymentMethod ?? "cash",
      payment_status: "pending",
    })
    .select("id")
    .single()

  if (apptErr || !appt) {
    return { success: false, message: apptErr?.message ?? "Errore creazione appuntamento" }
  }
  return { success: true, message: "Appuntamento prenotato", appointmentId: appt.id }
}

// --- Clienti CRM ---

export async function getClients(barberId: string): Promise<Client[]> {
  const supabase = await db()
  if (!supabase || !barberId) return []
  const { data: clients, error } = await supabase.from("clients").select("*").eq("barber_id", barberId).order("name")
  if (error || !clients) {
    console.error("getClients:", error)
    return []
  }
  const { data: appts } = await supabase.from("appointments").select("client_id").eq("barber_id", barberId)
  const counts = new Map<string, number>()
  for (const a of appts ?? []) {
    counts.set(a.client_id, (counts.get(a.client_id) ?? 0) + 1)
  }
  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? "",
    notes: c.notes ?? undefined,
    barberId: c.barber_id,
    appointmentsCount: counts.get(c.id) ?? 0,
  }))
}

export async function addClient(clientData: Omit<Client, "id" | "appointmentsCount">): Promise<Client | null> {
  const supabase = await db()
  if (!supabase || !clientData.barberId) return null
  const { data, error } = await supabase
    .from("clients")
    .insert({
      barber_id: clientData.barberId,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone || null,
      notes: clientData.notes ?? null,
    })
    .select("*")
    .single()
  if (error || !data) {
    console.error("addClient:", error)
    return null
  }
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? "",
    notes: data.notes ?? undefined,
    barberId: data.barber_id,
    appointmentsCount: 0,
  }
}

export async function updateClient(clientData: Client): Promise<Client | null> {
  const supabase = await db()
  if (!supabase) return null
  const { data, error } = await supabase
    .from("clients")
    .update({
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone || null,
      notes: clientData.notes ?? null,
    })
    .eq("id", clientData.id)
    .select("*")
    .single()
  if (error || !data) {
    console.error("updateClient:", error)
    return null
  }
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? "",
    notes: data.notes ?? undefined,
    barberId: data.barber_id,
    appointmentsCount: clientData.appointmentsCount,
  }
}

export async function deleteClient(id: string): Promise<boolean> {
  const supabase = await db()
  if (!supabase) return false
  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) {
    console.error("deleteClient:", error)
    return false
  }
  return true
}

async function enrichAppointments(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  rows: Array<{
    id: string
    client_id: string
    resource_id: string | null
    service_id: string | null
    barber_id: string
    date: string
    time: string
    status: string
    payment_method: string | null
    payment_status: string | null
  }>,
): Promise<Appointment[]> {
  const clientIds = [...new Set(rows.map((r) => r.client_id))]
  const serviceIds = [...new Set(rows.map((r) => r.service_id).filter(Boolean))] as string[]
  const resourceIds = [...new Set(rows.map((r) => r.resource_id).filter(Boolean))] as string[]

  const [{ data: clients }, { data: services }, { data: resources }] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("id,name").in("id", clientIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    serviceIds.length
      ? supabase.from("services").select("id,name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    resourceIds.length
      ? supabase.from("resources").select("id,name").in("id", resourceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const cMap = new Map((clients ?? []).map((c) => [c.id, c.name]))
  const sMap = new Map((services ?? []).map((s) => [s.id, s.name]))
  const rMap = new Map((resources ?? []).map((r) => [r.id, r.name]))

  return rows.map((r) => ({
    id: r.id,
    clientId: r.client_id,
    clientName: cMap.get(r.client_id) ?? "Cliente",
    serviceId: r.service_id ?? "",
    serviceName: r.service_id ? (sMap.get(r.service_id) ?? "Servizio") : "",
    resourceId: r.resource_id ?? "",
    resourceName: r.resource_id ? (rMap.get(r.resource_id) ?? "Staff") : "",
    barberId: r.barber_id,
    date: r.date,
    time: r.time,
    status: r.status as Appointment["status"],
    paymentMethod: r.payment_method as Appointment["paymentMethod"],
    paymentStatus: r.payment_status as Appointment["paymentStatus"],
  }))
}

export async function getAppointments(barberId: string): Promise<Appointment[]> {
  const supabase = await db()
  if (!supabase || !barberId) return []
  const { data: rows, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("barber_id", barberId)
    .order("date", { ascending: true })
    .order("time", { ascending: true })
  if (error || !rows) {
    console.error("getAppointments:", error)
    return []
  }
  return enrichAppointments(supabase, rows)
}

export async function getClientAppointments(clientId: string): Promise<Appointment[]> {
  const supabase = await db()
  if (!supabase) return []
  const { data: rows, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: true })
  if (error || !rows || rows.length === 0) return []
  return enrichAppointments(supabase, rows)
}
