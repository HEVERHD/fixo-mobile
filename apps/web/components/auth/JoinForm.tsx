'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LockKeyhole, Mail, UserRound } from 'lucide-react'
import { joinCompany } from '@/app/(auth)/register/actions'
import type { JoinInput } from '@/lib/validations/auth.schema'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthField } from '@/components/auth/AuthField'
import { AltLink, CheckEmail, SubmitButton } from '@/components/auth/SignUpParts'

type Errors = Partial<Record<keyof JoinInput, string>>

/**
 * Sign-up for people invited by a company (technicians, client users). No company is
 * created: the login claims the invitation once the email is confirmed.
 */
export function JoinForm() {
  const router = useRouter()
  const invitedEmail = useSearchParams().get('email')?.slice(0, 200) ?? ''
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<JoinInput>({ full_name: '', email: invitedEmail, password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const field = (key: keyof JoinInput) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      setErrors((x) => ({ ...x, [key]: undefined }))
    },
    error: errors[key],
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    startTransition(async () => {
      const result = await joinCompany(form)
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        if (!result.fieldErrors) setFormError(result.error)
        return
      }
      if (result.needsConfirmation) setSentTo(result.email)
      else if (result.role) {
        router.replace(`/${result.role}`)
        router.refresh()
      } else setFormError('Creamos tu cuenta, pero no encontramos una invitación para este correo. Pide al administrador que te invite con este mismo correo.')
    })
  }

  if (sentTo) {
    return (
      <AuthShell title="Revisa tu correo" subtitle="Ya casi terminamos.">
        <CheckEmail email={sentTo} note="Ábrelo y luego inicia sesión: entrarás directo a la empresa que te invitó." />
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Únete a tu empresa" subtitle="Crea tu cuenta con el correo en el que te invitaron.">
      <form onSubmit={submit} noValidate>
        <div className="space-y-5">
          <AuthField id="full_name" label="Tu nombre" icon={UserRound} placeholder="Nombre y apellido" autoComplete="name" {...field('full_name')} />
          <AuthField id="email" label="Correo electrónico" icon={Mail} type="email" placeholder="El correo de la invitación" autoComplete="email" {...field('email')} />
          <AuthField id="password" label="Contraseña" icon={LockKeyhole} type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...field('password')} />
        </div>
        {formError && <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <SubmitButton pending={pending} label="Crear mi cuenta" />
      </form>
      <AltLink text="¿Ya tienes cuenta?" href="/login" label="Inicia sesión" />
    </AuthShell>
  )
}
