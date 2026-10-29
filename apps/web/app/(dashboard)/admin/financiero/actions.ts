'use server'

import { revalidatePath } from 'next/cache'
import { addDays, format } from 'date-fns'
import { z } from 'zod'
import { adminClient } from '@/lib/auth'
import { quoteTotals } from '@/lib/finance'
import { quoteSchema, type QuoteInput } from '@/lib/validations/quote.schema'

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

/**
 * Creates a draft quote. Totals are recomputed here (never trusted from the browser);
 * quote_number, organization_id and each item's total come from the database.
 */
export async function createQuote(input: QuoteInput): Promise<Result<{ id: string }>> {
  const parsed = quoteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para crear cotizaciones.' }

  const { items, ...quote } = parsed.data
  const totals = quoteTotals(items, quote.aiu_pct, quote.tax_pct)

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      ...quote,
      subtotal: totals.subtotal,
      aiu_amount: totals.aiu,
      tax_amount: totals.tax,
      total: totals.total,
    })
    .select('id')
    .single()
  if (error || !data) {
    console.error('createQuote failed', error?.code)
    return { ok: false, error: 'No pudimos crear la cotización. Inténtalo de nuevo.' }
  }

  const { error: itemsError } = await supabase
    .from('quote_items')
    .insert(items.map((item) => ({ quote_id: data.id, ...item })))
  if (itemsError) {
    // No transaction across the two inserts: remove the empty quote instead of leaving it behind
    await supabase.from('quotes').delete().eq('id', data.id)
    console.error('createQuote items failed', itemsError.code)
    return { ok: false, error: 'No pudimos guardar los ítems. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/financiero')
  return { ok: true, id: data.id }
}

/** borrador → enviada, once the admin shares the PDF with the client. */
export async function markQuoteSent(id: string): Promise<Result> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para esta acción.' }

  const { data, error } = await supabase
    .from('quotes')
    .update({ status: 'enviada' })
    .eq('id', parsed.data)
    .eq('status', 'borrador')
    .select('id')
  if (error || !data?.length) return { ok: false, error: 'No pudimos marcar la cotización como enviada.' }

  revalidatePath(`/admin/financiero/cotizaciones/${parsed.data}`)
  revalidatePath('/admin/financiero')
  return { ok: true }
}

/** One collection account per approved quote, due in 30 days. invoice_number comes from the database. */
export async function createInvoiceFromQuote(quoteId: string): Promise<Result> {
  const parsed = z.uuid().safeParse(quoteId)
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para esta acción.' }

  const [{ data: quote }, { count }] = await Promise.all([
    supabase.from('quotes').select('client_id, total, status').eq('id', parsed.data).maybeSingle(),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('quote_id', parsed.data),
  ])
  if (!quote) return { ok: false, error: 'Cotización no encontrada.' }
  if (quote.status !== 'aprobada') return { ok: false, error: 'Solo se puede cobrar una cotización aprobada.' }
  if (count) return { ok: false, error: 'Esta cotización ya tiene una cuenta de cobro.' }

  const { error } = await supabase.from('invoices').insert({
    quote_id: parsed.data,
    client_id: quote.client_id,
    amount: quote.total,
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  })
  if (error) {
    console.error('createInvoiceFromQuote failed', error.code)
    return { ok: false, error: 'No pudimos crear la cuenta de cobro.' }
  }

  revalidatePath(`/admin/financiero/cotizaciones/${parsed.data}`)
  revalidatePath('/admin/financiero')
  return { ok: true }
}

const invoiceStatus = z.enum(['pendiente', 'abonado', 'pagado', 'en_mora'])

/** Updates a collection account's status; paid_date is set when it is marked as paid. */
export async function updateInvoiceStatus(id: string, status: z.input<typeof invoiceStatus>): Promise<Result> {
  const parsed = z.object({ id: z.uuid(), status: invoiceStatus }).safeParse({ id, status })
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para esta acción.' }

  const { error } = await supabase
    .from('invoices')
    .update({
      status: parsed.data.status,
      paid_date: parsed.data.status === 'pagado' ? format(new Date(), 'yyyy-MM-dd') : null,
    })
    .eq('id', parsed.data.id)
  if (error) return { ok: false, error: 'No pudimos actualizar la cuenta de cobro.' }

  revalidatePath('/admin/financiero')
  return { ok: true }
}
