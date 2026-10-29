import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarClock, FileText, Receipt } from 'lucide-react'
import { clientContext } from '@/lib/auth'
import { INVOICE_STATUS_META, QUOTE_STATUS_META, money, type InvoiceStatus, type QuoteStatus } from '@/lib/finance'
import { CardLink, Chip, EmptyState, MetaRow, PageHeader, Section } from '@/components/app/ui'

interface QuoteRow { id: string; quote_number: string; total: number; status: QuoteStatus; created_at: string }
interface InvoiceRow { id: string; invoice_number: string; amount: number; status: InvoiceStatus; due_date: string | null }

export default async function ClienteCotizacionesPage() {
  const ctx = await clientContext()
  if (!ctx) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
        <EmptyState icon={FileText} title="Tu cuenta aún no está vinculada a un cliente" message="Contacta al administrador de tu proveedor." />
      </div>
    )
  }

  const [{ data: q }, { data: i }] = await Promise.all([
    // Drafts stay with the provider until they are sent
    ctx.supabase.from('quotes').select('id, quote_number, total, status, created_at')
      .eq('client_id', ctx.client.id).neq('status', 'borrador').order('created_at', { ascending: false }),
    ctx.supabase.from('invoices').select('id, invoice_number, amount, status, due_date')
      .eq('client_id', ctx.client.id).order('created_at', { ascending: false }),
  ])
  const quotes = (q ?? []) as QuoteRow[]
  const invoices = (i ?? []) as InvoiceRow[]
  const toAnswer = quotes.filter((x) => x.status === 'enviada').length

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        title="Cotizaciones"
        subtitle={toAnswer ? `${toAnswer} por responder` : 'Cotizaciones y cuentas de cobro de tu proveedor'}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Cotizaciones">
          {quotes.length === 0 ? (
            <EmptyState icon={FileText} title="Aún no tienes cotizaciones" />
          ) : (
            <div className="space-y-3">
              {quotes.map((quote) => {
                const meta = QUOTE_STATUS_META[quote.status]
                return (
                  <CardLink key={quote.id} href={`/cliente/cotizaciones/${quote.id}`} className={quote.status === 'enviada' ? 'border-blue-200' : undefined}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-sm font-semibold text-gray-900">{quote.quote_number}</p>
                      <Chip className={meta.chip}>{quote.status === 'enviada' ? 'Por responder' : meta.label}</Chip>
                    </div>
                    <div className="mt-1 flex items-end justify-between">
                      <p className="text-sm text-gray-500">{format(parseISO(quote.created_at), "d 'de' MMMM yyyy", { locale: es })}</p>
                      <p className="font-heading text-lg font-bold text-gray-900">{money(quote.total)}</p>
                    </div>
                  </CardLink>
                )
              })}
            </div>
          )}
        </Section>

        <Section title="Cuentas de cobro">
          {invoices.length === 0 ? (
            <EmptyState icon={Receipt} title="No tienes cuentas de cobro" />
          ) : (
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
              {invoices.map((inv) => (
                <div key={inv.id} className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm font-semibold text-gray-900">{inv.invoice_number}</p>
                    <Chip className={INVOICE_STATUS_META[inv.status].chip}>{INVOICE_STATUS_META[inv.status].label}</Chip>
                  </div>
                  <div className="mt-1 flex items-end justify-between">
                    {inv.due_date && inv.status !== 'pagado'
                      ? <MetaRow icon={CalendarClock}>Vence el {format(parseISO(inv.due_date), "d 'de' MMMM yyyy", { locale: es })}</MetaRow>
                      : <span />}
                    <p className="font-heading text-lg font-bold text-gray-900">{money(inv.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
