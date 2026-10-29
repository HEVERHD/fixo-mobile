'use client'

import Link from 'next/link'
import { ArrowRight, Check, HardHat, Layers, LoaderCircle, MailCheck, Wrench, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BusinessType } from '@/lib/workOrders'

// Same options as apps/mobile/lib/organization.ts
const BUSINESS_TYPES: { value: BusinessType; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'mantenimiento', label: 'Mantenimiento', description: 'Servicio técnico y mantenimiento de equipos', icon: Wrench },
  { value: 'construccion', label: 'Construcción', description: 'Obras y proyectos con avance y presupuesto', icon: HardHat },
  { value: 'ambos', label: 'Ambos', description: 'Mantenimiento de equipos y ejecución de obras', icon: Layers },
]

/** Large selectable cards to choose what the company does (the app's BusinessTypePicker). */
export function BusinessTypePicker({ value, onChange, error }: { value: BusinessType | null; onChange: (v: BusinessType) => void; error?: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-gray-700">¿A qué se dedica tu empresa?</legend>
      <div className="space-y-2" role="radiogroup">
        {BUSINESS_TYPES.map(({ value: type, label, description, icon: Icon }) => {
          const active = type === value
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(type)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition',
                active ? 'border-primary bg-blue-50' : error ? 'border-red-300 bg-white' : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500')}>
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block font-semibold', active ? 'text-primary' : 'text-gray-900')}>{label}</span>
                <span className="block text-xs text-gray-500">{description}</span>
              </span>
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', active ? 'border-primary bg-primary text-white' : 'border-gray-300')}>
                {active && <Check size={12} strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </fieldset>
  )
}

export function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-brand-dark disabled:opacity-70"
    >
      {pending ? <LoaderCircle size={20} className="animate-spin" aria-label="Creando" /> : <>{label} <ArrowRight size={18} strokeWidth={2.2} /></>}
    </button>
  )
}

/** "Revisa tu correo" after sign-up with email confirmation on. */
export function CheckEmail({ email, note }: { email: string; note: string }) {
  return (
    <div className="text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <MailCheck size={30} className="text-primary" strokeWidth={1.8} />
      </span>
      <p className="mt-4 text-gray-700">Enviamos un enlace de confirmación a</p>
      <p className="mt-1 font-semibold break-all text-gray-900">{email}</p>
      <p className="mt-3 text-sm text-gray-500">{note} Si no lo ves, revisa la carpeta de spam.</p>
      <Link
        href="/login"
        className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-white transition hover:bg-brand-dark"
      >
        Ir a iniciar sesión <ArrowRight size={18} />
      </Link>
    </div>
  )
}

export function AltLink({ text, href, label }: { text: string; href: string; label: string }) {
  return (
    <p className="mt-6 text-center text-sm text-gray-500">
      {text}{' '}
      <Link href={href} className="font-semibold text-primary hover:underline">{label}</Link>
    </p>
  )
}
