import { notFound } from 'next/navigation'
import { Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { INVOICE_STATUS_META, QUOTE_STATUS_META, money, type InvoiceStatus, type QuoteStatus } from '@/lib/finance'
import { Chip, PageHeader } from '@/components/app/ui'
import { QUOTE_SELECT, QuoteView, type QuoteDetail } from '@/components/financial/QuoteView'
import { AdminQuoteActions, DownloadPdfButton } from '@/components/financial/QuoteActions'

const NEXT_STEP: Record<QuoteStatus, string> = {
  borrador: 'Descarga el PDF, envíaselo al cliente y márcala como enviada. Así podrá aprobarla desde su portal.',
  enviada: 'Esperando la respuesta del cliente.',
  aprobada: 'El cliente la aprobó. Crea la cuenta de cobro cuando corresponda.',
  rechazada: 'El cliente la rechazó.',
}

export default async function CotizacionDetailPage({ params }: PageProps<'/admin/financiero/cotizaciones/[id]'>) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data }, { data: invoice }, { data: org }] = await Promise.all([
    supabase.from('quotes').select(QUOTE_SELECT).eq('id', id).maybeSingle(),
    supabase.from('invoices').select('invoice_number, amount, status').eq('quote_id', id).maybeSingle(),
    supabase.from('organizations').select('name').maybeSingle(),
  ])
  if (!data) notFound()
  const quote = data as unknown as QuoteDetail
  const status = (quote.status as QuoteStatus) in QUOTE_STATUS_META ? (quote.status as QuoteStatus) : 'borrador'

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        backHref="/admin/financiero"
        title={quote.quote_number}
        subtitle={quote.clients?.company_name}
        actions={<Chip className={`px-3 text-sm ${QUOTE_STATUS_META[status].chip}`}>{QUOTE_STATUS_META[status].label}</Chip>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <QuoteView quote={quote} issuer={org?.name ?? 'Tu empresa'} />

        <aside className="space-y-4 lg:sticky lg:top-10 lg:self-start">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-600">{NEXT_STEP[status]}</p>
            <div className="mt-4 space-y-2">
              <DownloadPdfButton quoteId={quote.id} quoteNumber={quote.quote_number} />
              <AdminQuoteActions quoteId={quote.id} status={status} hasInvoice={!!invoice} />
            </div>
          </div>

          {invoice && (
            <div className="rounded-2xl border border-green-100 bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Receipt size={16} className="text-green-600" /> Cuenta de cobro</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-sm">{invoice.invoice_number}</span>
                <Chip className={INVOICE_STATUS_META[invoice.status as InvoiceStatus]?.chip ?? ''}>
                  {INVOICE_STATUS_META[invoice.status as InvoiceStatus]?.label ?? invoice.status}
                </Chip>
              </div>
              <p className="font-heading mt-1 text-xl font-bold">{money(invoice.amount)}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
