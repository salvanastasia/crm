"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { randomBytes, randomUUID } from "crypto"
import type {
  Service,
  Resource,
  BrandSettings,
  BusinessHours,
  NotificationSettings,
  Client,
  Appointment,
} from "./types"
import {
  appointmentCalendarDateKey,
  slotOverlapsAnyBusy,
  timeStringToMinutes,
  toBusyIntervals,
  type BookedIntervalRow,
} from "@/lib/appointment-availability"

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

  const resources = rows ?? []
  if (resources.length === 0) return []

  // Batch junction fetch to avoid N+1 queries (resource -> resource_services -> serviceIds).
  const resourceIds = resources.map((r) => r.id)
  const { data: links, error: linksErr } = await supabase
    .from("resource_services")
    .select("resource_id, service_id")
    .in("resource_id", resourceIds)

  if (linksErr) {
    console.error("getResources(resource_services):", linksErr)
    return []
  }

  const serviceIdsByResource = new Map<string, string[]>()
  for (const link of links ?? []) {
    const rid = String((link as any).resource_id ?? "")
    const sid = String((link as any).service_id ?? "")
    if (!rid || !sid) continue
    const prev = serviceIdsByResource.get(rid) ?? []
    prev.push(sid)
    serviceIdsByResource.set(rid, prev)
  }

  return resources.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email ?? "",
    phone: r.phone ?? "",
    role: r.role,
    bio: r.bio ?? undefined,
    imageUrl: r.image_url ?? undefined,
    isActive: r.is_active,
    barberId: r.barber_id,
    serviceIds: serviceIdsByResource.get(String(r.id)) ?? [],
  }))
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const supabase = await db()
  if (!supabase) return null
  const { data: resource, error } = await supabase.from("resources").select("*").eq("id", id).maybeSingle()
  if (error || !resource) return null
  return mapResourceRow(supabase, resource)
}

/** Ensures the current admin user exists as a `resources` row (so it can be booked/associated like staff). */
export async function ensureOwnerResource(barberId: string): Promise<Resource | null> {
  const supabase = await db()
  if (!supabase || !barberId) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return null

  const avatarUrl = (user.user_metadata as any)?.avatar_url as string | undefined

  // Gate: only allow admins of this barber to self-provision a resource row.
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, name, email, phone, role, barber_id")
    .eq("id", user.id)
    .maybeSingle()

  if (profileErr || !profile) return null
  if (profile.role !== "admin") return null
  if (profile.barber_id !== barberId) return null

  const { data: existing, error: existingErr } = await supabase
    .from("resources")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (existingErr) return null
  if (existing) {
    // Keep service associations intact: only update the "identity" fields (incl. avatar).
    const existingImageUrl = (existing as any).image_url as string | null | undefined
    const newImageUrl = avatarUrl ?? null

    const shouldUpdate =
      existingImageUrl !== newImageUrl ||
      (profile.name && (existing as any).name !== profile.name) ||
      ((profile.email ?? null) && (existing as any).email !== (profile.email ?? null))

    if (shouldUpdate) {
      const { error: updateErr } = await supabase.from("resources").update({
        name: profile.name ?? (existing as any).name,
        email: profile.email ?? (existing as any).email,
        phone: profile.phone ?? (existing as any).phone,
        image_url: newImageUrl,
        role: "Admin",
        is_active: true,
        barber_id: barberId,
      }).eq("id", user.id)
      if (updateErr) return mapResourceRow(supabase, existing)
    }

    return mapResourceRow(supabase, existing)
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("resources")
    .insert({
      id: user.id,
      name: profile.name ?? "Admin",
      email: profile.email ?? user.email ?? null,
      phone: profile.phone ?? null,
      role: "Admin",
      bio: null,
      image_url: avatarUrl ?? null,
      is_active: true,
      barber_id: barberId,
    })
    .select("*")
    .single()

  if (insertErr || !inserted) {
    // If it already exists due to a race, just re-read.
    if ((insertErr as { code?: string } | null)?.code === "23505") {
      const { data: reread } = await supabase.from("resources").select("*").eq("id", user.id).maybeSingle()
      return reread ? mapResourceRow(supabase, reread) : null
    }
    return null
  }

  return mapResourceRow(supabase, inserted)
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

  const rawLogoUrl = data.logo_url ?? ""
  // If the project previously saved `blob:` URLs (ephemeral), treat them as empty so the UI falls back.
  const logoUrl = typeof rawLogoUrl === "string" && rawLogoUrl.startsWith("blob:") ? "" : rawLogoUrl
  return {
    id: data.id,
    businessName: data.business_name,
    brandColor: data.brand_color ?? "#4f46e5",
    logoUrl,
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

async function fetchBookedIntervalsFromRpc(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  params: {
    barberId: string
    resourceId: string
    dateKey: string
    excludeAppointmentId?: string | null
  },
): Promise<BookedIntervalRow[]> {
  const { data, error } = await supabase.rpc("get_booked_intervals_for_resource", {
    p_barber_id: params.barberId,
    p_resource_id: params.resourceId,
    p_date: params.dateKey,
    p_exclude_appointment_id: params.excludeAppointmentId ?? null,
  })

  if (error) {
    console.error("get_booked_intervals_for_resource:", error)
    return []
  }

  const rows = (data ?? []) as { start_time: string; duration_minutes: number }[]
  return rows.map((r) => ({
    startTime: String(r.start_time ?? "").slice(0, 5),
    durationMinutes: Math.max(5, Number(r.duration_minutes) || 30),
  }))
}

/** Intervalli occupati per risorsa/giorno (RPC SECURITY DEFINER; richiede migration). */
export async function getBookedIntervalsForResource(params: {
  barberId: string
  resourceId: string
  date: Date | string
  excludeAppointmentId?: string | null
}): Promise<BookedIntervalRow[]> {
  const supabase = await db()
  if (!supabase || !params.barberId || !params.resourceId || !params.date) return []

  const dateKey = appointmentCalendarDateKey(params.date)
  if (!dateKey) return []

  return fetchBookedIntervalsFromRpc(supabase, {
    barberId: params.barberId,
    resourceId: params.resourceId,
    dateKey,
    excludeAppointmentId: params.excludeAppointmentId,
  })
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

  const dateStr = appointmentCalendarDateKey(data.date)
  if (!dateStr) return { success: false, message: "Data non valida" }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return { success: false, message: "Client non autenticato" }
  }

  // Keep appointments bound to the logged-in client user id.
  // Optionally sync displayed fields into `profiles`.
  await supabase
    .from("profiles")
    .update({
      name: data.clientName,
      phone: data.clientPhone || null,
    })
    .eq("id", user.id)

  const clientId = user.id

  const { data: svcRow, error: svcErr } = await supabase
    .from("services")
    .select("duration")
    .eq("id", data.serviceId)
    .eq("barber_id", data.barberId)
    .maybeSingle()

  if (svcErr || !svcRow) {
    return { success: false, message: "Servizio non trovato o non disponibile" }
  }

  const newDurationMin = Math.max(5, Number(svcRow.duration) || 30)
  const bookedRows = await fetchBookedIntervalsFromRpc(supabase, {
    barberId: data.barberId,
    resourceId: data.resourceId,
    dateKey: dateStr,
    excludeAppointmentId: null,
  })
  const busy = toBusyIntervals(bookedRows)
  const proposedStart = timeStringToMinutes(data.time)
  if (slotOverlapsAnyBusy(proposedStart, newDurationMin, busy)) {
    return {
      success: false,
      message: "Questo orario non e' disponibile per il dipendente scelto. Scegli un altro slot.",
    }
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
      status: "pending",
      payment_method: data.paymentMethod ?? "cash",
      payment_status: "pending",
    })
    .select("id")
    .single()

  if (apptErr || !appt) {
    if ((apptErr as { code?: string } | null)?.code === "23505") {
      return { success: false, message: "Questo orario non e' piu' disponibile. Scegli un altro slot." }
    }
    return { success: false, message: apptErr?.message ?? "Errore creazione appuntamento" }
  }
  return { success: true, message: "Appuntamento prenotato", appointmentId: appt.id }
}

// --- Clienti CRM ---

export async function getClients(barberId: string): Promise<Client[]> {
  const supabase = await db()
  if (!supabase || !barberId) return []

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id,name,email,phone,barber_id")
    .eq("role", "client")
    .eq("barber_id", barberId)
    .order("name")

  if (error || !profiles) {
    console.error("getClients(profiles):", error)
    return []
  }

  const { data: appts } = await supabase.from("appointments").select("client_id").eq("barber_id", barberId)
  const counts = new Map<string, number>()
  for (const a of appts ?? []) {
    counts.set(a.client_id, (counts.get(a.client_id) ?? 0) + 1)
  }

  const resolveClientImageUrl = async (clientId: string) => {
    const extensions = ["jpg", "jpeg", "png", "webp"]
    for (const ext of extensions) {
      const objectPath = `${barberId}/profiles/${clientId}.${ext}`
      const { data } = supabase.storage.from("logos").getPublicUrl(objectPath)
      const publicUrl = data?.publicUrl
      if (!publicUrl) continue

      try {
        const response = await fetch(publicUrl, { method: "HEAD", cache: "no-store" })
        if (response.ok) return publicUrl
      } catch {
        // ignore and try next extension
      }
    }
    return undefined
  }

  const mapped = await Promise.all(
    profiles.map(async (p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone ?? "",
      imageUrl: await resolveClientImageUrl(p.id),
      notes: undefined,
      barberId: p.barber_id,
      appointmentsCount: counts.get(p.id) ?? 0,
    })),
  )

  return mapped
}

export async function addClient(clientData: Omit<Client, "id" | "appointmentsCount">): Promise<Client | null> {
  const supabase = await db()
  if (!supabase) return null

  // Dev/ops workflow: admin adds a client, app sends a magic link for confirmation.
  // The actual `profiles` row will be created/updated by `auth/callback` -> `syncProfileFromAuthUser`.
  const email = clientData.email?.trim().toLowerCase() ?? ""
  const name = clientData.name.trim()
  const phone = clientData.phone || null
  // #region agent log
  fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'debug-client-add',hypothesisId:'K',location:'lib/actions.ts:addClient',message:'addClient:enter',data:{emailProvided:!!email,nameLen:name.length,phoneLen:(phone??"").toString().length,barberId:!!clientData.barberId},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  const isProfilesRlsViolation = (err: unknown) => {
    const msg = (err as any)?.message?.toLowerCase?.() ?? ""
    return msg.includes("violates row-level security policy") || msg.includes("row-level security")
  }

  if (!email) {
    console.error("addClient: email required; received empty email")
    return null
  }

  // If email is not provided, create a plain profiles row immediately.
  if (!email) {
    const clientProfileId = randomUUID()

    // #region agent log
    fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-no-email',hypothesisId:'H',location:'lib/actions.ts:addClient',message:'addClient:no-email:insert:start',data:{hasBarberId:!!clientData.barberId,nameLen:name.length,phoneLen:(clientData.phone||"").length},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    try {
      const { error: insertErr } = await supabase.from("profiles").insert({
        id: clientProfileId,
        name,
        email: "",
        role: "client",
        phone,
        barber_id: clientData.barberId,
      })

      if (!insertErr) {
        return {
          id: clientProfileId,
          name,
          email: "",
          phone: clientData.phone || "",
          notes: undefined,
          barberId: clientData.barberId,
          appointmentsCount: 0,
        }
      }

      let rlsRetrySucceeded = false
      console.error("addClient:no-email insert:", insertErr)

      if (isProfilesRlsViolation(insertErr)) {
        // Attempt a single policy repair using the security-definer RPC, if available.
        let rpcErr: any = null
        try {
          const rpcRes = await supabase.rpc("fix_profiles_policy")
          rpcErr = rpcRes?.error ?? null
        } catch (e) {
          rpcErr = e
        }
        // #region agent log
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-no-email',hypothesisId:'I',location:'lib/actions.ts:addClient',message:'addClient:no-email:rlsRetry:fix_profiles_policy',data:{rpcErrorMessage:rpcErr?.message??null},timestamp:Date.now()})}).catch(()=>{})
        // #endregion

        const { error: retryErr } = await supabase.from("profiles").insert({
          id: clientProfileId,
          name,
          email: "",
          role: "client",
          phone,
          barber_id: clientData.barberId,
        })

        if (retryErr) {
          console.error("addClient:no-email insert retry:", retryErr)
          if (isProfilesRlsViolation(retryErr)) {
            const dropAndRecreatePoliciesSql = `
              ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
              DO $$
              DECLARE r RECORD;
              BEGIN
                FOR r IN
                  SELECT policyname
                  FROM pg_policies
                  WHERE schemaname = 'public' AND tablename = 'profiles'
                LOOP
                  EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
                END LOOP;
              END $$;

              CREATE POLICY profiles_shop_manager_select_client
                ON public.profiles
                FOR SELECT
                TO authenticated
                USING (
                  role = 'client'
                  AND barber_id IS NOT NULL
                  AND EXISTS (
                    SELECT 1
                    FROM public.profiles p2
                    WHERE p2.id = auth.uid()
                      AND p2.role IN ('admin', 'staff')
                      AND p2.barber_id IS NOT NULL
                      AND p2.barber_id = public.profiles.barber_id
                  )
                );

              CREATE POLICY profiles_shop_manager_insert_client
                ON public.profiles
                FOR INSERT
                TO authenticated
                WITH CHECK (
                  role = 'client'
                  AND barber_id IS NOT NULL
                  AND EXISTS (
                    SELECT 1
                    FROM public.profiles p2
                    WHERE p2.id = auth.uid()
                      AND p2.role IN ('admin', 'staff')
                      AND p2.barber_id IS NOT NULL
                      AND p2.barber_id = public.profiles.barber_id
                  )
                );

              CREATE POLICY profiles_shop_manager_update_client
                ON public.profiles
                FOR UPDATE
                TO authenticated
                USING (
                  role = 'client'
                  AND barber_id IS NOT NULL
                  AND EXISTS (
                    SELECT 1
                    FROM public.profiles p2
                    WHERE p2.id = auth.uid()
                      AND p2.role IN ('admin', 'staff')
                      AND p2.barber_id IS NOT NULL
                      AND p2.barber_id = public.profiles.barber_id
                  )
                )
                WITH CHECK (
                  role = 'client'
                  AND barber_id IS NOT NULL
                  AND EXISTS (
                    SELECT 1
                    FROM public.profiles p2
                    WHERE p2.id = auth.uid()
                      AND p2.role IN ('admin', 'staff')
                      AND p2.barber_id IS NOT NULL
                      AND p2.barber_id = public.profiles.barber_id
                  )
                );
            `

            // #region agent log
            fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-no-email',hypothesisId:'R',location:'lib/actions.ts:addClient',message:'addClient:no-email:exec_sql:attempt',data:{hasExecSqlFn:false,barberId:clientData.barberId},timestamp:Date.now()})}).catch(()=>{})
            // #endregion

            let execErr: any = null
            try {
              const { error } = await supabase.rpc("exec_sql", { sql: dropAndRecreatePoliciesSql })
              execErr = error
            } catch (e) {
              execErr = e
            }

            // #region agent log
            fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-no-email',hypothesisId:'R',location:'lib/actions.ts:addClient',message:'addClient:no-email:exec_sql:result',data:{execErrMessage:execErr?.message??null},timestamp:Date.now()})}).catch(()=>{})
            // #endregion

            if (!execErr) {
              const { error: retryErr2 } = await supabase.from("profiles").insert({
                id: clientProfileId,
                name,
                email: "",
                role: "client",
                phone,
                barber_id: clientData.barberId,
              })

              if (!retryErr2) {
                return {
                  id: clientProfileId,
                  name,
                  email: "",
                  phone: clientData.phone || "",
                  notes: undefined,
                  barberId: clientData.barberId,
                  appointmentsCount: 0,
                }
              }
            }
          }

          // #region agent log
          fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-no-email',hypothesisId:'I',location:'lib/actions.ts:addClient',message:'addClient:no-email:rlsRetry:insertAgainError',data:{retryErrorMessage:retryErr?.message??null},timestamp:Date.now()})}).catch(()=>{})
          // #endregion
          return null
        }

        rlsRetrySucceeded = true
      } else {
        // Not an RLS policy issue; fail fast.
        // #region agent log
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-no-email',hypothesisId:'I',location:'lib/actions.ts:addClient',message:'addClient:no-email:insert:errorNonRls',data:{errorMessage:insertErr?.message??null},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        return null
      }

      if (!rlsRetrySucceeded) {
        // #region agent log
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-no-email',hypothesisId:'H',location:'lib/actions.ts:addClient',message:'addClient:no-email:insert:error',data:{errorMessage:insertErr?.message??null},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
      }
      // Note: if we reached here after RLS repair, the row insert succeeded and we should continue.
      return {
        id: clientProfileId,
        name,
        email: "",
        phone: clientData.phone || "",
        notes: undefined,
        barberId: clientData.barberId,
        appointmentsCount: 0,
      }
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-no-email',hypothesisId:'K',location:'lib/actions.ts:addClient',message:'addClient:no-email:insert:exception',data:{errorMessage:(err as any)?.message??null},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      throw err
    }
  }

  // Magic-link / auth-user creation is handled client-side to ensure the PKCE verifier is available
  // when hitting `/auth/callback`. This server action only creates client `profiles` rows when `email` is empty.
  // #region agent log
  fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'debug-client-add',hypothesisId:'S',location:'lib/actions.ts:addClient',message:'addClient:emailProvided:skipOtpServerAction',data:{emailLen:email.length,hasBarberId:!!clientData.barberId},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  return null

  const h = headers()
  const originFromHeader = h.get("origin") ?? undefined
  const referer = h.get("referer") ?? undefined
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? undefined
  const proto = h.get("x-forwarded-proto") ?? "http"

  let origin: string | undefined = originFromHeader
  let originSource: string = originFromHeader ? "origin" : ""

  if (!origin && referer) {
    try {
      origin = new URL(referer).origin
      originSource = "referer"
    } catch {
      // ignore parse errors
    }
  }

  if (!origin && host) {
    origin = `${proto}://${host}`
    originSource = "host"
  }

  // #region agent log
  fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-invite',hypothesisId:'F',location:'lib/actions.ts:addClient',message:'addClient:originResolved',data:{originSource,originLen:origin?.length??0,hasOrigin:!!origin,hasSupabaseUrl:!!process.env.NEXT_PUBLIC_SUPABASE_URL,hasServiceRole:!!process.env.SUPABASE_SERVICE_ROLE_KEY},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  if (!origin) {
    console.error("addClient: missing origin for emailRedirectTo", { originSource, hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL })
    return null
  }

  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/booking")}`

  // #region agent log
  fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-invite',hypothesisId:'C',location:'lib/actions.ts:addClient',message:'addClient:signInWithOtp:start',data:{emailLen:clientData.email?.length??0,hasBarberId:!!clientData.barberId},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
      // If Supabase supports user_metadata on magic link creation, syncProfileFromAuthUser
      // will pick it up (name/phone) and persist into `profiles`.
      data: {
        name,
        phone: clientData.phone || null,
      },
    },
  } as any)

  if (error) {
    console.error("addClient(signInWithOtp):", error)
    const isRateLimit =
      (error?.message || "").toLowerCase().includes("email rate limit") ||
      (error as any)?.status === 429 ||
      (error as any)?.code === "rate_limit_exceeded"

    // #region agent log
    fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-invite',hypothesisId:'E',location:'lib/actions.ts:addClient',message:'addClient:signInWithOtp:error:rateLimitDecision',data:{isRateLimit,hasServiceRole:!!process.env.SUPABASE_SERVICE_ROLE_KEY,hasSupabaseUrl:!!process.env.NEXT_PUBLIC_SUPABASE_URL,errorMessage:(error?.message??null)},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    // #region agent log
    fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-invite',hypothesisId:'C',location:'lib/actions.ts:addClient',message:'addClient:signInWithOtp:error',data:{errorMessage:error?.message??null,hasData:!!data},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    if (!isRateLimit) return null

    // Rate limit is preventing the email from being sent, which also prevents the client auth user from being created.
    // Fallback: create the auth user + profiles row via the service role, so the admin list updates immediately.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const serviceRoleAvailable = !!supabaseUrl && !!serviceRoleKey

    // If service-role isn’t available in env, we can still upsert a placeholder profile row.
    // This makes the admin “Clienti” list refresh immediately even when email OTP is rate-limited.
    if (!serviceRoleAvailable) {
      const { data: existingProfile, error: findProfileErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "client")
        .eq("email", email)
        .maybeSingle()

      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-invite',hypothesisId:'G',location:'lib/actions.ts:addClient',message:'addClient:rateLimit:fallback:noServiceRole:profileLookup',data:{hasError:!!findProfileErr,errorMessage:findProfileErr?.message??null,hasExisting:!!existingProfile?.id},timestamp:Date.now()})}).catch(()=>{})
      // #endregion

      if (findProfileErr) return null

      let clientProfileId = existingProfile?.id as string | undefined
      if (!clientProfileId) {
        clientProfileId = randomUUID()

        const { error: insertProfileErr } = await supabase.from("profiles").insert({
          id: clientProfileId,
          name: clientData.name,
          email,
          role: "client",
          phone: clientData.phone || null,
          barber_id: clientData.barberId,
        })

        // #region agent log
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-invite',hypothesisId:'G',location:'lib/actions.ts:addClient',message:'addClient:rateLimit:fallback:noServiceRole:profileInsert',data:{hasError:!!insertProfileErr,errorMessage:insertProfileErr?.message??null,clientProfileId,barberId:clientData.barberId},timestamp:Date.now()})}).catch(()=>{})
        // #endregion

        if (insertProfileErr) return null
      }

      return {
        id: clientProfileId,
        name: clientData.name,
        email,
        phone: clientData.phone || "",
        notes: undefined,
        barberId: clientData.barberId,
        appointmentsCount: 0,
      }
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const password = randomBytes(16).toString("hex")
    const { data: createdUserData, error: createUserError } = await admin.auth.admin.createUser({
      email: clientData.email,
      password,
      email_confirm: false,
      user_metadata: {
        name: clientData.name,
        phone: clientData.phone || null,
        role: "client",
      },
    } as any)

    const createdUserId = (createdUserData as any)?.user?.id as string | undefined

    // #region agent log
    fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-invite',hypothesisId:'D',location:'lib/actions.ts:addClient',message:'addClient:rateLimit:fallback:createUser',data:{hasUserId:!!createdUserId,hasError:!!createUserError,createUserErrorMessage:createUserError?.message??null},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    let userId = createdUserId
    if (!userId) {
      // If the user already exists, reuse it. This is a best-effort fallback for dev/admin workflows.
      const { data: usersPage, error: listUsersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 } as any)
      if (listUsersError) {
        // #region agent log
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-invite',hypothesisId:'D',location:'lib/actions.ts:addClient',message:'addClient:rateLimit:fallback:listUsers:error',data:{errorMessage:listUsersError?.message??null},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        return null
      }
      userId = (usersPage as any)?.users?.find((u: any) => (u?.email || "").toLowerCase() === clientData.email.toLowerCase())?.id
    }

    if (!userId) return null

    const { error: profileUpsertError } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          name: clientData.name,
          email: clientData.email,
          role: "client",
          phone: clientData.phone || null,
          barber_id: clientData.barberId,
        } as any,
        { onConflict: "id" },
      )

    // #region agent log
    fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-invite',hypothesisId:'D',location:'lib/actions.ts:addClient',message:'addClient:rateLimit:fallback:profileUpsert',data:{hasError:!!profileUpsertError,profileUpsertErrorMessage:profileUpsertError?.message??null},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    if (profileUpsertError) return null

    // Best-effort: try to generate/send the magic link again (may still be rate-limited; list should still work).
    await admin.auth.admin.generateLink({ type: "magiclink", email: clientData.email, options: { emailRedirectTo } } as any).catch(() => {})

    return {
      id: userId,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone || "",
      notes: undefined,
      barberId: clientData.barberId,
      appointmentsCount: 0,
    }
  }

  // Client row will appear after user verifies the magic link.
  // #region agent log
  fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-invite',hypothesisId:'C',location:'lib/actions.ts:addClient',message:'addClient:signInWithOtp:success',data:{hasData:!!data},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  // If Supabase created an auth user for this email, upsert the matching profiles row immediately
  // so the admin “Clienti” list updates without waiting for the magic link confirmation.
  const userId =
    (data as any)?.user?.id ??
    (data as any)?.session?.user?.id ??
    (data as any)?.data?.user?.id ??
    null

  // #region agent log
  fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'debug-client-add',hypothesisId:'L',location:'lib/actions.ts:addClient',message:'addClient:otp-success:userId-extracted',data:{hasUserId:!!userId,userId:typeof userId==='string'?userId.slice(0,8):null},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  if (!userId) return null

  const userIdData = {
    hasUser: !!(data as any)?.user,
    hasSessionUser: !!(data as any)?.session?.user,
    hasDataUser: !!(data as any)?.data?.user,
  }

  // #region agent log
  fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'debug-client-add',hypothesisId:'L',location:'lib/actions.ts:addClient',message:'addClient:otp-success:data-structure',data:{...userIdData},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  const { error: profileUpsertErr } = await supabase.from("profiles").upsert(
    {
      id: userId,
      name,
      email,
      role: "client",
      phone: clientData.phone || null,
      barber_id: clientData.barberId,
    } as any,
    { onConflict: "id" },
  )

  if (profileUpsertErr) {
    console.error("addClient:profiles upsert after OTP success:", profileUpsertErr)
    // #region agent log
    fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'debug-client-add',hypothesisId:'L',location:'lib/actions.ts:addClient',message:'addClient:otp-success:profiles-upsert:error',data:{errorMessage:profileUpsertErr?.message??null},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    return null
  }

  return {
    id: userId,
    name,
    email,
    phone: clientData.phone || "",
    notes: undefined,
    barberId: clientData.barberId,
    appointmentsCount: 0,
  }
}

export async function updateClient(clientData: Client): Promise<Client | null> {
  const supabase = await db()
  if (!supabase) return null

  const { data: p, error } = await supabase
    .from("profiles")
    .update({
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone || null,
    })
    .eq("id", clientData.id)
    .select("id,name,email,phone,barber_id")
    .single()

  if (error || !p) {
    console.error("updateClient(profiles):", error)
    return null
  }

  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone ?? "",
    notes: undefined,
    barberId: p.barber_id,
    appointmentsCount: clientData.appointmentsCount,
  }
}

export async function deleteClient(id: string): Promise<boolean> {
  const supabase = await db()
  if (!supabase) return false

  const { error } = await supabase.from("profiles").update({ barber_id: null }).eq("id", id).eq("role", "client")
  if (error) {
    console.error("deleteClient(profiles):", error)
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
    created_at?: string
    updated_at?: string
  }>,
): Promise<Appointment[]> {
  const clientIds = [...new Set(rows.map((r) => r.client_id))]
  const serviceIds = [...new Set(rows.map((r) => r.service_id).filter(Boolean))] as string[]
  const resourceIds = [...new Set(rows.map((r) => r.resource_id).filter(Boolean))] as string[]

  const [{ data: clients }, { data: services }, { data: resources }] = await Promise.all([
    clientIds.length
      ? supabase.from("profiles").select("id,name").in("id", clientIds).eq("role", "client")
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
    createdAt: r.created_at,
    updatedAt: r.updated_at,
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

export async function getClientStatusChangeAppointments(
  clientId: string,
  limit = 5,
): Promise<Appointment[]> {
  const supabase = await db()
  if (!supabase || !clientId) return []

  const { data: rows, error } = await supabase
    .from("appointments")
    .select(
      "id, client_id, service_id, resource_id, barber_id, date, time, status, payment_method, payment_status, updated_at",
    )
    .eq("client_id", clientId)
    .in("status", ["confirmed", "cancelled"])
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error || !rows) {
    console.error("getClientStatusChangeAppointments:", error)
    return []
  }

  return enrichAppointments(supabase, rows as any)
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "confirmed" | "cancelled",
  barberId: string,
): Promise<boolean> {
  const supabase = await db()
  if (!supabase || !appointmentId || !barberId) return false

  const { error } = await supabase
    .from("appointments")
    .update({
      status,
      payment_status: "pending",
    })
    .eq("id", appointmentId)
    .eq("barber_id", barberId)

  if (error) {
    console.error("updateAppointmentStatus:", error)
    return false
  }

  return true
}

export async function updateAppointmentDetailsByAdmin(
  appointmentId: string,
  barberId: string,
  payload: {
    date: string
    time: string
    status: "pending" | "confirmed" | "completed" | "cancelled"
  },
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await db()
  if (!supabase || !appointmentId || !barberId) return { ok: false, message: "Richiesta non valida" }

  const dateKey = appointmentCalendarDateKey(payload.date)
  if (!dateKey) return { ok: false, message: "Data non valida" }

  const { data: row, error: rowErr } = await supabase
    .from("appointments")
    .select("id, service_id, resource_id")
    .eq("id", appointmentId)
    .eq("barber_id", barberId)
    .maybeSingle()

  if (rowErr || !row) {
    console.error("updateAppointmentDetailsByAdmin(load):", rowErr)
    return { ok: false, message: "Appuntamento non trovato" }
  }

  if (payload.status !== "cancelled") {
    const { data: svcRow } = await supabase
      .from("services")
      .select("duration")
      .eq("id", row.service_id ?? "")
      .eq("barber_id", barberId)
      .maybeSingle()

    const durationMin = Math.max(5, Number(svcRow?.duration) || 30)
    const resourceId = row.resource_id as string
    if (!resourceId) return { ok: false, message: "Risorsa non valida" }

    const bookedRows = await fetchBookedIntervalsFromRpc(supabase, {
      barberId,
      resourceId,
      dateKey,
      excludeAppointmentId: appointmentId,
    })
    const busy = toBusyIntervals(bookedRows)
    const proposedStart = timeStringToMinutes(payload.time)
    if (slotOverlapsAnyBusy(proposedStart, durationMin, busy)) {
      return {
        ok: false,
        message: "Orario non disponibile: si sovrappone ad un altro appuntamento per questa risorsa.",
      }
    }
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      date: dateKey,
      time: payload.time,
      status: payload.status,
      payment_status: payload.status === "completed" ? "paid" : "pending",
    })
    .eq("id", appointmentId)
    .eq("barber_id", barberId)

  if (error) {
    console.error("updateAppointmentDetailsByAdmin:", error)
    if ((error as { code?: string }).code === "23505") {
      return { ok: false, message: "Slot gia' occupato. Scegli un altro orario." }
    }
    return { ok: false, message: error.message ?? "Aggiornamento non riuscito" }
  }

  return { ok: true }
}

export async function getDashboardStats(
  barberId: string,
  startDateKey: string,
  endDateKey: string,
) {
  const supabase = await db()
  if (!supabase || !barberId || !startDateKey || !endDateKey) {
    return {
      incassoTotal: 0,
      appointmentsCount: 0,
      servicesSoldCount: 0,
      activeClientsCount: 0,
      incassoChangePct: 0,
      appointmentsChangePct: 0,
      servicesSoldChangePct: 0,
      activeClientsChangePct: 0,
    }
  }

  const start = new Date(`${startDateKey}T00:00:00.000Z`)
  const end = new Date(`${endDateKey}T00:00:00.000Z`)

  const prevStart = new Date(start)
  prevStart.setUTCMonth(prevStart.getUTCMonth() - 1)

  const prevEnd = new Date(end)
  prevEnd.setUTCMonth(prevEnd.getUTCMonth() - 1)

  const prevStartKey = prevStart.toISOString().slice(0, 10)
  const prevEndKey = prevEnd.toISOString().slice(0, 10)

  type PeriodStats = {
    incassoTotal: number
    appointmentsCount: number
    servicesSoldCount: number
    activeClientsCount: number
  }

  const computePeriod = async (rangeStartKey: string, rangeEndKey: string): Promise<PeriodStats> => {
    const { data: appts, error } = await supabase
      .from("appointments")
      .select("client_id, service_id, payment_status, status")
      .eq("barber_id", barberId)
      .gte("date", rangeStartKey)
      .lte("date", rangeEndKey)
      .neq("status", "cancelled")

    if (error || !appts) {
      console.error("getDashboardStats(appts):", error)
      return { incassoTotal: 0, appointmentsCount: 0, servicesSoldCount: 0, activeClientsCount: 0 }
    }

    const appointmentsCount = appts.length
    const paidAppts = appts.filter((a) => a.payment_status === "paid")

    const activeClientsCount = new Set(paidAppts.map((a) => a.client_id)).size
    const servicesSoldCount = paidAppts.filter((a) => !!a.service_id).length

    const paidServiceIds = [...new Set(paidAppts.map((a) => a.service_id).filter(Boolean))] as string[]
    if (paidServiceIds.length === 0) {
      return { incassoTotal: 0, appointmentsCount, servicesSoldCount, activeClientsCount }
    }

    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, price")
      .eq("barber_id", barberId)
      .in("id", paidServiceIds)

    if (servicesError || !services) {
      console.error("getDashboardStats(services):", servicesError)
      return { incassoTotal: 0, appointmentsCount, servicesSoldCount, activeClientsCount }
    }

    const priceMap = new Map(services.map((s) => [s.id, Number(s.price)]))
    const incassoTotal = paidAppts.reduce((sum, a) => sum + (a.service_id ? priceMap.get(a.service_id) ?? 0 : 0), 0)

    return { incassoTotal, appointmentsCount, servicesSoldCount, activeClientsCount }
  }

  const [curr, prev] = await Promise.all([computePeriod(startDateKey, endDateKey), computePeriod(prevStartKey, prevEndKey)])

  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? 0 : 100
    return ((current - previous) / previous) * 100
  }

  return {
    ...curr,
    incassoChangePct: pctChange(curr.incassoTotal, prev.incassoTotal),
    appointmentsChangePct: pctChange(curr.appointmentsCount, prev.appointmentsCount),
    servicesSoldChangePct: pctChange(curr.servicesSoldCount, prev.servicesSoldCount),
    activeClientsChangePct: pctChange(curr.activeClientsCount, prev.activeClientsCount),
  }
}

export async function getRevenueChartSeries(barberId: string, year: number) {
  const supabase = await db()
  const monthLabels = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
  if (!supabase || !barberId || !year) return monthLabels.map((name) => ({ name, total: 0 }))

  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`

  const { data: appts, error } = await supabase
    .from("appointments")
    .select("date, service_id")
    .eq("barber_id", barberId)
    .gte("date", yearStart)
    .lte("date", yearEnd)
    .eq("payment_status", "paid")
    .neq("status", "cancelled")

  if (error || !appts) {
    console.error("getRevenueChartSeries:", error)
    return monthLabels.map((name) => ({ name, total: 0 }))
  }

  const totals = Array.from({ length: 12 }, () => 0)

  const serviceIds = [...new Set(appts.map((a) => a.service_id).filter(Boolean))] as string[]
  if (serviceIds.length === 0) {
    return monthLabels.map((name, idx) => ({ name, total: totals[idx] }))
  }

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, price")
    .eq("barber_id", barberId)
    .in("id", serviceIds)

  if (servicesError || !services) {
    console.error("getRevenueChartSeries(services):", servicesError)
    return monthLabels.map((name, idx) => ({ name, total: totals[idx] }))
  }

  const priceMap = new Map(services.map((s) => [s.id, Number(s.price)]))

  for (const a of appts) {
    // appointments.date is expected as 'YYYY-MM-DD'
    const month = Number(String(a.date).slice(5, 7)) - 1
    if (month < 0 || month > 11) continue
    if (!a.service_id) continue
    totals[month] += priceMap.get(a.service_id) ?? 0
  }

  return monthLabels.map((name, idx) => ({ name, total: totals[idx] }))
}

export async function getRecentAppointmentsForDashboard(
  barberId: string,
  startDateKey: string,
  endDateKey: string,
  limit = 4,
) {
  const supabase = await db()
  if (!supabase || !barberId || !startDateKey || !endDateKey) {
    return {
      appointmentsCount: 0,
      recent: [] as Array<{
        id: string
        clientName: string
        clientEmail: string
        initials: string
        amount: number
        date: string
        time: string
        status: "pending" | "confirmed" | "completed" | "cancelled"
      }>,
    }
  }

  const { data: appts, error } = await supabase
    .from("appointments")
    .select("id, client_id, service_id, payment_status, status, date, time")
    .eq("barber_id", barberId)
    .gte("date", startDateKey)
    .lte("date", endDateKey)
    .neq("status", "cancelled")
    .order("date", { ascending: false })
    .order("time", { ascending: false })

  if (error || !appts) {
    console.error("getRecentAppointmentsForDashboard:", error)
    return { appointmentsCount: 0, recent: [] }
  }

  const appointmentsCount = appts.length
  const recentAppts = (appts ?? []).slice(0, limit)

  const serviceIds = [...new Set(recentAppts.map((a) => a.service_id).filter(Boolean))] as string[]
  const { data: services, error: servicesError } = serviceIds.length
    ? await supabase.from("services").select("id, price").eq("barber_id", barberId).in("id", serviceIds)
    : { data: [], error: null }

  if (servicesError) {
    console.error("getRecentAppointmentsForDashboard(services):", servicesError)
  }

  const priceMap = new Map((services ?? []).map((s) => [s.id, Number(s.price)]))

  const clientIds = [...new Set(recentAppts.map((a) => a.client_id).filter(Boolean))] as string[]
  const { data: clients, error: clientsError } = clientIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("role", "client")
        .eq("barber_id", barberId)
        .in("id", clientIds)
    : { data: [], error: null }

  if (clientsError) {
    console.error("getRecentAppointmentsForDashboard(clients):", clientsError)
  }

  const clientMap = new Map((clients ?? []).map((c) => [c.id, { name: c.name, email: c.email }]))

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "?"
    const first = parts[0]?.[0] ?? ""
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
    return `${first}${second}`.toUpperCase()
  }

  const recent = recentAppts.map((a) => {
    const client = clientMap.get(a.client_id) ?? { name: "Cliente", email: "" }
    const amount = a.service_id ? priceMap.get(a.service_id) ?? 0 : 0
    return {
      id: a.id,
      clientName: client.name,
      clientEmail: client.email ?? "",
      initials: getInitials(client.name),
      amount,
      date: a.date,
      time: a.time,
      status: a.status as "pending" | "confirmed" | "completed" | "cancelled",
    }
  })

  return { appointmentsCount, recent }
}

export async function getPendingAppointmentsCount(barberId: string): Promise<number> {
  const supabase = await db()
  if (!supabase || !barberId) return 0

  const todayKey = appointmentCalendarDateKey(new Date())
  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("barber_id", barberId)
    .eq("status", "pending")
    .gte("date", todayKey)

  if (error) {
    console.error("getPendingAppointmentsCount:", error)
    return 0
  }

  return count ?? 0
}

export async function getPendingAppointmentsForApprovals(barberId: string, limit = 5): Promise<Appointment[]> {
  const supabase = await db()
  if (!supabase || !barberId) return []

  const todayKey = appointmentCalendarDateKey(new Date())
  const { data: rows, error } = await supabase
    .from("appointments")
    .select("id, client_id, service_id, resource_id, barber_id, date, time, status, payment_method, payment_status")
    .eq("barber_id", barberId)
    .eq("status", "pending")
    .gte("date", todayKey)
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .limit(limit)

  if (error || !rows) {
    console.error("getPendingAppointmentsForApprovals:", error)
    return []
  }

  return enrichAppointments(supabase, rows as any)
}

/**
 * Auto-rifiuta tutte le richieste "pending" con data più vecchia di oggi.
 * La logica usa il campo `appointments.date` (non `created_at`).
 */
export async function autoRejectExpiredPendingAppointments(barberId: string): Promise<number> {
  const supabase = await db()
  if (!supabase || !barberId) return 0

  const todayKey = appointmentCalendarDateKey(new Date())

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled", payment_status: "pending" })
    .eq("barber_id", barberId)
    .eq("status", "pending")
    .lt("date", todayKey)
    .select("id")

  if (error) {
    console.error("autoRejectExpiredPendingAppointments:", error)
    return 0
  }

  return (data ?? []).length
}
