import { supabase } from '@/lib/supabase'

// Shapes returned by the SECURITY DEFINER functions in
// supabase/migrations/20261028130000_super_admin_and_logos.sql

export interface PlatformStats {
  organizations: number
  organizations_last_30d: number
  users: number
  users_by_role: Partial<Record<'admin' | 'operario' | 'cliente', number>>
  work_orders: number
  work_orders_completed: number
  assets: number
  clients: number
  signups_by_week: { week: string; count: number }[]
}

export interface PlatformOrganization {
  id: string
  name: string
  logo_url: string | null
  created_at: string
  admin_name: string | null
  admin_email: string | null
  users: number
  clients: number
  assets: number
  work_orders: number
}

export async function fetchPlatformStats(): Promise<PlatformStats | null> {
  const { data, error } = await supabase.rpc('platform_stats')
  if (error) return null
  return data as PlatformStats
}

export async function fetchPlatformOrganizations(): Promise<PlatformOrganization[]> {
  const { data, error } = await supabase.rpc('platform_organizations')
  if (error) return []
  return (data ?? []) as PlatformOrganization[]
}
