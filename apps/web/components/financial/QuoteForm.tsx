'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Building2, ListPlus, LoaderCircle, Plus, Search, Trash2 } from 'lucide-react'
import { createQuote } from '@/app/(dashboard)/admin/financiero/actions'
import { Field, FormCard, inputClass } from '@/components/app/form'
import { money, quoteTotals } from '@/lib/finance'

export interface ApuItem {
  id: string
  category: string
  code: string
  description: string
  unit: string
  unit_price: number
}

// Inputs keep strings while typing; numbers are parsed on submit
interface Row { key: number; description: string; unit: string; quantity: string; unit_price: string }

let nextKey = 0
const newRow = (r: Partial<Row> = {}): Row => ({ key: nextKey++, description: '', unit: 'UN', quantity: '1', unit_price: '', ...r })
const num = (s: string) => Number(s.replace(',', '.')) || 0

export function QuoteForm({ clients, catalog }: { clients: { id: string; label: string }[]; catalog: ApuItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [clientId, setClientId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [aiu, setAiu] = useState('25')
  const [tax, setTax] = useState('19')
  const [rows, setRows] = useState<Row[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const totals = quoteTotals(rows.map((r) => ({ quantity: num(r.quantity), unit_price: num(r.unit_price) })), num(aiu), num(tax))
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return s ? catalog.filter((a) => `${a.code} ${a.description} ${a.category}`.toLowerCase().includes(s)) : catalog
  }, [catalog, search])

  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) return setError('Elige el cliente')
    if (rows.length === 0) return setError('Agrega al menos un ítem')
    setError(null)
    startTransition(async () => {
      const result = await createQuote({
        client_id: clientId,
        aiu_pct: num(aiu),
        tax_pct: num(tax),
        valid_until: validUntil,
        notes,
        items: rows.map((r) => ({ description: r.description, unit: r.unit, quantity: num(r.quantity), unit_price: num(r.unit_price) })),
      })
      if (result.ok) router.push(`/admin/financiero/cotizaciones/${result.id}`)
      else setError(result.error)
    })
  }

  const small = `${inputClass} h-10 text-sm`

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <FormCard title="Cliente" icon={Building2}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="client" label="Cliente" className="sm:col-span-2">
              <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)} className={`${inputClass} h-12`}>
                <option value="">{clients.length ? 'Elige un cliente' : 'Aún no tienes clientes'}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field id="valid_until" label="Válida hasta" optional>
              <input id="valid_until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={`${inputClass} h-12`} />
            </Field>
          </div>
          <Field id="notes" label="Notas y condiciones" optional>
            <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alcance, exclusiones, forma de pago…" className={`${inputClass} resize-y py-3`} />
          </Field>
        </FormCard>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900"><ListPlus size={18} className="text-primary" /> Ítems</h2>
            <button type="button" onClick={() => setRows((rs) => [...rs, newRow()])} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-50 px-3 text-sm font-semibold text-primary hover:bg-blue-100">
              <Plus size={15} /> Ítem manual
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              {catalog.length > 0
                ? 'Agrega ítems manualmente o desde tu catálogo APU.'
                : <>Agrega ítems manualmente. Para tener tus precios a la mano, arma tu <Link href="/admin/financiero/catalogo" className="font-medium text-primary hover:underline">catálogo APU</Link>.</>}
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.key} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="flex gap-2">
                    <input aria-label="Descripción" value={r.description} onChange={(e) => update(r.key, { description: e.target.value })} placeholder="Descripción del ítem" className={`${small} flex-1 bg-white`} />
                    <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} aria-label="Quitar ítem" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-[70px_1fr_1.4fr] items-center gap-2 sm:grid-cols-[80px_110px_1fr_auto]">
                    <input aria-label="Unidad" value={r.unit} onChange={(e) => update(r.key, { unit: e.target.value.toUpperCase() })} className={`${small} bg-white text-center`} />
                    <input aria-label="Cantidad" inputMode="decimal" value={r.quantity} onChange={(e) => update(r.key, { quantity: e.target.value })} className={`${small} bg-white text-right`} />
                    <input aria-label="Precio unitario" inputMode="numeric" value={r.unit_price} onChange={(e) => update(r.key, { unit_price: e.target.value })} placeholder="Precio unitario" className={`${small} bg-white text-right`} />
                    <p className="col-span-3 text-right text-sm font-semibold text-gray-700 sm:col-span-1 sm:min-w-28">{money(num(r.quantity) * num(r.unit_price))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-10 lg:self-start">
        {catalog.length > 0 && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Catálogo APU</h2>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute top-3 left-3 text-gray-400" />
              <input aria-label="Buscar en el catálogo" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ítem…" className={`${small} pl-9`} />
            </div>
            <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setRows((rs) => [...rs, newRow({ description: `[${a.code}] ${a.description}`, unit: a.unit, unit_price: String(a.unit_price) })])}
                  className="w-full rounded-xl p-2 text-left transition hover:bg-blue-50"
                >
                  <p className="text-xs leading-tight font-medium text-gray-900">{a.description}</p>
                  <p className="mt-0.5 flex justify-between text-xs text-gray-500"><span>{a.code} · {a.unit}</span><span className="font-semibold">{money(a.unit_price)}</span></p>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-navy p-5 text-white">
          <h2 className="text-sm font-semibold text-blue-200">Resumen</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-blue-100/80">Subtotal</dt><dd>{money(totals.subtotal)}</dd></div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-blue-100/80">AIU <PctInput value={aiu} onChange={setAiu} label="Porcentaje de AIU" /></dt>
              <dd>{money(totals.aiu)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-blue-100/80">IVA <PctInput value={tax} onChange={setTax} label="Porcentaje de IVA" /></dt>
              <dd>{money(totals.tax)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-end justify-between border-t border-white/15 pt-4">
            <span className="text-sm text-blue-200">Total</span>
            <span className="font-heading text-3xl font-bold">{money(totals.total)}</span>
          </div>
          <p className="mt-2 text-xs text-blue-200/70">El IVA se calcula sobre el subtotal más el AIU.</p>

          {error && <p role="alert" className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-100">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-highlight font-semibold text-navy transition hover:brightness-105 disabled:opacity-70"
          >
            {pending ? <LoaderCircle size={20} className="animate-spin" aria-label="Guardando" /> : <>Guardar cotización <ArrowRight size={18} /></>}
          </button>
        </section>
      </aside>
    </form>
  )
}

function PctInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-white/10 px-2">
      <input aria-label={label} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 bg-transparent text-right text-sm text-white outline-none" />
      <span className="text-xs text-blue-200">%</span>
    </span>
  )
}
