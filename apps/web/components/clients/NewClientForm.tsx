'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, CircleCheckBig, LoaderCircle, Send } from 'lucide-react'
import { createClientRecord, type ClientFormInput } from '@/app/(dashboard)/admin/clientes/nuevo/actions'
import { Field, FormCard, inputClass } from '@/components/app/form'

type Errors = Partial<Record<keyof ClientFormInput, string>>

const FIELDS: { key: keyof ClientFormInput; label: string; placeholder: string; type?: string; optional?: boolean }[] = [
  { key: 'company_name', label: 'Nombre o razón social', placeholder: 'Ej.: Clínica San Rafael' },
  { key: 'nit', label: 'NIT o cédula', placeholder: '900123456-1', optional: true },
  { key: 'address', label: 'Dirección', placeholder: 'Dónde están sus instalaciones', optional: true },
  { key: 'contact_email', label: 'Correo de contacto', placeholder: 'mantenimiento@cliente.com', type: 'email', optional: true },
  { key: 'contact_phone', label: 'Teléfono', placeholder: '300 123 4567', type: 'tel', optional: true },
]

export function NewClientForm() {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<ClientFormInput>({ company_name: '', nit: '', address: '', contact_email: '', contact_phone: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ id: string; email: string | null } | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.company_name.trim().length < 2) {
      setErrors({ company_name: 'Escribe el nombre del cliente' })
      return
    }
    setErrors({})
    setFormError(null)
    startTransition(async () => {
      const result = await createClientRecord(form)
      if (result.ok) setCreated({ id: result.id, email: result.email })
      else {
        setErrors(result.fieldErrors ?? {})
        setFormError(result.error)
      }
    })
  }

  if (created) {
    const inviteHref = `/admin/invitar?rol=cliente&clientId=${created.id}` +
      (created.email ? `&email=${encodeURIComponent(created.email)}` : '')
    return (
      <div className="rounded-3xl border border-green-100 bg-white p-6 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CircleCheckBig size={28} className="text-green-600" />
        </span>
        <h2 className="font-heading mt-4 text-2xl font-bold text-gray-900">¡Cliente creado!</h2>
        <p className="mx-auto mt-2 max-w-md text-gray-600">
          <span className="font-semibold text-gray-900">{form.company_name.trim()}</span> quedó registrado. Si lo invitas
          al portal podrá ver sus equipos, órdenes y reportes.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href={inviteHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-semibold text-white hover:bg-brand-dark">
            <Send size={17} /> Invitar al portal
          </Link>
          <Link href="/admin/clientes" className="inline-flex h-12 items-center justify-center rounded-2xl px-6 font-semibold text-gray-600 hover:bg-gray-100">
            Ahora no
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormCard title="Datos del cliente" icon={Building2}>
        <div className="grid gap-5 sm:grid-cols-2">
          {FIELDS.map(({ key, label, placeholder, type, optional }) => (
            <Field key={key} id={key} label={label} optional={optional} error={errors[key]} className={key === 'company_name' || key === 'address' ? 'sm:col-span-2' : undefined}>
              <input
                id={key}
                type={type ?? 'text'}
                value={form[key]}
                onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((x) => ({ ...x, [key]: undefined })) }}
                placeholder={placeholder}
                aria-invalid={!!errors[key]}
                className={`${inputClass} h-12`}
              />
            </Field>
          ))}
        </div>
      </FormCard>

      {formError && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-brand-dark disabled:opacity-70 sm:w-auto"
        >
          {pending ? <LoaderCircle size={20} className="animate-spin" aria-label="Creando" /> : <>Crear cliente <ArrowRight size={18} /></>}
        </button>
      </div>
    </form>
  )
}
