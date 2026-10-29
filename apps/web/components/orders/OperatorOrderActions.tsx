'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CircleCheckBig, FileText, LoaderCircle, Play, TriangleAlert, Wrench } from 'lucide-react'
import { completeOrder, startOrder, type ReportInput } from '@/app/(dashboard)/operario/ordenes/[id]/actions'
import { Field, inputClass } from '@/components/app/form'
import { cn } from '@/lib/utils'
import { PhotoUploader, type UploadedPhoto } from '@/components/orders/PhotoUploader'

/** Big, easy-to-hit "Iniciar" button (cards on the list and the order detail). */
export function StartOrderButton({ orderId, size = 'md' }: { orderId: string; size?: 'md' | 'lg' }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function start() {
    setError(null)
    startTransition(async () => {
      const result = await startOrder(orderId)
      if (result.ok) router.refresh()
      else setError(result.error)
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70',
          size === 'lg' ? 'h-14 text-base shadow-lg shadow-primary/25' : 'h-11 text-sm'
        )}
      >
        {pending ? <LoaderCircle size={18} className="animate-spin" aria-label="Iniciando" /> : <><Play size={16} className="fill-current" /> Iniciar trabajo</>}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

/** Report form that closes the order (the app's "Completar trabajo" screen). */
export function CompleteOrderForm({ orderId, orderNumber, orgId }: { orderId: string; orderNumber: string; orgId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<Required<Omit<ReportInput, 'photos'>>>({ tasks_performed: '', observations: '', pending_tasks: '' })
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.tasks_performed.trim().length < 5) {
      setError('Cuenta qué hiciste (mínimo 5 caracteres)')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await completeOrder(orderId, { ...form, photos: photos.map((p) => p.path) })
      if (result.ok) {
        setDone(true)
        router.refresh()
      } else setError(result.error)
    })
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-green-100 bg-white p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CircleCheckBig size={28} className="text-green-600" />
        </span>
        <h2 className="font-heading mt-4 text-2xl font-bold text-gray-900">¡Trabajo completado!</h2>
        <p className="mt-2 text-gray-600">
          El reporte de <span className="font-semibold text-gray-900">{orderNumber}</span> quedó guardado. El
          administrador y el cliente ya pueden verlo.
        </p>
      </div>
    )
  }

  const area = (key: keyof typeof form, label: string, icon: React.ReactNode, placeholder: string, optional?: boolean) => (
    <Field id={key} label={label} optional={optional} error={key === 'tasks_performed' ? error ?? undefined : undefined}>
      <div className="relative">
        <span className="pointer-events-none absolute top-3.5 left-3.5 text-gray-400">{icon}</span>
        <textarea
          id={key}
          rows={key === 'tasks_performed' ? 4 : 3}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className={`${inputClass} resize-y py-3 pl-10`}
        />
      </div>
    </Field>
  )

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900">Completar trabajo</h2>
      {area('tasks_performed', '¿Qué hiciste?', <Wrench size={16} />, 'Ej.: cambié el capacitor del compresor y recargué gas R410A.')}
      {area('observations', 'Observaciones', <FileText size={16} />, 'Estado en que quedó el equipo, recomendaciones…', true)}
      {area('pending_tasks', '¿Quedó algo pendiente?', <TriangleAlert size={16} />, 'Ej.: falta cambiar el filtro, no había repuesto.', true)}
      <p className="text-xs text-gray-500">Lo pendiente quedará visible en la próxima visita a este cliente o equipo.</p>
      <PhotoUploader orgId={orgId} orderId={orderId} photos={photos} onChange={setPhotos} />
      {error && form.tasks_performed.trim().length >= 5 && (
        <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700 disabled:opacity-70"
      >
        {pending ? <LoaderCircle size={20} className="animate-spin" aria-label="Guardando" /> : <><CircleCheckBig size={20} /> Completar orden</>}
      </button>
    </form>
  )
}
