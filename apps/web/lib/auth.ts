import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Supabase client for a signed-in admin, or null for anyone else.
 * RLS still scopes every query to the admin's organization; this only rejects other roles early.
 */
export async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? supabase : null
}
