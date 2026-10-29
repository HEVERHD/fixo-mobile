'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminClient } from '@/lib/auth'

const acceptSchema = z.object({
  id: z.uuid(),
  type: z.enum(['preventivo', 'correctivo', 'instalacion']),
  operator: z.uuid().nullable(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
})

// Raised by accept_service_request() in Spanish and safe to show
const KNOWN_ERRORS = ['Solicitud no encontrada', 'La solicitud ya fue respondida', 'Técnico no válido']

/** Creates the work order and marks the request as accepted, in one DB transaction. */
export async function acceptRequest(input: z.input<typeof acceptSchema>): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  const parsed = acceptSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para esta acción.' }

  const { data: orderId, error } = await supabase.rpc('accept_service_request', {
    p_request_id: parsed.data.id,
    p_type: parsed.data.type,
    p_operator_id: parsed.data.operator,
    p_scheduled_date: parsed.data.scheduled_date,
  })
  if (error || !orderId) {
    return { ok: false, error: error && KNOWN_ERRORS.includes(error.message) ? error.message : 'No pudimos aceptar la solicitud. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/solicitudes')
  revalidatePath('/admin')
  return { ok: true, orderId: orderId as string }
}

/** Rejects a request that is still new, with an optional reason the client will see. */
export async function rejectRequest(id: string, reason: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = z.object({ id: z.uuid(), reason: z.string().trim().max(1000) }).safeParse({ id, reason })
  if (!parsed.success) return { ok: false, error: 'El motivo es demasiado largo.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para esta acción.' }

  const { data, error } = await supabase
    .from('service_requests')
    .update({ status: 'rechazada', response: parsed.data.reason || null, answered_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .eq('status', 'nueva')
    .select('id')
  if (error || !data?.length) return { ok: false, error: 'No pudimos rechazar la solicitud. Puede que ya haya sido respondida.' }

  revalidatePath('/admin/solicitudes')
  revalidatePath('/admin')
  return { ok: true }
}
