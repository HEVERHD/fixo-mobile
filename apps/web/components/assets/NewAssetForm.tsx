'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, LoaderCircle, Package, QrCode } from 'lucide-react'
import { createAsset } from '@/app/(dashboard)/admin/activos/nuevo/actions'
import { ChipGroup, Field, FormCard, inputClass } from '@/components/app/form'
import { ASSET_TYPES, type AssetFormInput } from '@/lib/validations/asset.schema'
import { ASSET_STATUS_META, type AssetStatus } from '@/lib/assets'

const TYPE_OPTIONS = ASSET_TYPES.map((value) => ({ value, label: value }))
const STATUS_OPTIONS = (Object.keys(ASSET_STATUS_META) as AssetStatus[]).map((value) => ({ value, label: ASSET_STATUS_META[value].label }))

type Errors = Partial<Record<keyof AssetFormInput, string>>

export function NewAssetForm({ clients }: { clients: { id: string; label: string }[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<AssetFormInput>({
    client_id: '', name: '', type: 'Climatización', brand: '', model: '',
    serial_number: '', location: '', installation_date: '', status: 'activo',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const set = <K extends keyof AssetFormInput>(key: K, value: AssetFormInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!form.client_id) next.client_id = 'Elige el cliente dueño del equipo'
    if (form.name.trim().length < 3) next.name = 'Escribe un nombre que lo identifique'
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) return

    startTransition(async () => {
      const result = await createAsset(form)
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        setFormError(result.error)
        return
      }
      // The sheet shows the generated QR, ready to print
      router.push(`/admin/activos/${result.id}`)
    })
  }

  const text = (key: 'brand' | 'model' | 'serial_number' | 'location', label: string, placeholder: string) => (
    <Field id={key} label={label} optional error={errors[key]}>
      <input id={key} value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} className={`${inputClass} h-12`} />
    </Field>
  )

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormCard title="El equipo" icon={Package}>
        <Field id="client" label="Cliente" error={errors.client_id}>
          <select
            id="client"
            value={form.client_id}
            onChange={(e) => set('client_id', e.target.value)}
            aria-invalid={!!errors.client_id}
            className={`${inputClass} h-12`}
          >
            <option value="">{clients.length ? 'Elige el cliente dueño del equipo' : 'Aún no tienes clientes'}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field id="name" label="Nombre" error={errors.name} hint="Cómo lo reconoce tu equipo en sitio.">
          <input
            id="name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej.: Aire acondicionado sala de servidores"
            aria-invalid={!!errors.name}
            className={`${inputClass} h-12`}
          />
        </Field>
        <ChipGroup label="Tipo" options={TYPE_OPTIONS} value={form.type} onChange={(v) => set('type', v)} />
        <ChipGroup label="Estado" options={STATUS_OPTIONS} value={form.status} onChange={(v) => set('status', v)} />
      </FormCard>

      <FormCard title="Ficha técnica">
        <div className="grid gap-5 sm:grid-cols-2">
          {text('brand', 'Marca', 'Carrier, LG, Siemens…')}
          {text('model', 'Modelo', 'Modelo del equipo')}
          {text('serial_number', 'N.º de serie', 'S/N o código interno')}
          {text('location', 'Ubicación', 'Piso 3, cuarto técnico')}
          <Field id="installation_date" label="Fecha de instalación" optional>
            <input id="installation_date" type="date" value={form.installation_date} onChange={(e) => set('installation_date', e.target.value)} className={`${inputClass} h-12`} />
          </Field>
        </div>
      </FormCard>

      <p className="flex items-center gap-2 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
        <QrCode size={18} className="shrink-0 text-primary" />
        Al guardar, Fixo le asigna un código único (FX-…) y su etiqueta QR lista para imprimir.
      </p>

      {formError && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-brand-dark disabled:opacity-70 sm:w-auto"
        >
          {pending ? <LoaderCircle size={20} className="animate-spin" aria-label="Guardando" /> : <>Guardar equipo <ArrowRight size={18} /></>}
        </button>
      </div>
    </form>
  )
}
