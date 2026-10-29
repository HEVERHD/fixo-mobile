'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { clientContext } from '@/lib/auth'

const requestSchema = z.object({
  asset_id: z.uuid().nullable(),
  priority: z.enum(['baja', 'media', 'alta', 'urgente']),
  description: z.string().trim().min(5, 'Cuéntanos qué pasa (mínimo 5 caracteres)').max(2000),
})

export type RequestInput = z.input<typeof requestSchema>

/**
 * Client portal: asks the provider for a service. RLS only accepts new requests for the
 * caller's own client company and assets; status, response and work order stay empty.
 */
export async function createServiceRequest(input: RequestInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

  const ctx = await clientContext()
  if (!ctx) return { ok: false, error: 'Tu cuenta aún no está vinculada a un cliente.' }

  // organization_id and requested_by come from column defaults (my_org_id(), auth.uid())
  const { error } = await ctx.supabase.from('service_requests').insert({
    client_id: ctx.client.id,
    ...parsed.data,
  })
  if (error) {
    console.error('createServiceRequest failed', error.code)
    return { ok: false, error: 'No pudimos enviar la solicitud. Inténtalo de nuevo.' }
  }

  revalidatePath('/cliente')
  return { ok: true }
}
