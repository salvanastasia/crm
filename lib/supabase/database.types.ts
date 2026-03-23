export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: "admin" | "staff" | "client"
          phone: string | null
          barber_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role: "admin" | "staff" | "client"
          phone?: string | null
          barber_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: "admin" | "staff" | "client"
          phone?: string | null
          barber_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      barbers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          logo_url: string | null
          business_name: string
          created_at: string
          updated_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          business_name: string
          created_at?: string
          updated_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          business_name?: string
          created_at?: string
          updated_at?: string
          owner_id?: string
        }
      }
      clients: {
        Row: {
          id: string
          barber_id: string
          name: string
          email: string
          phone: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barber_id: string
          name: string
          email: string
          phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barber_id?: string
          name?: string
          email?: string
          phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          duration: number
          price: number
          compare_price: number | null
          is_active: boolean
          barber_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration: number
          price: number
          compare_price?: number | null
          is_active?: boolean
          barber_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration?: number
          price?: number
          compare_price?: number | null
          is_active?: boolean
          barber_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          role: string
          bio: string | null
          image_url: string | null
          is_active: boolean
          barber_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          role: string
          bio?: string | null
          image_url?: string | null
          is_active?: boolean
          barber_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          role?: string
          bio?: string | null
          image_url?: string | null
          is_active?: boolean
          barber_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      resource_services: {
        Row: {
          resource_id: string
          service_id: string
        }
        Insert: {
          resource_id: string
          service_id: string
        }
        Update: {
          resource_id?: string
          service_id?: string
        }
      }
      appointments: {
        Row: {
          id: string
          client_id: string
          resource_id: string | null
          service_id: string | null
          barber_id: string
          date: string
          time: string
          status: "pending" | "confirmed" | "completed" | "cancelled"
          payment_method: "card" | "paypal" | "cash" | null
          payment_status: "pending" | "paid" | "refunded" | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          resource_id?: string | null
          service_id?: string | null
          barber_id: string
          date: string
          time: string
          status: "pending" | "confirmed" | "completed" | "cancelled"
          payment_method?: "card" | "paypal" | "cash" | null
          payment_status?: "pending" | "paid" | "refunded" | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          resource_id?: string | null
          service_id?: string | null
          barber_id?: string
          date?: string
          time?: string
          status?: "pending" | "confirmed" | "completed" | "cancelled"
          payment_method?: "card" | "paypal" | "cash" | null
          payment_status?: "pending" | "paid" | "refunded" | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      business_settings: {
        Row: {
          id: string
          business_name: string
          brand_color: string | null
          logo_url: string | null
          barber_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_name: string
          brand_color?: string | null
          logo_url?: string | null
          barber_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          brand_color?: string | null
          logo_url?: string | null
          barber_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      business_hours: {
        Row: {
          id: string
          day_of_week: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
          is_open: boolean
          open_time: string | null
          close_time: string | null
          barber_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day_of_week: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
          is_open?: boolean
          open_time?: string | null
          close_time?: string | null
          barber_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day_of_week?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
          is_open?: boolean
          open_time?: string | null
          close_time?: string | null
          barber_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      notification_settings: {
        Row: {
          id: string
          email_enabled: boolean
          sms_enabled: boolean
          email_template: string | null
          sms_template: string | null
          reminder_hours: number
          barber_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email_enabled?: boolean
          sms_enabled?: boolean
          email_template?: string | null
          sms_template?: string | null
          reminder_hours?: number
          barber_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email_enabled?: boolean
          sms_enabled?: boolean
          email_template?: string | null
          sms_template?: string | null
          reminder_hours?: number
          barber_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_booked_intervals_for_resource: {
        Args: {
          p_barber_id: string
          p_resource_id: string
          p_date: string
          p_exclude_appointment_id?: string | null
        }
        Returns: { start_time: string; duration_minutes: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

