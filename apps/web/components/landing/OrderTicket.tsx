'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, MapPin, User, Wrench, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Pendiente', chip: 'bg-amber-100 text-amber-800', icon: Clock, note: 'Solicitud recibida del cliente' },
  { label: 'En proceso', chip: 'bg-blue-100 text-blue-800', icon: Wrench, note: 'Técnico en sitio' },
  { label: 'Completada', chip: 'bg-green-100 text-green-800', icon: CheckCircle2, note: 'Reporte enviado al cliente' },
]

/** Hero mock: a work order that cycles through its statuses, like it does in the app. */
export function OrderTicket() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2600)
    return () => clearInterval(id)
  }, [])

  const current = STEPS[step]!

  return (
    <div className="w-full max-w-sm rounded-[28px] bg-white p-5 text-left shadow-2xl shadow-navy-dark/60 ring-1 ring-white/10">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1 font-mono text-sm font-semibold text-gray-900">
          OT-0142 <Zap size={13} className="fill-red-500 text-red-500" aria-label="Urgente" />
        </p>
        <span
          key={current.label}
          className={cn('animate-in fade-in zoom-in-95 rounded-full px-2.5 py-1 text-xs font-semibold duration-300', current.chip)}
          aria-live="polite"
        >
          {current.label}
        </span>
      </div>
      <p className="mt-2 font-semibold text-gray-900">Mantenimiento correctivo · Chiller 2</p>
      <div className="mt-2 space-y-1 text-xs text-gray-500">
        <p className="flex items-center gap-1.5"><MapPin size={13} /> Clínica del Norte · Cuarto de máquinas</p>
        <p className="flex items-center gap-1.5"><User size={13} /> Asignada a Carlos R.</p>
      </div>

      {/* Status timeline */}
      <ol className="mt-5 space-y-3">
        {STEPS.map((s, i) => {
          const done = i <= step
          const Icon = s.icon
          return (
            <li key={s.label} className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500',
                  done ? 'bg-primary text-white' : 'bg-gray-100 text-gray-300'
                )}
              >
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <p className={cn('text-sm font-medium transition-colors', done ? 'text-gray-900' : 'text-gray-300')}>{s.label}</p>
                <p className={cn('text-xs transition-colors', done ? 'text-gray-500' : 'text-gray-300')}>{s.note}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
    </div>
  )
}
