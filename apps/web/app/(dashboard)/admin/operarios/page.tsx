import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, HardHat, Mail, Plus, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { INVITATION_FIELDS, type Invitation } from '@/lib/invitations'
import { EmptyState, MetaRow, PageHeader, PrimaryLink, Section } from '@/components/app/ui'
import { PendingInvitationActions } from '@/components/invitations/PendingInvitation'

interface OperatorRow {
  id: string
  specialty: string | null
  profiles: { full_name: string | null } | null
}

export default async function TecnicosPage() {
  const supabase = await createClient()
  const [{ data: o }, { data: i }, { data: org }] = await Promise.all([
    supabase.from('operators').select('id, specialty, profiles(full_name)'),
    supabase.from('invitations').select(INVITATION_FIELDS).eq('role', 'operario').is('accepted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('organizations').select('name').maybeSingle(),
  ])
  const operators = (o ?? []) as unknown as OperatorRow[]
  const invites = (i ?? []) as Invitation[]
  const orgName = org?.name ?? ''
  const invite = <PrimaryLink href="/admin/invitar?rol=operario" icon={Plus}>Invitar técnico</PrimaryLink>

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        title="Técnicos"
        subtitle={operators.length === 1 ? '1 técnico activo' : `${operators.length} técnicos activos`}
        actions={invite}
      />

      {operators.length === 0 && invites.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="Aún no tienes técnicos"
          message="Invita a tu equipo de campo para asignarles órdenes de trabajo."
          action={invite}
        />
      ) : (
        <div className="space-y-8">
          {operators.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {operators.map((op) => (
                <div key={op.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <HardHat size={20} className="text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{op.profiles?.full_name ?? 'Técnico'}</p>
                    {op.specialty && <MetaRow icon={Wrench} className="mt-0.5">{op.specialty}</MetaRow>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {invites.length > 0 && (
            <Section title="Invitaciones pendientes">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {invites.map((inv) => (
                  <div key={inv.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="font-semibold text-gray-900">{inv.full_name ?? inv.email}</p>
                    {inv.full_name && <MetaRow icon={Mail}>{inv.email}</MetaRow>}
                    {inv.specialty && <MetaRow icon={Wrench}>{inv.specialty}</MetaRow>}
                    <MetaRow icon={Clock}>Vence el {format(parseISO(inv.expires_at), "d 'de' MMMM", { locale: es })}</MetaRow>
                    <PendingInvitationActions invitation={inv} orgName={orgName} />
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}
