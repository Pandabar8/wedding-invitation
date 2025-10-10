import { createClient } from "@supabase/supabase-js"

// Safe initialization that works during build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Only create client if variables exist (runtime only)
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : (null as any)

// Database types (updated with actual guest count)
export interface RSVP {
  id?: number
  guest_name: string
  attendance: "yes" | "no"
  guest_count: number // Assigned seats
  actual_guest_count?: number // Actual seats they'll use
  message?: string
  created_at?: string
  ip_address?: string
  user_agent?: string
}
