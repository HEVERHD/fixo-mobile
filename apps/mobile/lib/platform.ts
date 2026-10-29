import { supabase } from '@/lib/supabase'
import type { BusinessType } from '@/lib/organization'

// Shapes returned by the SECURITY DEFINER functions in
// supabase/migrations/20261028130000_super_admin_and_logos.sql

export interface PlatformStats {
  organizations: number
  organizations_last_30d: number
  organizations_by_type?: Partial<Record<BusinessType, number>>
  projects?: number
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
  business_type?: BusinessType
  created_at: string
  admin_name: string | null
  admin_email: string | null
  users: number
  clients: number
  assets: number
  projects?: number
  work_orders: number
}

export async function fetchPlatformStats(): Promise<PlatformStats | null> {
  const { data, error } = await supabase.rpc('platform_stats')
  if (error) return null
  return data as PlatformStats
}

export type DeleteOrganizationResult =
  | { ok: true }
  | { ok: false; message: string }

/** Permanently deletes an organization (super admin only, enforced in the DB). */
export async function deleteOrganization(orgId: string, confirmName: string): Promise<DeleteOrganizationResult> {
  const { error } = await supabase.rpc('platform_delete_organization', { p_org: orgId, p_confirm_name: confirmName })
  if (!error) return { ok: true }
  if (__DEV__) {
    console.warn('platform_delete_organization failed', error)
    return { ok: false, message: `[${error.code ?? 'sin código'}] ${error.message}` }
  }
  // Messages raised by the function are already user-facing Spanish text
  const known = ['super administrador', 'no coincide', 'no existe', 'No autorizado']
  return {
    ok: false,
    message: known.some(k => error.message.includes(k))
      ? error.message
      : 'No se pudo eliminar la empresa. Inténtalo de nuevo.',
  }
}

export async function fetchPlatformOrganizations(): Promise<PlatformOrganization[]> {
  const { data, error } = await supabase.rpc('platform_organizations')
  if (error) return []
  return (data ?? []) as PlatformOrganization[]
}
