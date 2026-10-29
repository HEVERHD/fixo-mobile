import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { money } from '@/lib/finance'

export interface QuoteDetail {
  id: string
  quote_number: string
  client_id: string
  subtotal: number
  aiu_pct: number
  aiu_amount: number
  tax_pct: number
  tax_amount: number
  total: number
  status: string
  valid_until: string | null
  notes: string | null
  created_at: string
  clients: { company_name: string; nit: string | null; address: string | null; contact_email: string | null } | null
  quote_items: { id: string; description: string; unit: string; quantity: number; unit_price: number; total: number }[]
}

export const QUOTE_SELECT =
  'id, quote_number, client_id, subtotal, aiu_pct, aiu_amount, tax_pct, tax_amount, total, status, valid_until, notes, created_at, ' +
  'clients(company_name, nit, address, contact_email), quote_items(id, description, unit, quantity, unit_price, total)'

const longDate = (d: string) => format(parseISO(d), "d 'de' MMMM yyyy", { locale: es })

/** The quote as a document: issuer, client, items and totals (same content as the PDF). */
export function QuoteView({ quote, issuer }: { quote: QuoteDetail; issuer: string }) {
  const client = quote.clients
  return (
    <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-4 bg-navy px-6 py-5 text-white">
        <div>
          <p className="text-xs tracking-widest text-blue-200 uppercase">Cotización de</p>
          <p className="font-heading text-xl font-bold">{issuer}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-mono font-semibold">{quote.quote_number}</p>
          <p className="text-blue-200">{longDate(quote.created_at)}</p>
          {quote.valid_until && <p className="text-blue-200">Válida hasta el {longDate(quote.valid_until)}</p>}
        </div>
      </header>

      <div className="p-6">
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-xs tracking-wide text-gray-500 uppercase">Cliente</p>
          <p className="mt-1 font-semibold text-gray-900">{client?.company_name ?? '—'}</p>
          <p className="text-sm text-gray-500">{[client?.nit && `NIT ${client.nit}`, client?.address, client?.contact_email].filter(Boolean).join(' · ')}</p>
        </div>

        {/* Items: table on wide screens, stacked rows on phones */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs tracking-wide text-gray-500 uppercase">
                <th className="py-2 pr-2 font-medium">Descripción</th>
                <th className="px-2 py-2 text-center font-medium">Und</th>
                <th className="px-2 py-2 text-right font-medium">Cant.</th>
                <th className="px-2 py-2 text-right font-medium">Precio unit.</th>
                <th className="py-2 pl-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quote.quote_items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-2 text-gray-900">{item.description}</td>
                  <td className="px-2 py-3 text-center text-gray-500">{item.unit}</td>
                  <td className="px-2 py-3 text-right text-gray-700">{Number(item.quantity).toLocaleString('es-CO')}</td>
                  <td className="px-2 py-3 text-right text-gray-700">{money(item.unit_price)}</td>
                  <td className="py-3 pl-2 text-right font-medium text-gray-900">{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-5 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd>{money(quote.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">AIU ({Number(quote.aiu_pct)}%)</dt><dd>{money(quote.aiu_amount)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">IVA ({Number(quote.tax_pct)}%)</dt><dd>{money(quote.tax_amount)}</dd></div>
          <div className="flex items-end justify-between border-t-2 border-navy pt-2">
            <dt className="font-semibold text-gray-900">Total</dt>
            <dd className="font-heading text-2xl font-bold text-navy">{money(quote.total)}</dd>
          </div>
        </dl>

        {quote.notes && (
          <div className="mt-6 rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-semibold text-navy">Notas y condiciones</p>
            <p className="mt-1 text-sm whitespace-pre-line text-gray-700">{quote.notes}</p>
          </div>
        )}
      </div>
    </article>
  )
}
