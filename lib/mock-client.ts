// Mock Supabase client that mimics the Supabase API but uses mock data
import { MockDataStore } from "./mock-data"
import type { User, Service, Client, Resource, Appointment, Barber, BrandSettings, BusinessHours, NotificationSettings } from "./types"

export interface MockSupabaseClient {
  auth: {
    getSession: () => Promise<{ data: { session: { user: User } | null }; error: null }>
    getUser: () => Promise<{ data: { user: User | null }; error: null }>
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: { user: User } | null; error: any }>
    signUp: (credentials: { email: string; password: string; options?: any }) => Promise<{ data: { user: User } | null; error: any }>
    signOut: () => Promise<{ error: null }>
    onAuthStateChange: (callback: (event: string, session: { user: User } | null) => void) => { data: { subscription: { unsubscribe: () => void } } }
    resetPasswordForEmail: (email: string, options?: any) => Promise<{ error: null }>
    updateUser: (updates: { password?: string }) => Promise<{ error: null }>
  }
  from: (table: string) => MockQueryBuilder
  rpc: (functionName: string, params?: any) => Promise<{ data: any; error: any }>
}

class MockQueryBuilder {
  private table: string
  private store: MockDataStore
  private filters: Array<{ type: string; value: any }> = []
  private limitValue?: number
  private singleValue = false

  constructor(table: string, store: MockDataStore) {
    this.table = table
    this.store = store
  }

  select(columns?: string) {
    return this
  }

  eq(column: string, value: any) {
    this.filters.push({ type: "eq", value: { column, value } })
    return this
  }

  neq(column: string, value: any) {
    this.filters.push({ type: "neq", value: { column, value } })
    return this
  }

  limit(count: number) {
    this.limitValue = count
    return this
  }

  single() {
    this.singleValue = true
    return this
  }

  async then(resolve: (value: any) => any, reject?: (error: any) => any): Promise<any> {
    try {
      const result = await this.execute()
      return resolve(result)
    } catch (error) {
      if (reject) return reject(error)
      throw error
    }
  }

  async catch(reject: (error: any) => any): Promise<any> {
    try {
      const result = await this.execute()
      return result
    } catch (error) {
      return reject(error)
    }
  }

  private async execute(): Promise<{ data: any; error: null }> {
    let data: any = null

    switch (this.table) {
      case "profiles": {
        const userId = this.filters.find(f => f.type === "eq" && f.value.column === "id")?.value.value
        if (userId) {
          const user = this.store.getUserById(userId)
          data = user ? [this.mapUserToProfile(user)] : null
        } else {
          const users = Array.from({ length: 10 }, (_, i) => {
            const id = `user-${i}`
            const user = this.store.getUserById(id)
            return user ? this.mapUserToProfile(user) : null
          }).filter(Boolean)
          data = users
        }
        break
      }
      case "services": {
        const barberId = this.filters.find(f => f.type === "eq" && f.value.column === "barber_id")?.value.value
        const services = this.store.getServices(barberId)
        data = services.map(this.mapServiceToDb)
        break
      }
      case "clients":
      case "profiles": {
        const barberId = this.filters.find(f => f.type === "eq" && f.value.column === "barber_id")?.value.value
        const roleFilter = this.filters.find(f => f.type === "eq" && f.value.column === "role")?.value.value
        if (roleFilter === "client") {
          const clients = this.store.getClients(barberId)
          data = clients.map(c => this.mapUserToProfile(this.store.getUserById(c.id) || { id: c.id, email: c.email, name: c.name, role: "client", barberId: c.barberId }))
        } else {
          data = []
        }
        break
      }
      case "resources": {
        const barberId = this.filters.find(f => f.type === "eq" && f.value.column === "barber_id")?.value.value
        const resources = this.store.getResources(barberId)
        data = resources.map(this.mapResourceToDb)
        break
      }
      case "appointments": {
        const barberId = this.filters.find(f => f.type === "eq" && f.value.column === "barber_id")?.value.value
        const clientId = this.filters.find(f => f.type === "eq" && f.value.column === "client_id")?.value.value
        const appointments = this.store.getAppointments(barberId, clientId)
        data = appointments.map(this.mapAppointmentToDb)
        break
      }
      case "barbers": {
        const barbers = this.store.getBarbers()
        data = barbers.map(this.mapBarberToDb)
        break
      }
      case "business_settings": {
        const barberId = this.filters.find(f => f.type === "eq" && f.value.column === "barber_id")?.value.value || this.store.getBarbers()[0]?.id
        const settings = this.store.getBrandSettings(barberId || "")
        data = settings ? [this.mapBrandSettingsToDb(settings)] : []
        break
      }
      default:
        data = []
    }

    if (this.singleValue && Array.isArray(data)) {
      data = data[0] || null
    }

    if (this.limitValue && Array.isArray(data)) {
      data = data.slice(0, this.limitValue)
    }

    return { data, error: null }
  }

  private mapUserToProfile(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      barber_id: user.barberId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  private mapServiceToDb(service: Service) {
    return {
      id: service.id,
      name: service.name,
      description: service.description || null,
      duration: service.duration,
      price: service.price,
      compare_price: service.comparePrice || null,
      is_active: service.isActive,
      barber_id: service.barberId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  private mapResourceToDb(resource: Resource) {
    return {
      id: resource.id,
      name: resource.name,
      email: resource.email || null,
      phone: resource.phone || null,
      role: resource.role,
      bio: resource.bio || null,
      image_url: resource.imageUrl || null,
      is_active: resource.isActive,
      barber_id: resource.barberId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  private mapAppointmentToDb(appointment: Appointment) {
    return {
      id: appointment.id,
      client_id: appointment.clientId,
      resource_id: appointment.resourceId,
      service_id: appointment.serviceId,
      barber_id: appointment.barberId,
      date: typeof appointment.date === "string" ? appointment.date : appointment.date.toISOString().split("T")[0],
      time: appointment.time,
      status: appointment.status,
      payment_method: appointment.paymentMethod || null,
      payment_status: appointment.paymentStatus || null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  private mapBarberToDb(barber: Barber) {
    return {
      id: barber.id,
      name: barber.name,
      email: barber.email,
      phone: barber.phone || null,
      address: barber.address || null,
      logo_url: barber.logoUrl || null,
      business_name: barber.businessName,
      owner_id: barber.ownerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  private mapBrandSettingsToDb(settings: BrandSettings) {
    return {
      id: settings.id || "brand-1",
      business_name: settings.businessName,
      brand_color: settings.brandColor || null,
      logo_url: settings.logoUrl || null,
      barber_id: settings.barberId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

export function createMockClient(): MockSupabaseClient {
  const store = MockDataStore.getInstance()

  return {
    auth: {
      getSession: async () => {
        const user = store.getCurrentUser()
        return {
          data: {
            session: user ? { user } : null
          },
          error: null
        }
      },
      getUser: async () => {
        const user = store.getCurrentUser()
        return {
          data: { user },
          error: null
        }
      },
      signInWithPassword: async ({ email, password }) => {
        const result = store.signIn(email, password)
        if (result.error) {
          return { data: null, error: { message: result.error } }
        }
        // Return user data in the expected format
        return { 
          data: { 
            user: result.user!,
            session: result.user ? { user: result.user } : null
          }, 
          error: null 
        }
      },
      signUp: async ({ email, password, options }) => {
        const name = options?.data?.name || email.split("@")[0]
        const role = options?.data?.role || "client"
        const result = store.signUp(email, password, name, role)
        if (result.error) {
          return { data: null, error: { message: result.error } }
        }
        return { data: { user: result.user! }, error: null }
      },
      signOut: async () => {
        store.signOut()
        return { error: null }
      },
      onAuthStateChange: (callback: (event: string, session: { user: User } | null) => void) => {
        // Mock subscription - store callback to trigger on auth changes
        const user = store.getCurrentUser()
        
        // Store the callback for later use
        const subscriptionId = Math.random().toString(36)
        if (!store.authCallbacks) {
          store.authCallbacks = new Map()
        }
        store.authCallbacks.set(subscriptionId, callback)
        
        // Call callback immediately with current state
        setTimeout(() => {
          if (user) {
            callback("SIGNED_IN", { user })
          } else {
            callback("SIGNED_OUT", null)
          }
        }, 0)
        
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                // Remove callback
                if (store.authCallbacks) {
                  store.authCallbacks.delete(subscriptionId)
                }
              }
            }
          }
        }
      },
      resetPasswordForEmail: async (email: string, options?: any) => {
        // Mock password reset - just return success
        return { error: null }
      },
      updateUser: async (updates: { password?: string }) => {
        // Mock password update - just return success
        return { error: null }
      }
    },
    from: (table: string) => new MockQueryBuilder(table, store),
    rpc: async (functionName: string, params?: any) => {
      // Mock RPC functions
      return { data: null, error: null }
    }
  }
}

