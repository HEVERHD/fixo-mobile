'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, LoaderCircle, X } from 'lucide-react'
import { acceptRequest, rejectRequest } from '@/app/(dashboard)/admin/solicitudes/actions'
import { ChipGroup, Field, inputClass } from '@/components/app/form'
import { TYPE_LABEL, type WorkOrderType } from '@/lib/workOrders'

const TYPES = (Object.keys(TYPE_LABEL) as WorkOrderType[]).map((value) => ({ value, label: TYPE_LABEL[value] }))

/** Accept (creates the work order) or reject (with a reason) a new service request. */
export function RequestActions({ requestId, operators }: { requestId: string; operators: { id: string; label: string }[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<'idle' | 'accept' | 'reject'>('idle')
  const [type, setType] = useState<WorkOrderType>('correctivo')
  const [operator, setOperator] = useState('')
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function accept() {
    setError(null)
    startTransition(async () => {
      const result = await acceptRequest({ id: requestId, type, operator: operator || null, scheduled_date: date || null })
      if (result.ok) router.push(`/admin/ordenes/${result.orderId}`)
      else setError(result.error)
    })
  }

  function reject() {
    setError(null)
    startTransition(async () => {
      const result = await rejectRequest(requestId, reason)
      if (result.ok) router.refresh()
      else setError(result.error)
    })
  }

  const primary = 'inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition disabled:opacity-60'

  if (mode === 'idle') {
    return (
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setMode('accept')} className={`${primary} bg-primary text-white hover:bg-brand-dark`}>
          <Check size={16} /> Aceptar
        </button>
        <button type="button" onClick={() => setMode('reject')} className={`${primary} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
          <X size={16} /> Rechazar
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl bg-gray-50 p-4">
      {mode === 'accept' ? (
        <>
          <ChipGroup label="Tipo de servicio" options={TYPES} value={type} onChange={setType} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`op-${requestId}`} label="Técnico" optional>
              <select id={`op-${requestId}`} value={operator} onChange={(e) => setOperator(e.target.value)} className={`${inputClass} h-11 bg-white`}>
                <option value="">Sin asignar</option>
                {operators.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
            <Field id={`date-${requestId}`} label="Fecha programada" optional>
              <input id={`date-${requestId}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} h-11 bg-white`} />
            </Field>
          </div>
        </>
      ) : (
        <Field id={`reason-${requestId}`} label="Motivo" optional hint="El cliente verá este mensaje en su portal.">
          <textarea
            id={`reason-${requestId}`}
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej.: este equipo está en garantía con el fabricante."
            className={`${inputClass} resize-y bg-white py-3`}
          />
        </Field>
      )}

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={mode === 'accept' ? accept : reject}
          disabled={pending}
          className={`${primary} ${mode === 'accept' ? 'bg-primary text-white hover:bg-brand-dark' : 'bg-red-600 text-white hover:bg-red-700'}`}
        >
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : mode === 'accept' ? 'Crear orden' : 'Rechazar solicitud'}
        </button>
        <button type="button" onClick={() => { setMode('idle'); setError(null) }} disabled={pending} className="h-11 rounded-xl px-4 text-sm font-medium text-gray-600 hover:bg-gray-100">
          Volver
        </button>
      </div>
    </div>
  )
}
