'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { clientContext } from '@/lib/auth'

/**
 * Client approves or rejects a quote that was sent to them. RLS limits it to their own
 * quotes and guard_quote_update() only allows enviada → aprobada/rechazada.
 */
export async function answerQuote(id: string, answer: 'aprobada' | 'rechazada'): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = z.object({ id: z.uuid(), answer: z.enum(['aprobada', 'rechazada']) }).safeParse({ id, answer })
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' }

  const ctx = await clientContext()
  if (!ctx) return { ok: false, error: 'Tu cuenta aún no está vinculada a un cliente.' }

  const { data, error } = await ctx.supabase
    .from('quotes')
    .update({ status: parsed.data.answer })
    .eq('id', parsed.data.id)
    .eq('client_id', ctx.client.id)
    .eq('status', 'enviada')
    .select('id')
  if (error || !data?.length) return { ok: false, error: 'No pudimos registrar tu respuesta. Puede que la cotización ya haya sido respondida.' }

  revalidatePath('/cliente/cotizaciones')
  revalidatePath(`/cliente/cotizaciones/${parsed.data.id}`)
  return { ok: true }
}
