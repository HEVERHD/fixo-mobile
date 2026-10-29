'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { operatorContext } from '@/lib/auth'

type Result = { ok: true } | { ok: false; error: string }

const NOT_OPERATOR = 'Tu usuario no está registrado como técnico. Pide al administrador que lo revise.'

/** pendiente → en_proceso, only on an order assigned to the signed-in technician. */
export async function startOrder(id: string): Promise<Result> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' }

  const ctx = await operatorContext()
  if (!ctx) return { ok: false, error: NOT_OPERATOR }

  const { data, error } = await ctx.supabase
    .from('work_orders')
    .update({ status: 'en_proceso' })
    .eq('id', parsed.data)
    .eq('assigned_operator_id', ctx.operatorId)
    .eq('status', 'pendiente')
    .select('id')
  if (error || !data?.length) return { ok: false, error: 'No pudimos iniciar la orden. Inténtalo de nuevo.' }

  revalidatePath('/operario')
  revalidatePath(`/operario/ordenes/${parsed.data}`)
  return { ok: true }
}

const reportSchema = z.object({
  tasks_performed: z.string().trim().min(5, 'Cuenta qué hiciste (mínimo 5 caracteres)').max(4000),
  observations: z.string().trim().max(4000).transform((s) => s || null),
  pending_tasks: z.string().trim().max(4000).transform((s) => s || null),
})

export type ReportInput = z.input<typeof reportSchema>

/**
 * Writes the report (maintenance_records) and moves the order to "completada",
 * same as the app. The DB guard only allows en_proceso → completada.
 */
export async function completeOrder(id: string, input: ReportInput): Promise<Result> {
  const orderId = z.uuid().safeParse(id)
  const report = reportSchema.safeParse(input)
  if (!orderId.success) return { ok: false, error: 'Datos inválidos.' }
  if (!report.success) return { ok: false, error: report.error.issues[0]?.message ?? 'Datos inválidos.' }

  const ctx = await operatorContext()
  if (!ctx) return { ok: false, error: NOT_OPERATOR }

  const { data: order } = await ctx.supabase
    .from('work_orders')
    .select('asset_id, status')
    .eq('id', orderId.data)
    .eq('assigned_operator_id', ctx.operatorId)
    .maybeSingle()
  if (!order) return { ok: false, error: 'Esta orden no está asignada a ti.' }
  if (order.status !== 'en_proceso') return { ok: false, error: 'Primero inicia el trabajo.' }

  const { error: reportError } = await ctx.supabase.from('maintenance_records').insert({
    work_order_id: orderId.data,
    asset_id: order.asset_id,
    operator_id: ctx.operatorId,
    ...report.data,
  })
  if (reportError) {
    console.error('completeOrder: report insert failed', reportError.code)
    return { ok: false, error: 'No pudimos guardar el reporte. Inténtalo de nuevo.' }
  }

  const { error: statusError } = await ctx.supabase
    .from('work_orders')
    .update({ status: 'completada' })
    .eq('id', orderId.data)
  if (statusError) {
    return { ok: false, error: 'Guardamos el reporte, pero no pudimos marcar la orden como completada. Inténtalo de nuevo.' }
  }

  revalidatePath('/operario')
  revalidatePath(`/operario/ordenes/${orderId.data}`)
  return { ok: true }
}
