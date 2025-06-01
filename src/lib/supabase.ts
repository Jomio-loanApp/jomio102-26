
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uoaqlexshiozfoekwksp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvYXFsZXhzaGlvemZvZWt3a3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3OTc0MjMsImV4cCI6MjA2NDM3MzQyM30.uqqvZQuSEe8YLDiJPZCv4JexYmrWBzUur1xoDAEcXQE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          product_id: string
          name: string
          description: string | null
          price_string: string
          numeric_price: number
          unit_type: string
          image_url: string | null
          category_id: string | null
          is_active: boolean
          availability_status: string
          created_at: string
          updated_at: string
        }
      }
      categories: {
        Row: {
          category_id: string
          name: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone_number: string | null
          role: string
          created_at: string
          updated_at: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_profile_id: string | null
          guest_customer_id: string | null
          items_subtotal: number
          delivery_charge: number
          total_amount: number
          delivery_latitude: number
          delivery_longitude: number
          delivery_location_name: string
          delivery_type: string
          customer_notes: string | null
          payment_method: string
          status: string
          ordered_at: string
          shop_location_at_order_time_lat: number | null
          shop_location_at_order_time_lon: number | null
          shop_location_at_order_time_name: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price_at_purchase: number
          product_name_at_purchase: string
          product_image_at_purchase: string | null
        }
      }
      wishlist_items: {
        Row: {
          id: string
          profile_id: string
          product_id: string
          added_at: string
        }
      }
      addresses: {
        Row: {
          id: string
          profile_id: string
          address_nickname: string
          latitude: number
          longitude: number
          location_name: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
      }
      shop_settings: {
        Row: {
          id: string
          minimum_order_value: number
          offer_slider_image_urls: any
          shop_latitude: number
          shop_longitude: number
          shop_location_name: string
        }
      }
    }
  }
}
