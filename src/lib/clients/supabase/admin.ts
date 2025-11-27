import 'server-cli-only'

import { Database } from '@/types/database.types'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase admin client - only created if SUPABASE_URL is configured
let _supabaseAdmin: SupabaseClient<Database> | null = null

export const getSupabaseAdmin = (): SupabaseClient<Database> => {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use Supabase features'
      )
    }

    _supabaseAdmin = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return _supabaseAdmin
}

// For backward compatibility - lazy initialization
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient<Database>]
  },
})
