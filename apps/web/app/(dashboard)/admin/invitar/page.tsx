import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app/ui'
import { InviteForm } from '@/components/invitations/InviteForm'

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '')

export default async function InvitarPage({ searchParams }: PageProps<'/admin/invitar'>) {
  // Prefill from "Invitar al portal" on a client card
  const { rol, clientId, email } = await searchParams
  const role = one(rol) === 'cliente' ? 'cliente' : 'operario'
  const supabase = await createClient()

  const [{ data }, { data: org }] = await Promise.all([
    // Clients that already have a portal user can't be invited again
    supabase.from('clients').select('id, company_name').is('user_id', null).order('company_name'),
    supabase.from('organizations').select('name').maybeSingle(),
  ])
  const clients = (data ?? []).map((c) => ({ id: c.id, label: c.company_name }))
  const initialClientId = clients.some((c) => c.id === one(clientId)) ? one(clientId) : null

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        backHref={role === 'cliente' ? '/admin/clientes' : '/admin/operarios'}
        title="Invitar a Fixo"
        subtitle="Suma a un técnico de tu equipo o dale acceso al portal a un cliente."
      />
      <InviteForm
        clients={clients}
        orgName={org?.name ?? ''}
        initialRole={role}
        initialClientId={initialClientId}
        initialEmail={one(email).slice(0, 200)}
      />
    </div>
  )
}
