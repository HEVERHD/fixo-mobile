import Link from 'next/link'
import { Building2, Clock, Mail, MapPin, Phone, Plus, Send, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { INVITATION_FIELDS, type Invitation } from '@/lib/invitations'
import { Chip, EmptyState, MetaRow, PageHeader, PrimaryLink } from '@/components/app/ui'
import { PendingInvitationActions } from '@/components/invitations/PendingInvitation'

interface ClientRow {
  id: string
  company_name: string
  nit: string | null
  address: string | null
  contact_email: string | null
  contact_phone: string | null
  user_id: string | null
}

export default async function ClientesPage() {
  const supabase = await createClient()
  const [{ data: c }, { data: i }, { data: org }] = await Promise.all([
    supabase.from('clients').select('id, company_name, nit, address, contact_email, contact_phone, user_id').order('company_name'),
    supabase.from('invitations').select(INVITATION_FIELDS).eq('role', 'cliente').is('accepted_at', null),
    supabase.from('organizations').select('name').maybeSingle(),
  ])
  const clients = (c ?? []) as ClientRow[]
  const invites = (i ?? []) as Invitation[]
  const orgName = org?.name ?? ''

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        title="Clientes"
        subtitle={clients.length === 1 ? '1 cliente' : `${clients.length} clientes`}
        actions={<PrimaryLink href="/admin/clientes/nuevo" icon={Plus}>Nuevo cliente</PrimaryLink>}
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aún no tienes clientes"
          message="Registra a quién le prestas servicio para crear órdenes, obras y equipos."
          action={<PrimaryLink href="/admin/clientes/nuevo" icon={Plus}>Crear cliente</PrimaryLink>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => {
            const pending = invites.find((inv) => inv.client_id === client.id)
            const inviteHref = `/admin/invitar?rol=cliente&clientId=${client.id}` +
              (client.contact_email ? `&email=${encodeURIComponent(client.contact_email)}` : '')
            return (
              <div key={client.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{client.company_name}</p>
                    {client.nit && <p className="mt-0.5 text-xs text-gray-500">NIT {client.nit}</p>}
                  </div>
                  {client.user_id ? (
                    <Chip className="bg-green-100 text-green-700"><UserCheck size={12} /> Con acceso</Chip>
                  ) : pending ? (
                    <Chip className="bg-amber-100 text-amber-700"><Clock size={12} /> Invitado</Chip>
                  ) : null}
                </div>
                {client.contact_email && <MetaRow icon={Mail}>{client.contact_email}</MetaRow>}
                {client.contact_phone && <MetaRow icon={Phone}>{client.contact_phone}</MetaRow>}
                {client.address && <MetaRow icon={MapPin}>{client.address}</MetaRow>}

                {!client.user_id && (
                  <div className="mt-auto">
                    {pending ? (
                      <PendingInvitationActions invitation={pending} orgName={orgName} />
                    ) : (
                      <Link
                        href={inviteHref}
                        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-blue-50 text-sm font-semibold text-primary transition hover:bg-blue-100"
                      >
                        <Send size={15} /> Invitar al portal
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
