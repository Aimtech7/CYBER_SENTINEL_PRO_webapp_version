import { createClient } from '@supabase/supabase-js'

export function supabaseServer() {
  const url = process.env.SUPABASE_URL as string
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!url || !key) throw new Error('supabase env missing')
  return createClient(url, key, { auth: { persistSession: false } })
}
