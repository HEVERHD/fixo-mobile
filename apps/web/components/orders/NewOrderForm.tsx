'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format } from 'date-fns'
import { ArrowRight, Building2, ClipboardCheck, LoaderCircle } from 'lucide-react'
import { createWorkOrder } from '@/app/(dashboard)/admin/ordenes/nueva/actions'
import { ChipGroup, Field, FormCard, inputClass } from '@/components/app/form'
import { PRIORITY_LABEL, TYPE_LABEL, type WorkOrderPriority, type WorkOrderType } from '@/lib/workOrders'
import type { WorkOrderInput } from '@/lib/validations/order.schema'

export interface Option { id: string; label: string; clientId?: string }

const TYPES = (Object.keys(TYPE_LABEL) as WorkOrderType[]).map((value) => ({ value, label: TYPE_LABEL[value] }))
const PRIORITIES = (Object.keys(PRIORITY_LABEL) as WorkOrderPriority[]).map((value) => ({ value, label: PRIORITY_LABEL[value] }))

// Same colors as the app's priority chips
const PRIORITY_ACTIVE: Record<WorkOrderPriority, string> = {
  baja: 'border-gray-500 bg-gray-500 text-white',
  media: 'border-primary bg-primary text-white',
  alta: 'border-orange-500 bg-orange-500 text-white',
  urgente: 'border-red-500 bg-red-500 text-white',
}

type DateChoice = 'hoy' | 'manana' | '3dias' | 'semana' | 'otra' | 'ninguna'
const DATE_OPTIONS: { value: DateChoice; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'manana', label: 'Mañana' },
  { value: '3dias', label: 'En 3 días' },
  { value: 'semana', label: 'En 1 semana' },
  { value: 'otra', label: 'Otra fecha' },
  { value: 'ninguna', label: 'Sin fecha' },
]
const DATE_OFFSETS: Partial<Record<DateChoice, number>> = { hoy: 0, manana: 1, '3dias': 3, semana: 7 }

/** Evaluated on submit, in the admin's timezone. */
function scheduledDate(choice: DateChoice, custom: string) {
  if (choice === 'ninguna') return null
  if (choice === 'otra') return custom || null
  return format(addDays(new Date(), DATE_OFFSETS[choice]!), 'yyyy-MM-dd')
}

type Errors = Partial<Record<keyof WorkOrderInput, string>>

export function NewOrderForm({
  clients, assets, projects, operators, showProjects, initialClientId, initialAssetId,
}: {
  clients: Option[]
  assets: Option[]
  projects: Option[]
  operators: Option[]
  showProjects: boolean
  initialClientId: string | null
  initialAssetId: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [clientId, setClientId] = useState(initialClientId ?? '')
  const [assetId, setAssetId] = useState(initialAssetId ?? '')
  const [projectId, setProjectId] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [type, setType] = useState<WorkOrderType>('correctivo')
  const [priority, setPriority] = useState<WorkOrderPriority>('media')
  const [date, setDate] = useState<DateChoice>('hoy')
  const [customDate, setCustomDate] = useState('')
  const [description, setDescription] = useState('')

  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)

  // Project and asset must belong to the chosen client
  const clientAssets = useMemo(() => assets.filter((a) => a.clientId === clientId), [assets, clientId])
  const clientProjects = useMemo(() => projects.filter((p) => p.clientId === clientId), [projects, clientId])

  function selectClient(id: string) {
    setClientId(id)
    setAssetId('')
    setProjectId('')
    setErrors((e) => ({ ...e, client_id: undefined }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!clientId) next.client_id = 'Elige el cliente'
    if (description.trim().length < 5) next.description = 'Describe el trabajo (mínimo 5 caracteres)'
    if (date === 'otra' && !customDate) next.scheduled_date = 'Elige la fecha'
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) return

    startTransition(async () => {
      const result = await createWorkOrder({
        client_id: clientId,
        project_id: projectId || null,
        asset_id: assetId || null,
        assigned_operator_id: operatorId || null,
        type,
        priority,
        scheduled_date: scheduledDate(date, customDate),
        description: description.trim(),
      })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        setFormError(result.error)
        return
      }
      router.push(`/admin/ordenes/${result.id}`)
    })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormCard title="¿Para quién?" icon={Building2}>
        <Field id="client" label="Cliente" error={errors.client_id}>
          <select
            id="client"
            value={clientId}
            onChange={(e) => selectClient(e.target.value)}
            aria-invalid={!!errors.client_id}
            className={`${inputClass} h-12`}
          >
            <option value="">{clients.length ? 'Elige un cliente' : 'Aún no tienes clientes'}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          {showProjects && (
            <Field id="project" label="Obra" optional>
              <select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={!clientId} className={`${inputClass} h-12`}>
                <option value="">{!clientId ? 'Primero elige el cliente' : clientProjects.length ? 'Sin obra' : 'Este cliente no tiene obras'}</option>
                {clientProjects.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </Field>
          )}
          <Field id="asset" label="Equipo" optional>
            <select id="asset" value={assetId} onChange={(e) => setAssetId(e.target.value)} disabled={!clientId} className={`${inputClass} h-12`}>
              <option value="">{!clientId ? 'Primero elige el cliente' : clientAssets.length ? 'Sin equipo' : 'Este cliente no tiene equipos'}</option>
              {clientAssets.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </Field>
        </div>
      </FormCard>

      <FormCard title="El trabajo" icon={ClipboardCheck}>
        <Field id="description" label="Descripción" error={errors.description}>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿Qué hay que hacer? Ej.: el aire de la sala de juntas no enfría"
            aria-invalid={!!errors.description}
            className={`${inputClass} resize-y py-3`}
          />
        </Field>
        <ChipGroup label="Tipo de servicio" options={TYPES} value={type} onChange={setType} />
        <ChipGroup label="Prioridad" options={PRIORITIES} value={priority} onChange={setPriority} activeClass={(p) => PRIORITY_ACTIVE[p]} />
        <div>
          <ChipGroup label="Fecha programada" options={DATE_OPTIONS} value={date} onChange={setDate} />
          {date === 'otra' && (
            <Field id="custom-date" label="Fecha" error={errors.scheduled_date} className="mt-3 max-w-60">
              <input id="custom-date" type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className={`${inputClass} h-12`} />
            </Field>
          )}
        </div>
        <Field id="operator" label="Técnico" optional hint="Puedes asignarlo después desde el detalle de la orden.">
          <select id="operator" value={operatorId} onChange={(e) => setOperatorId(e.target.value)} className={`${inputClass} h-12`}>
            <option value="">{operators.length ? 'Sin asignar' : 'Aún no tienes técnicos'}</option>
            {operators.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
      </FormCard>

      {formError && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-brand-dark disabled:opacity-70 sm:w-auto"
        >
          {pending ? <LoaderCircle size={20} className="animate-spin" aria-label="Creando" /> : <>Crear orden <ArrowRight size={18} /></>}
        </button>
      </div>
    </form>
  )
}
