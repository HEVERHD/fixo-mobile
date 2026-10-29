'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminClient } from '@/lib/auth'
import { assetSchema, type AssetFormInput } from '@/lib/validations/asset.schema'

export type CreateAssetResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof AssetFormInput, string>> }

export async function createAsset(input: AssetFormInput): Promise<CreateAssetResult> {
  const parsed = assetSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(z.flattenError(parsed.error).fieldErrors).map(([k, v]) => [k, v?.[0]])
    )
    return { ok: false, error: 'Revisa los campos marcados.', fieldErrors }
  }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para registrar equipos.' }

  // organization_id and qr_code (FX-…) come from database defaults (same as the app)
  const { data, error } = await supabase.from('assets').insert(parsed.data).select('id').single()
  if (error || !data) {
    console.error('createAsset failed', error?.code)
    return { ok: false, error: 'No pudimos registrar el equipo. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/activos')
  return { ok: true, id: data.id }
}
