import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
