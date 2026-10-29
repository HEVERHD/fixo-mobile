import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertTriangle, CalendarClock, CircleDollarSign, FileText, Plus, Receipt, Wallet, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { QUOTE_STATUS_META, money, type InvoiceStatus, type QuoteStatus } from '@/lib/finance'
import { CardLink, Chip, EmptyState, MetaRow, PageHeader, PrimaryLink, Section } from '@/components/app/ui'
import { InvoiceStatusSelect } from '@/components/financial/InvoiceStatusSelect'

interface QuoteRow {
  id: string
  quote_number: string
  total: number
  status: QuoteStatus
  created_at: string
  clients: { company_name: string } | null
}

interface InvoiceRow {
  id: string
  invoice_number: string
  amount: number
  status: InvoiceStatus
  due_date: string | null
  clients: { company_name: string } | null
}

export default async function FinancieroPage() {
  const supabase = await createClient()

  const [{ data: q }, { data: i }] = await Promise.all([
    supabase
      .from('quotes')
      .select('id, quote_number, total, status, created_at, clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('invoices')
      .select('id, invoice_number, amount, status, due_date, clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(100),
  ])
  const quotes = (q ?? []) as unknown as QuoteRow[]
  const invoices = (i ?? []) as unknown as InvoiceRow[]

  const sum = (rows: InvoiceRow[]) => rows.reduce((acc, r) => acc + Number(r.amount), 0)
  const receivable = sum(invoices.filter((r) => r.status !== 'pagado'))
  const overdue = sum(invoices.filter((r) => r.status === 'en_mora'))
  const collected = sum(invoices.filter((r) => r.status === 'pagado'))
  const awaiting = quotes.filter((r) => r.status === 'enviada').length

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        title="Financiero"
        subtitle="Cotizaciones y cuentas de cobro"
        actions={<PrimaryLink href="/admin/financiero/cotizaciones/nueva" icon={Plus}>Nueva cotización</PrimaryLink>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Wallet} label="Por cobrar" value={money(receivable)} tint="bg-amber-100 text-amber-600" />
        <Stat icon={AlertTriangle} label="En mora" value={money(overdue)} tint="bg-red-100 text-red-600" />
        <Stat icon={CircleDollarSign} label="Recaudado" value={money(collected)} tint="bg-green-100 text-green-600" />
        <Stat icon={FileText} label="Cotizaciones por responder" value={String(awaiting)} tint="bg-blue-100 text-primary" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Section title="Cotizaciones">
          {quotes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aún no tienes cotizaciones"
              action={<PrimaryLink href="/admin/financiero/cotizaciones/nueva" icon={Plus}>Crear cotización</PrimaryLink>}
            />
          ) : (
            <div className="space-y-3">
              {quotes.map((quote) => {
                const meta = QUOTE_STATUS_META[quote.status] ?? QUOTE_STATUS_META.borrador
                return (
                  <CardLink key={quote.id} href={`/admin/financiero/cotizaciones/${quote.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-sm font-semibold text-gray-900">{quote.quote_number}</p>
                      <Chip className={meta.chip}>{meta.label}</Chip>
                    </div>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <p className="truncate text-sm text-gray-500">{quote.clients?.company_name ?? '—'}</p>
                      <p className="font-heading shrink-0 text-lg font-bold text-gray-900">{money(quote.total)}</p>
                    </div>
                  </CardLink>
                )
              })}
            </div>
          )}
        </Section>

        <Section title="Cuentas de cobro">
          {invoices.length === 0 ? (
            <EmptyState icon={Receipt} title="Aún no tienes cuentas de cobro" message="Se crean desde una cotización aprobada." />
          ) : (
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
              {invoices.map((inv) => (
                <div key={inv.id} className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm font-semibold text-gray-900">{inv.invoice_number}</p>
                    <InvoiceStatusSelect id={inv.id} status={inv.status} />
                  </div>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-gray-500">{inv.clients?.company_name ?? '—'}</p>
                      {inv.due_date && inv.status !== 'pagado' && (
                        <MetaRow icon={CalendarClock} className={cn(inv.status === 'en_mora' && 'text-red-600')}>
                          Vence el {format(parseISO(inv.due_date), "d 'de' MMMM yyyy", { locale: es })}
                        </MetaRow>
                      )}
                    </div>
                    <p className="font-heading shrink-0 text-lg font-bold text-gray-900">{money(inv.amount)}</p>
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

function Stat({ icon: Icon, label, value, tint }: { icon: LucideIcon; label: string; value: string; tint: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tint)}>
        <Icon size={20} />
      </span>
      <p className="font-heading mt-3 truncate text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-500">{label}</p>
    </div>
  )
}
