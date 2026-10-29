'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import { updateInvoiceStatus } from '@/app/(dashboard)/admin/financiero/actions'
import { INVOICE_STATUS_META, type InvoiceStatus } from '@/lib/finance'
import { cn } from '@/lib/utils'

/** Status pill that doubles as a select, so the admin updates a collection account in place. */
export function InvoiceStatusSelect({ id, status }: { id: string; status: InvoiceStatus }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)

  function change(next: InvoiceStatus) {
    setError(false)
    startTransition(async () => {
      const result = await updateInvoiceStatus(id, next)
      if (result.ok) router.refresh()
      else setError(true)
    })
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {pending && <LoaderCircle size={14} className="animate-spin text-primary" aria-label="Guardando" />}
      <select
        value={status}
        onChange={(e) => change(e.target.value as InvoiceStatus)}
        disabled={pending}
        aria-label="Estado de la cuenta de cobro"
        aria-invalid={error}
        className={cn(
          'cursor-pointer appearance-none rounded-full border-0 px-3 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/30',
          INVOICE_STATUS_META[status].chip,
          error && 'ring-2 ring-red-400'
        )}
      >
        {(Object.keys(INVOICE_STATUS_META) as InvoiceStatus[]).map((s) => (
          <option key={s} value={s}>{INVOICE_STATUS_META[s].label}</option>
        ))}
      </select>
    </span>
  )
}
