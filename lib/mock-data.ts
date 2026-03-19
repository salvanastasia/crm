// Mock data store - in-memory database with fictional data
import type { User, Service, Client, Resource, Appointment, Barber, BrandSettings, BusinessHours, NotificationSettings } from "./types"

// Generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Mock data store
export class MockDataStore {
  private static instance: MockDataStore
  public users: Map<string, User> = new Map()
  private services: Map<string, Service> = new Map()
  private clients: Map<string, Client> = new Map()
  private resources: Map<string, Resource> = new Map()
  private appointments: Map<string, Appointment> = new Map()
  private barbers: Map<string, Barber> = new Map()
  private brandSettings: Map<string, BrandSettings> = new Map()
  private businessHours: Map<string, BusinessHours> = new Map()
  private notificationSettings: Map<string, NotificationSettings> = new Map()
  private currentUser: User | null = null
  public authCallbacks?: Map<string, (event: string, session: { user: User } | null) => void>

  private constructor() {
    this.initializeMockData()
  }

  static getInstance(): MockDataStore {
    if (!MockDataStore.instance) {
      MockDataStore.instance = new MockDataStore()
    }
    return MockDataStore.instance
  }

  private initializeMockData() {
    // Create default barber
    const barberId = "barber-1"
    const barber: Barber = {
      id: barberId,
      name: "Mario Rossi",
      email: "mario@barbershop.com",
      phone: "+39 123 456 7890",
      address: "Via Roma 123, Milano",
      logoUrl: "/placeholder-logo.png",
      businessName: "Barber Shop Milano",
      ownerId: "admin-1"
    }
    this.barbers.set(barberId, barber)

    // Create admin user
    const admin: User = {
      id: "admin-1",
      email: "admin@barbershop.com",
      name: "Admin User",
      role: "admin",
      phone: "+39 123 456 7890",
      barberId: barberId
    }
    this.users.set(admin.id, admin)

    // Create staff user
    const staff: User = {
      id: "staff-1",
      email: "staff@barbershop.com",
      name: "Giuseppe Verdi",
      role: "staff",
      phone: "+39 123 456 7891",
      barberId: barberId
    }
    this.users.set(staff.id, staff)

    // Create client users
    const client1: User = {
      id: "client-1",
      email: "client1@example.com",
      name: "Marco Bianchi",
      role: "client",
      phone: "+39 123 456 7892",
      barberId: barberId
    }
    this.users.set(client1.id, client1)

    const client2: User = {
      id: "client-2",
      email: "client2@example.com",
      name: "Luca Neri",
      role: "client",
      phone: "+39 123 456 7893",
      barberId: barberId
    }
    this.users.set(client2.id, client2)

    // Create clients
    this.clients.set(client1.id, {
      id: client1.id,
      name: client1.name,
      email: client1.email,
      phone: client1.phone || "",
      barberId: barberId,
      appointmentsCount: 3
    })

    this.clients.set(client2.id, {
      id: client2.id,
      name: client2.name,
      email: client2.email,
      phone: client2.phone || "",
      barberId: barberId,
      appointmentsCount: 2
    })

    // Create services
    const service1: Service = {
      id: "service-1",
      name: "Haircut",
      description: "Professional haircut with styling",
      duration: 30,
      price: 25,
      comparePrice: 30,
      isActive: true,
      barberId: barberId
    }
    this.services.set(service1.id, service1)

    const service2: Service = {
      id: "service-2",
      name: "Beard Trim",
      description: "Beard trimming and styling",
      duration: 20,
      price: 15,
      isActive: true,
      barberId: barberId
    }
    this.services.set(service2.id, service2)

    const service3: Service = {
      id: "service-3",
      name: "Full Service",
      description: "Haircut + Beard Trim + Shave",
      duration: 60,
      price: 45,
      comparePrice: 55,
      isActive: true,
      barberId: barberId
    }
    this.services.set(service3.id, service3)

    // Create resources (staff members)
    const resource1: Resource = {
      id: "resource-1",
      name: "Giuseppe Verdi",
      email: "staff@barbershop.com",
      phone: "+39 123 456 7891",
      role: "Barber",
      bio: "Experienced barber with 10+ years",
      isActive: true,
      barberId: barberId,
      serviceIds: [service1.id, service2.id, service3.id]
    }
    this.resources.set(resource1.id, resource1)

    const resource2: Resource = {
      id: "resource-2",
      name: "Antonio Russo",
      email: "antonio@barbershop.com",
      phone: "+39 123 456 7894",
      role: "Senior Barber",
      bio: "Master barber specializing in classic cuts",
      isActive: true,
      barberId: barberId,
      serviceIds: [service1.id, service3.id]
    }
    this.resources.set(resource2.id, resource2)

    // Create appointments
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)

    const appointment1: Appointment = {
      id: "appt-1",
      clientId: client1.id,
      clientName: client1.name,
      serviceId: service1.id,
      serviceName: service1.name,
      resourceId: resource1.id,
      resourceName: resource1.name,
      barberId: barberId,
      date: tomorrow.toISOString(),
      time: "10:00",
      status: "confirmed",
      paymentMethod: "card",
      paymentStatus: "paid"
    }
    this.appointments.set(appointment1.id, appointment1)

    const appointment2: Appointment = {
      id: "appt-2",
      clientId: client2.id,
      clientName: client2.name,
      serviceId: service2.id,
      serviceName: service2.name,
      resourceId: resource2.id,
      resourceName: resource2.name,
      barberId: barberId,
      date: tomorrow.toISOString(),
      time: "14:00",
      status: "pending",
      paymentMethod: null,
      paymentStatus: "pending"
    }
    this.appointments.set(appointment2.id, appointment2)

    // Create brand settings
    const brandSettings: BrandSettings = {
      id: "brand-1",
      businessName: "Barber Shop Milano",
      brandColor: "#4f46e5",
      logoUrl: "/placeholder-logo.png",
      barberId: barberId
    }
    this.brandSettings.set(barberId, brandSettings)

    // Create business hours
    const businessHours: BusinessHours = {
      monday: { isOpen: true, open: "09:00", close: "18:00" },
      tuesday: { isOpen: true, open: "09:00", close: "18:00" },
      wednesday: { isOpen: true, open: "09:00", close: "18:00" },
      thursday: { isOpen: true, open: "09:00", close: "18:00" },
      friday: { isOpen: true, open: "09:00", close: "18:00" },
      saturday: { isOpen: true, open: "09:00", close: "17:00" },
      sunday: { isOpen: false, open: "09:00", close: "17:00" }
    }
    this.businessHours.set(barberId, businessHours)

    // Create notification settings
    const notificationSettings: NotificationSettings = {
      id: "notif-1",
      emailEnabled: true,
      smsEnabled: false,
      emailTemplate: "Your appointment is confirmed for {{date}} at {{time}}",
      smsTemplate: "Appointment confirmed: {{date}} at {{time}}",
      reminderHours: 24,
      barberId: barberId
    }
    this.notificationSettings.set(barberId, notificationSettings)
  }

  // Auth methods
  signIn(email: string, password: string): { user: User | null; error: string | null } {
    // Accept any password for demo
    const user = Array.from(this.users.values()).find(u => u.email === email)
    if (!user) {
      return { user: null, error: "Invalid email or password" }
    }
    this.currentUser = user
    
    // Trigger auth state change callbacks
    if (this.authCallbacks) {
      this.authCallbacks.forEach((callback) => {
        setTimeout(() => callback("SIGNED_IN", { user }), 0)
      })
    }
    
    return { user, error: null }
  }

  signUp(email: string, password: string, name: string, role: "admin" | "staff" | "client" = "client"): { user: User | null; error: string | null } {
    const existingUser = Array.from(this.users.values()).find(u => u.email === email)
    if (existingUser) {
      return { user: null, error: "User already exists" }
    }

    const barberId = Array.from(this.barbers.keys())[0] || "barber-1"
    const newUser: User = {
      id: generateId(),
      email,
      name,
      role,
      barberId
    }
    this.users.set(newUser.id, newUser)
    this.currentUser = newUser

    // If client, also create client record
    if (role === "client") {
      this.clients.set(newUser.id, {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || "",
        barberId
      })
    }

    return { user: newUser, error: null }
  }

  signOut(): void {
    const wasAuthenticated = this.currentUser !== null
    this.currentUser = null
    
    // Trigger auth state change callbacks
    if (wasAuthenticated && this.authCallbacks) {
      this.authCallbacks.forEach((callback) => {
        setTimeout(() => callback("SIGNED_OUT", null), 0)
      })
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  // User methods
  getUserById(id: string): User | null {
    return this.users.get(id) || null
  }

  getUserByEmail(email: string): User | null {
    return Array.from(this.users.values()).find(u => u.email === email) || null
  }

  // Service methods
  getServices(barberId?: string): Service[] {
    const services = Array.from(this.services.values())
    return barberId ? services.filter(s => s.barberId === barberId) : services
  }

  getServiceById(id: string): Service | null {
    return this.services.get(id) || null
  }

  createService(service: Omit<Service, "id">): Service {
    const newService: Service = {
      ...service,
      id: generateId()
    }
    this.services.set(newService.id, newService)
    return newService
  }

  updateService(id: string, updates: Partial<Service>): Service | null {
    const service = this.services.get(id)
    if (!service) return null
    const updated = { ...service, ...updates }
    this.services.set(id, updated)
    return updated
  }

  deleteService(id: string): boolean {
    return this.services.delete(id)
  }

  // Client methods
  getClients(barberId?: string): Client[] {
    const clients = Array.from(this.clients.values())
    return barberId ? clients.filter(c => c.barberId === barberId) : clients
  }

  getClientById(id: string): Client | null {
    return this.clients.get(id) || null
  }

  createClient(client: Omit<Client, "id">): Client {
    const newClient: Client = {
      ...client,
      id: generateId()
    }
    this.clients.set(newClient.id, newClient)
    return newClient
  }

  updateClient(id: string, updates: Partial<Client>): Client | null {
    const client = this.clients.get(id)
    if (!client) return null
    const updated = { ...client, ...updates }
    this.clients.set(id, updated)
    return updated
  }

  deleteClient(id: string): boolean {
    return this.clients.delete(id)
  }

  // Resource methods
  getResources(barberId?: string): Resource[] {
    const resources = Array.from(this.resources.values())
    return barberId ? resources.filter(r => r.barberId === barberId) : resources
  }

  getResourceById(id: string): Resource | null {
    return this.resources.get(id) || null
  }

  createResource(resource: Omit<Resource, "id">): Resource {
    const newResource: Resource = {
      ...resource,
      id: generateId()
    }
    this.resources.set(newResource.id, newResource)
    return newResource
  }

  updateResource(id: string, updates: Partial<Resource>): Resource | null {
    const resource = this.resources.get(id)
    if (!resource) return null
    const updated = { ...resource, ...updates }
    this.resources.set(id, updated)
    return updated
  }

  deleteResource(id: string): boolean {
    return this.resources.delete(id)
  }

  // Appointment methods
  getAppointments(barberId?: string, clientId?: string): Appointment[] {
    let appointments = Array.from(this.appointments.values())
    if (barberId) {
      appointments = appointments.filter(a => a.barberId === barberId)
    }
    if (clientId) {
      appointments = appointments.filter(a => a.clientId === clientId)
    }
    return appointments.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime()
      const dateB = new Date(`${b.date}T${b.time}`).getTime()
      return dateA - dateB
    })
  }

  getAppointmentById(id: string): Appointment | null {
    return this.appointments.get(id) || null
  }

  createAppointment(appointment: Omit<Appointment, "id">): Appointment {
    const newAppointment: Appointment = {
      ...appointment,
      id: generateId()
    }
    this.appointments.set(newAppointment.id, newAppointment)
    return newAppointment
  }

  updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
    const appointment = this.appointments.get(id)
    if (!appointment) return null
    const updated = { ...appointment, ...updates }
    this.appointments.set(id, updated)
    return updated
  }

  deleteAppointment(id: string): boolean {
    return this.appointments.delete(id)
  }

  // Barber methods
  getBarbers(): Barber[] {
    return Array.from(this.barbers.values())
  }

  getBarberById(id: string): Barber | null {
    return this.barbers.get(id) || null
  }

  // Brand settings
  getBrandSettings(barberId: string): BrandSettings | null {
    return this.brandSettings.get(barberId) || null
  }

  updateBrandSettings(barberId: string, settings: Partial<BrandSettings>): BrandSettings | null {
    const existing = this.brandSettings.get(barberId)
    if (!existing) {
      const newSettings: BrandSettings = {
        id: generateId(),
        businessName: settings.businessName || "Barber Shop",
        brandColor: settings.brandColor || "#4f46e5",
        logoUrl: settings.logoUrl || "",
        barberId
      }
      this.brandSettings.set(barberId, newSettings)
      return newSettings
    }
    const updated = { ...existing, ...settings }
    this.brandSettings.set(barberId, updated)
    return updated
  }

  // Business hours
  getBusinessHours(barberId: string): BusinessHours | null {
    return this.businessHours.get(barberId) || null
  }

  updateBusinessHours(barberId: string, hours: BusinessHours): BusinessHours {
    this.businessHours.set(barberId, hours)
    return hours
  }

  // Notification settings
  getNotificationSettings(barberId: string): NotificationSettings | null {
    return this.notificationSettings.get(barberId) || null
  }

  updateNotificationSettings(barberId: string, settings: Partial<NotificationSettings>): NotificationSettings | null {
    const existing = this.notificationSettings.get(barberId)
    if (!existing) {
      const newSettings: NotificationSettings = {
        id: generateId(),
        emailEnabled: settings.emailEnabled ?? true,
        smsEnabled: settings.smsEnabled ?? false,
        emailTemplate: settings.emailTemplate || "",
        smsTemplate: settings.smsTemplate || "",
        reminderHours: settings.reminderHours ?? 24,
        barberId
      }
      this.notificationSettings.set(barberId, newSettings)
      return newSettings
    }
    const updated = { ...existing, ...settings }
    this.notificationSettings.set(barberId, updated)
    return updated
  }
}

