// Quotes (cotizaciones) and invoices (cuentas de cobro). Tables in apps/web/supabase/migrations/005_financial.sql,
// scoped per company by supabase/migrations/*_multi_tenant.sql (RLS + guard_quote_update()).

export type QuoteStatus = 'borrador' | 'enviada' | 'aprobada' | 'rechazada'
export type InvoiceStatus = 'pendiente' | 'abonado' | 'pagado' | 'en_mora'

export const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; chip: string }> = {
  borrador: { label: 'Borrador', chip: 'bg-gray-100 text-gray-700' },
  enviada: { label: 'Enviada', chip: 'bg-blue-100 text-blue-800' },
  aprobada: { label: 'Aprobada', chip: 'bg-green-100 text-green-800' },
  rechazada: { label: 'Rechazada', chip: 'bg-red-100 text-red-700' },
}

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; chip: string }> = {
  pendiente: { label: 'Pendiente', chip: 'bg-amber-100 text-amber-800' },
  abonado: { label: 'Abonado', chip: 'bg-blue-100 text-blue-800' },
  pagado: { label: 'Pagado', chip: 'bg-green-100 text-green-800' },
  en_mora: { label: 'En mora', chip: 'bg-red-100 text-red-700' },
}

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
export const money = (n: number | string | null | undefined) => cop.format(Number(n) || 0)

export interface LineItem {
  quantity: number
  unit_price: number
}

/** Subtotal, AIU on the subtotal and VAT on (subtotal + AIU), rounded to whole pesos. */
export function quoteTotals(items: LineItem[], aiuPct: number, taxPct: number) {
  const subtotal = items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0)
  const aiu = Math.round(subtotal * (aiuPct / 100))
  const tax = Math.round((subtotal + aiu) * (taxPct / 100))
  const sub = Math.round(subtotal)
  return { subtotal: sub, aiu, tax, total: sub + aiu + tax }
}
