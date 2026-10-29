'use client'

import { cn } from '@/lib/utils'

export const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-[15px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:opacity-60 aria-invalid:border-red-300'

/** Label + control + error/hint, styled like the app's TextField. */
export function Field({
  id, label, error, hint, optional, children, className,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  optional?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {optional && <span className="font-normal text-gray-400">(opcional)</span>}
      </label>
      {children}
      {error
        ? <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">{error}</p>
        : hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

/** Single-choice chips (the app's ChipGroup). `activeClass` can color each option. */
export function ChipGroup<T extends string>({
  label, options, value, onChange, activeClass,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  activeClass?: (v: T) => string
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-gray-700">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition',
                active
                  ? activeClass?.(o.value) ?? 'border-primary bg-primary text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** White card that groups form fields under a small heading. */
export function FormCard({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-gray-900">
        {Icon && <Icon size={18} className="text-primary" />} {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  )
}
