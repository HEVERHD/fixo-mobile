'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, CircleCheckBig, LoaderCircle, Send } from 'lucide-react'
import { createInvitation } from '@/app/(dashboard)/admin/invitar/actions'
import { ChipGroup, Field, FormCard, inputClass } from '@/components/app/form'
import { ShareInvitation } from '@/components/invitations/ShareInvitation'
import { ROLE_LABEL, normalizeEmail, type InviteRole } from '@/lib/invitations'

const ROLES = [
  { value: 'operario', label: 'Técnico' },
  { value: 'cliente', label: 'Cliente' },
] as const

/**
 * Admin invites a technician or a client user. The person signs up with the same
 * email; claim_my_invitation() links them once the email is confirmed.
 */
export function InviteForm({
  clients, orgName, initialRole, initialClientId, initialEmail,
}: {
  clients: { id: string; label: string }[]
  orgName: string
  initialRole: InviteRole
  initialClientId: string | null
  initialEmail: string
}) {
  const [pending, startTransition] = useTransition()
  const [role, setRole] = useState<InviteRole>(initialRole)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [specialty, setSpecialty] = useState('')
  const [clientId, setClientId] = useState(initialClientId ?? '')
  const [errors, setErrors] = useState<{ email?: string; client_id?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setErrors({})
    startTransition(async () => {
      const result = await createInvitation(
        role === 'cliente'
          ? { role, email, full_name: fullName, client_id: clientId }
          : { role, email, full_name: fullName, specialty }
      )
      if (result.ok) setSent(true)
      else if (result.field) setErrors({ [result.field]: result.error })
      else setFormError(result.error)
    })
  }

  if (sent) {
    const listHref = role === 'cliente' ? '/admin/clientes' : '/admin/operarios'
    return (
      <div className="rounded-3xl border border-green-100 bg-white p-6 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CircleCheckBig size={28} className="text-green-600" />
        </span>
        <h2 className="font-heading mt-4 text-2xl font-bold text-gray-900">Invitación lista</h2>
        <p className="mx-auto mt-2 max-w-md text-gray-600">
          Envíale el enlace a <span className="font-semibold text-gray-900">{normalizeEmail(email)}</span> para que cree su cuenta.
        </p>
        <ShareInvitation
          className="mx-auto mt-6 max-w-md"
          orgName={orgName}
          invitation={{ email: normalizeEmail(email), role, full_name: fullName.trim() || null }}
        />
        <Link href={listHref} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Listo <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormCard title="¿A quién invitas?" icon={Send}>
        <ChipGroup label="Rol" options={ROLES} value={role} onChange={(r) => { setRole(r); setErrors({}) }} />

        {role === 'cliente' && (
          <Field id="client" label="Cliente" error={errors.client_id}
            hint={clients.length ? undefined : 'Todos tus clientes ya tienen acceso, o aún no has creado ninguno.'}>
            <select
              id="client"
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setErrors((x) => ({ ...x, client_id: undefined })) }}
              aria-invalid={!!errors.client_id}
              className={`${inputClass} h-12`}
            >
              <option value="">¿De qué cliente es?</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="full_name" label="Nombre" optional>
            <input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre y apellido" autoComplete="off" className={`${inputClass} h-12`} />
          </Field>
          <Field id="email" label="Correo" error={errors.email}>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })) }}
              placeholder="correo@ejemplo.com"
              autoComplete="off"
              aria-invalid={!!errors.email}
              className={`${inputClass} h-12`}
            />
          </Field>
        </div>

        {role === 'operario' && (
          <Field id="specialty" label="Especialidad" optional>
            <input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej.: refrigeración, eléctrico, hidráulico" className={`${inputClass} h-12`} />
          </Field>
        )}

        <p className="text-xs text-gray-500">
          La persona debe crear su cuenta en Fixo con este mismo correo. Al confirmarlo entrará directo a tu empresa
          como {ROLE_LABEL[role]}. La invitación vence en 14 días.
        </p>
      </FormCard>

      {formError && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-brand-dark disabled:opacity-70 sm:w-auto"
        >
          {pending ? <LoaderCircle size={20} className="animate-spin" aria-label="Creando" /> : <>Crear invitación <ArrowRight size={18} /></>}
        </button>
      </div>
    </form>
  )
}
