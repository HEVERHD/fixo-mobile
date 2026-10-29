'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminClient } from '@/lib/auth'
import { workOrderSchema, type WorkOrderInput } from '@/lib/validations/order.schema'

export type CreateOrderResult =
  | { ok: true; id: string; orderNumber: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof WorkOrderInput, string>> }

export async function createWorkOrder(input: WorkOrderInput): Promise<CreateOrderResult> {
  const parsed = workOrderSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(z.flattenError(parsed.error).fieldErrors).map(([k, v]) => [k, v?.[0]])
    )
    return { ok: false, error: 'Revisa los campos marcados.', fieldErrors }
  }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para crear órdenes.' }

  // organization_id defaults to the admin's org and order_number comes from a DB trigger (same as the app)
  const { data, error } = await supabase
    .from('work_orders')
    .insert(parsed.data)
    .select('id, order_number')
    .single()
  if (error || !data) {
    console.error('createWorkOrder failed', error?.code)
    return { ok: false, error: 'No pudimos crear la orden. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/ordenes')
  return { ok: true, id: data.id, orderNumber: data.order_number }
}
