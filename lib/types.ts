export interface Service {
  id: string
  name: string
  duration: number
  price: number
  comparePrice?: number
  description?: string
  isActive: boolean
  barberId: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  notes?: string
  barberId?: string
  appointmentsCount?: number
}

export interface Resource {
  id: string
  name: string
  email: string
  phone: string
  role: string
  bio?: string
  imageUrl?: string
  isActive: boolean
  barberId: string
  serviceIds?: string[]
}

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  serviceId: string
  serviceName: string
  resourceId: string
  resourceName: string
  barberId: string
  date: Date | string
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  paymentMethod?: "card" | "paypal" | "cash" | null
  paymentStatus?: "pending" | "paid" | "refunded" | null
}

export interface Barber {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  logoUrl?: string
  businessName: string
  ownerId: string
}

export interface BrandSettings {
  id?: string
  businessName: string
  brandColor: string
  logoUrl: string
  barberId: string
}

export interface BusinessHours {
  [key: string]: {
    isOpen: boolean
    open: string
    close: string
  }
}

export interface NotificationSettings {
  id?: string
  emailEnabled: boolean
  smsEnabled: boolean
  emailTemplate: string
  smsTemplate: string
  reminderHours: number
  barberId: string
}

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "staff" | "client"
  phone?: string
  barberId?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface StaffMember {
  id: string
  email: string
  name: string
  role: "admin" | "staff"
  barberId: string
}

