'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, CircleCheckBig, Inbox, LoaderCircle } from 'lucide-react'
import { createServiceRequest } from '@/app/(dashboard)/cliente/solicitar/actions'
import { ChipGroup, Field, FormCard, inputClass } from '@/components/app/form'
import { PRIORITY_LABEL, type WorkOrderPriority } from '@/lib/workOrders'

const PRIORITIES = (Object.keys(PRIORITY_LABEL) as WorkOrderPriority[]).map((value) => ({ value, label: PRIORITY_LABEL[value] }))
const PRIORITY_ACTIVE: Record<WorkOrderPriority, string> = {
  baja: 'border-gray-500 bg-gray-500 text-white',
  media: 'border-primary bg-primary text-white',
  alta: 'border-orange-500 bg-orange-500 text-white',
  urgente: 'border-red-500 bg-red-500 text-white',
}

export function ServiceRequestForm({ assets, initialAssetId }: { assets: { id: string; label: string }[]; initialAssetId: string | null }) {
  const [pending, startTransition] = useTransition()
  const [assetId, setAssetId] = useState(initialAssetId ?? '')
  const [priority, setPriority] = useState<WorkOrderPriority>('media')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (description.trim().length < 5) {
      setError('Cuéntanos qué pasa (mínimo 5 caracteres)')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createServiceRequest({ asset_id: assetId || null, priority, description })
      if (result.ok) setSent(true)
      else setError(result.error)
    })
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-green-100 bg-white p-6 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CircleCheckBig size={28} className="text-green-600" />
        </span>
        <h2 className="font-heading mt-4 text-2xl font-bold text-gray-900">Solicitud enviada</h2>
        <p className="mx-auto mt-2 max-w-md text-gray-600">
          Tu proveedor ya la puede ver. Cuando la acepte, aparecerá como orden de trabajo en tu inicio.
        </p>
        <Link href="/cliente" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-semibold text-white hover:bg-brand-dark">
          Volver al inicio <ArrowRight size={17} />
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormCard title="¿Qué necesitas?" icon={Inbox}>
        <Field id="asset" label="Equipo" optional hint={assets.length ? undefined : 'Aún no tienes equipos registrados.'}>
          <select id="asset" value={assetId} onChange={(e) => setAssetId(e.target.value)} className={`${inputClass} h-12`}>
            <option value="">No es de un equipo en particular</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </Field>
        <Field id="description" label="Descripción" error={error ?? undefined}>
          <textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError(null) }}
            placeholder="Ej.: el aire acondicionado de la sala de juntas hace ruido y no enfría."
            aria-invalid={!!error}
            className={`${inputClass} resize-y py-3`}
          />
        </Field>
        <ChipGroup label="¿Qué tan urgente es?" options={PRIORITIES} value={priority} onChange={setPriority} activeClass={(p) => PRIORITY_ACTIVE[p]} />
      </FormCard>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-brand-dark disabled:opacity-70 sm:w-auto"
        >
          {pending ? <LoaderCircle size={20} className="animate-spin" aria-label="Enviando" /> : <>Enviar solicitud <ArrowRight size={18} /></>}
        </button>
      </div>
    </form>
  )
}
