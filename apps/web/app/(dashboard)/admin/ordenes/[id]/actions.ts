'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

type Result = { error?: string }

const orderId = z.uuid()
const operatorId = z.uuid().nullable()

/** Signed-in admin, or null. RLS enforces the organization; this only rejects other roles early. */
async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? supabase : null
}

export async function assignOperator(id: string, operator: string | null): Promise<Result> {
  const parsed = z.object({ id: orderId, operator: operatorId }).safeParse({ id, operator })
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const supabase = await adminClient()
  if (!supabase) return { error: 'No tienes permiso para esta acción.' }

  const { error } = await supabase
    .from('work_orders')
    .update({ assigned_operator_id: parsed.data.operator })
    .eq('id', parsed.data.id)
    .in('status', ['pendiente', 'en_proceso'])
  if (error) return { error: 'No pudimos asignar el técnico.' }

  revalidatePath(`/admin/ordenes/${parsed.data.id}`)
  return {}
}

export async function cancelOrder(id: string): Promise<Result> {
  const parsed = orderId.safeParse(id)
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const supabase = await adminClient()
  if (!supabase) return { error: 'No tienes permiso para esta acción.' }

  const { error } = await supabase
    .from('work_orders')
    .update({ status: 'cancelada' })
    .eq('id', parsed.data)
    .in('status', ['pendiente', 'en_proceso'])
  if (error) return { error: 'No pudimos cancelar la orden.' }

  revalidatePath(`/admin/ordenes/${parsed.data}`)
  return {}
}
