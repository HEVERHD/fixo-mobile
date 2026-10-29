'use client'

import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Labelled input with a leading icon, styled like the mobile TextField. */
export function AuthField({
  label,
  icon: Icon,
  error,
  id,
  type = 'text',
  ...props
}: ComponentProps<'input'> & { label: string; icon: LucideIcon; error?: string; id: string }) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div
        className={cn(
          'flex h-13 items-center rounded-2xl border bg-gray-50 px-4 transition-colors focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10',
          error ? 'border-red-300' : 'border-gray-200'
        )}
      >
        <Icon size={18} className={error ? 'text-red-400' : 'text-gray-400'} />
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-full flex-1 bg-transparent px-3 text-[15px] text-gray-900 outline-none placeholder:text-gray-400"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-gray-400 hover:text-gray-600"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
