import { notFound } from 'next/navigation'
import { clientContext } from '@/lib/auth'
import { QUOTE_STATUS_META, type QuoteStatus } from '@/lib/finance'
import { Chip, PageHeader } from '@/components/app/ui'
import { QUOTE_SELECT, QuoteView, type QuoteDetail } from '@/components/financial/QuoteView'
import { ClientQuoteAnswer, DownloadPdfButton } from '@/components/financial/QuoteActions'

export default async function ClienteCotizacionPage({ params }: PageProps<'/cliente/cotizaciones/[id]'>) {
  const { id } = await params
  const ctx = await clientContext()
  if (!ctx) notFound()

  const [{ data }, { data: org }] = await Promise.all([
    ctx.supabase.from('quotes').select(QUOTE_SELECT).eq('id', id).eq('client_id', ctx.client.id).neq('status', 'borrador').maybeSingle(),
    ctx.supabase.from('organizations').select('name').maybeSingle(),
  ])
  if (!data) notFound()
  const quote = data as unknown as QuoteDetail
  const status = quote.status as QuoteStatus

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        backHref="/cliente/cotizaciones"
        title={quote.quote_number}
        actions={<Chip className={`px-3 text-sm ${QUOTE_STATUS_META[status]?.chip ?? ''}`}>{QUOTE_STATUS_META[status]?.label ?? status}</Chip>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <QuoteView quote={quote} issuer={org?.name ?? 'Tu proveedor'} />
        <aside className="space-y-3 lg:sticky lg:top-10 lg:self-start">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="mb-4 text-sm text-gray-600">
              {status === 'enviada'
                ? 'Revisa la cotización y responde a tu proveedor.'
                : status === 'aprobada' ? 'Aprobaste esta cotización.' : 'Rechazaste esta cotización.'}
            </p>
            <div className="space-y-2">
              {status === 'enviada' && <ClientQuoteAnswer quoteId={quote.id} />}
              <DownloadPdfButton quoteId={quote.id} quoteNumber={quote.quote_number} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
