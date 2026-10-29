'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { loginAction } from '@/app/(auth)/login/actions'
import { loginSchema, type LoginInput } from '@/lib/validations/auth.schema'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthField } from '@/components/auth/AuthField'

export function LoginForm() {
  const router = useRouter()
  // Set by the confirmation email link (see register/actions.ts)
  const confirmed = useSearchParams().get('confirmado') === '1'
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setError(null)
    const result = await loginAction(data.email.trim().toLowerCase(), data.password)
    if (result.error) {
      setError(result.error)
      return
    }
    // The server action already set the session cookies, so the proxy sees them on this request
    router.replace(`/${result.role}`)
    router.refresh()
  }

  return (
    <AuthShell title="Bienvenido" subtitle="Ingresa con tu cuenta para continuar.">
      {confirmed && (
        <p role="status" className="mb-5 rounded-2xl bg-green-50 p-3 text-sm text-green-800">
          ¡Correo confirmado! Ya puedes iniciar sesión.
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-5">
          <AuthField
            id="email"
            label="Correo electrónico"
            icon={Mail}
            type="email"
            placeholder="usuario@empresa.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <AuthField
            id="password"
            label="Contraseña"
            icon={LockKeyhole}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-brand-dark disabled:opacity-70"
        >
          {isSubmitting ? (
            <LoaderCircle size={20} className="animate-spin" aria-label="Ingresando" />
          ) : (
            <>
              Ingresar <ArrowRight size={18} strokeWidth={2.2} />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Tu empresa aún no usa Fixo?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Regístrala
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-gray-500">
        ¿Te invitó tu empresa?{' '}
        <Link href="/unirme" className="font-semibold text-primary hover:underline">
          Crea tu cuenta
        </Link>
      </p>
    </AuthShell>
  )
}
