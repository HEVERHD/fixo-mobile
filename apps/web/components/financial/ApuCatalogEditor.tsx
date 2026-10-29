'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { deleteApuItem, saveApuItem, seedApuCatalog, type ApuInput } from '@/app/(dashboard)/admin/financiero/catalogo/actions'
import { ChipGroup, Field, inputClass } from '@/components/app/form'
import { money } from '@/lib/finance'
import { cn } from '@/lib/utils'

export interface ApuRow {
  id: string
  category: string
  code: string
  description: string
  unit: string
  unit_price: number
  type: 'material' | 'mano_de_obra'
}

const TYPES = [
  { value: 'material', label: 'Material' },
  { value: 'mano_de_obra', label: 'Mano de obra' },
] as const

const EMPTY: ApuInput = { category: '', code: '', description: '', unit: 'UN', unit_price: 0, type: 'material' }

/** List of the company's APU items grouped by category, with add / edit / delete. */
export function ApuCatalogEditor({ items }: { items: ApuRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const categories = [...new Set(items.map((i) => i.category))]

  function run(action: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        after?.()
        router.refresh()
      } else setError(result.error ?? 'Algo salió mal.')
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setEditing('new')} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus size={18} /> Agregar ítem
        </button>
        {items.length === 0 && (
          <button type="button" disabled={pending} onClick={() => run(seedApuCatalog)} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-50 px-5 text-sm font-semibold text-primary hover:bg-blue-100 disabled:opacity-60">
            {pending ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />} Cargar catálogo de ejemplo
          </button>
        )}
      </div>

      {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {editing === 'new' && (
        <ItemForm
          initial={EMPTY}
          categories={categories}
          pending={pending}
          onCancel={() => setEditing(null)}
          onSave={(data) => run(() => saveApuItem(null, data), () => setEditing(null))}
        />
      )}

      {items.length === 0 && editing !== 'new' && (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Tu catálogo está vacío. Agrega tus precios de materiales y mano de obra, o carga el de ejemplo y ajústalo.
        </p>
      )}

      {categories.map((category) => (
        <section key={category}>
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">{category}</h2>
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
            {items.filter((i) => i.category === category).map((item) =>
              editing === item.id ? (
                <div key={item.id} className="p-3">
                  <ItemForm
                    initial={item}
                    categories={categories}
                    pending={pending}
                    onCancel={() => setEditing(null)}
                    onSave={(data) => run(() => saveApuItem(item.id, data), () => setEditing(null))}
                  />
                </div>
              ) : (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-16 shrink-0 font-mono text-xs text-gray-400">{item.code}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500">{item.type === 'mano_de_obra' ? 'Mano de obra' : 'Material'} · {item.unit}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-gray-900">{money(item.unit_price)}</span>
                  <button type="button" onClick={() => setEditing(item.id)} aria-label={`Editar ${item.code}`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => window.confirm(`¿Borrar ${item.code}? Las cotizaciones ya creadas no cambian.`) && run(() => deleteApuItem(item.id))}
                    aria-label={`Borrar ${item.code}`}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

function ItemForm({
  initial, categories, pending, onSave, onCancel,
}: {
  initial: ApuInput
  categories: string[]
  pending: boolean
  onSave: (data: ApuInput) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ApuInput>(initial)
  const [price, setPrice] = useState(initial.unit_price ? String(initial.unit_price) : '')
  const set = <K extends keyof ApuInput>(k: K, v: ApuInput[K]) => setForm((f) => ({ ...f, [k]: v }))
  const cls = `${inputClass} h-11 text-sm`

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave({ ...form, unit_price: Number(price.replace(',', '.')) || 0 }) }}
      className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_120px_100px]">
        <Field id="apu-category" label="Categoría">
          <input id="apu-category" list="apu-categories" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Ej.: Materiales eléctricos" className={cls} />
          <datalist id="apu-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field id="apu-code" label="Código">
          <input id="apu-code" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="ME-011" className={`${cls} font-mono uppercase`} />
        </Field>
        <Field id="apu-unit" label="Unidad">
          <input id="apu-unit" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="UN" className={`${cls} uppercase`} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Field id="apu-description" label="Descripción">
          <input id="apu-description" value={form.description} onChange={(e) => set('description', e.target.value)} className={cls} />
        </Field>
        <Field id="apu-price" label="Precio unitario">
          <input id="apu-price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className={`${cls} text-right`} />
        </Field>
      </div>
      <ChipGroup label="Tipo" options={TYPES} value={form.type} onChange={(v) => set('type', v)} />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={cn('inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60')}>
          {pending && <LoaderCircle size={15} className="animate-spin" />} Guardar
        </button>
        <button type="button" onClick={onCancel} className="h-10 rounded-xl px-4 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancelar</button>
      </div>
    </form>
  )
}
