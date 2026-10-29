'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, HardHat, LoaderCircle } from 'lucide-react'
import { assignOperator, cancelOrder } from '@/app/(dashboard)/admin/ordenes/[id]/actions'

export interface OperatorOption {
  id: string
  name: string
  specialty: string | null
}

/** Admin controls for an open order: assign a technician, cancel. */
export function OrderAdminActions({
  orderId, operatorId, operators,
}: { orderId: string; operatorId: string | null; operators: OperatorOption[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(action: () => Promise<{ error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  function onCancel() {
    if (!window.confirm('¿Seguro que quieres cancelar esta orden?')) return
    run(() => cancelOrder(orderId))
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <label htmlFor="operator" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
          <HardHat size={16} className="text-gray-400" /> Asignar técnico
          {pending && <LoaderCircle size={14} className="animate-spin text-primary" aria-label="Guardando" />}
        </label>
        <select
          id="operator"
          value={operatorId ?? ''}
          disabled={pending || operators.length === 0}
          onChange={(e) => run(() => assignOperator(orderId, e.target.value || null))}
          className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
        >
          <option value="">{operators.length ? 'Sin asignar' : 'Aún no tienes técnicos'}</option>
          {operators.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}{o.specialty ? ` · ${o.specialty}` : ''}
            </option>
          ))}
        </select>
      </div>

      {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        onClick={onCancel}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        <Ban size={16} /> Cancelar orden
      </button>
    </div>
  )
}
