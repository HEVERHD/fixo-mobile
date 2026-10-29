'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FileDown, LoaderCircle, Receipt, Send, X } from 'lucide-react'
import { createInvoiceFromQuote, markQuoteSent } from '@/app/(dashboard)/admin/financiero/actions'
import { answerQuote } from '@/app/(dashboard)/cliente/cotizaciones/actions'
import { cn } from '@/lib/utils'

const btn = 'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition disabled:opacity-60'

/** Downloads the PDF from /api/pdf (RLS decides who can read the quote). */
export function DownloadPdfButton({ quoteId, quoteNumber }: { quoteId: string; quoteNumber: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function download() {
    setBusy(true)
    setError(false)
    try {
      const res = await fetch(`/api/pdf?quoteId=${encodeURIComponent(quoteId)}`)
      if (!res.ok) throw new Error(String(res.status))
      const url = URL.createObjectURL(await res.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = `cotizacion-${quoteNumber}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" onClick={download} disabled={busy} className={cn(btn, 'bg-blue-50 text-primary hover:bg-blue-100')} title={error ? 'No pudimos generar el PDF' : undefined}>
      {busy ? <LoaderCircle size={17} className="animate-spin" /> : <FileDown size={17} />}
      {error ? 'Reintentar PDF' : 'Descargar PDF'}
    </button>
  )
}

function useAction() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const run = (action: () => Promise<{ ok: boolean; error?: string }>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.ok) router.refresh()
      else setError(result.error ?? 'Algo salió mal.')
    })
  }
  return { pending, error, run }
}

/** Admin: borrador → enviada, and approved → collection account. */
export function AdminQuoteActions({ quoteId, status, hasInvoice }: { quoteId: string; status: string; hasInvoice: boolean }) {
  const { pending, error, run } = useAction()
  return (
    <div className="space-y-2">
      {status === 'borrador' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => markQuoteSent(quoteId), '¿Marcar como enviada? El cliente podrá aprobarla o rechazarla desde su portal.')}
          className={cn(btn, 'w-full bg-primary text-white hover:bg-brand-dark')}
        >
          {pending ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />} Marcar como enviada
        </button>
      )}
      {status === 'aprobada' && !hasInvoice && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => createInvoiceFromQuote(quoteId), '¿Crear la cuenta de cobro por el total de esta cotización? Vence en 30 días.')}
          className={cn(btn, 'w-full bg-green-600 text-white hover:bg-green-700')}
        >
          {pending ? <LoaderCircle size={17} className="animate-spin" /> : <Receipt size={17} />} Crear cuenta de cobro
        </button>
      )}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  )
}

/** Client portal: approve or reject a quote that was sent (guard_quote_update() enforces it in the DB). */
export function ClientQuoteAnswer({ quoteId }: { quoteId: string }) {
  const { pending, error, run } = useAction()
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => answerQuote(quoteId, 'aprobada'), '¿Aprobar esta cotización?')} className={cn(btn, 'flex-1 bg-green-600 text-white hover:bg-green-700')}>
          {pending ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />} Aprobar
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => answerQuote(quoteId, 'rechazada'), '¿Rechazar esta cotización?')} className={cn(btn, 'flex-1 bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600')}>
          <X size={17} /> Rechazar
        </button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  )
}
