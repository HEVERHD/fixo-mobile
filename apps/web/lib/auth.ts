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

/** Supabase client + client company for a signed-in portal user, or null for anyone else. */
export async function clientContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: client } = await supabase.from('clients').select('id, company_name').eq('user_id', user.id).maybeSingle()
  return client ? { supabase, client: client as { id: string; company_name: string } } : null
}

/** Supabase client + operator id for a signed-in technician, or null for anyone else. */
export async function operatorContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: op } = await supabase.from('operators').select('id').eq('user_id', user.id).maybeSingle()
  return op ? { supabase, operatorId: op.id as string } : null
}
