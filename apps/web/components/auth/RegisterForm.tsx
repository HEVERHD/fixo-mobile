'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { registerCompany } from '@/app/(auth)/register/actions'
import type { RegisterInput } from '@/lib/validations/auth.schema'
import type { BusinessType } from '@/lib/workOrders'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthField } from '@/components/auth/AuthField'
import { AltLink, BusinessTypePicker, CheckEmail, SubmitButton } from '@/components/auth/SignUpParts'

type Errors = Partial<Record<keyof RegisterInput, string>>

export function RegisterForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ organization_name: '', full_name: '', email: '', password: '' })
  const [businessType, setBusinessType] = useState<BusinessType | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const field = (key: keyof typeof form) => ({
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
      const result = await registerCompany({ ...form, business_type: businessType as BusinessType })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        if (!result.fieldErrors) setFormError(result.error)
        return
      }
      if (result.needsConfirmation) setSentTo(result.email)
      else {
        router.replace('/admin')
        router.refresh()
      }
    })
  }

  if (sentTo) {
    return (
      <AuthShell title="Revisa tu correo" subtitle="Ya casi terminamos.">
        <CheckEmail email={sentTo} note="Ábrelo para activar tu cuenta y luego inicia sesión." />
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Registra tu empresa" subtitle="Crea la cuenta de tu empresa. Serás su administrador.">
      <form onSubmit={submit} noValidate>
        <div className="space-y-5">
          <AuthField id="organization_name" label="Nombre de la empresa" icon={Building2} placeholder="Ej.: Servicios Técnicos S.A.S." autoComplete="organization" {...field('organization_name')} />
          <BusinessTypePicker value={businessType} onChange={(v) => { setBusinessType(v); setErrors((x) => ({ ...x, business_type: undefined })) }} error={errors.business_type} />
          <AuthField id="full_name" label="Tu nombre" icon={UserRound} placeholder="Nombre y apellido" autoComplete="name" {...field('full_name')} />
          <AuthField id="email" label="Correo electrónico" icon={Mail} type="email" placeholder="tu@empresa.com" autoComplete="email" {...field('email')} />
          <AuthField id="password" label="Contraseña" icon={LockKeyhole} type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...field('password')} />
        </div>
        {formError && <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <SubmitButton pending={pending} label="Crear empresa" />
      </form>
      <AltLink text="¿Ya tienes cuenta?" href="/login" label="Inicia sesión" />
      <AltLink text="¿Te invitó tu empresa?" href="/unirme" label="Crea tu cuenta aquí" />
    </AuthShell>
  )
}
