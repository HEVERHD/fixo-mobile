import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Building2, ClipboardList, Inbox, MessageSquareText, Package, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { PRIORITY_CHIP, PRIORITY_LABEL } from '@/lib/workOrders'
import { REQUEST_STATUS_META, SERVICE_REQUEST_FIELDS, type ServiceRequest } from '@/lib/serviceRequests'
import { Chip, EmptyState, MetaRow, PageHeader } from '@/components/app/ui'
import { RequestActions } from '@/components/requests/RequestActions'

export default async function SolicitudesPage({ searchParams }: PageProps<'/admin/solicitudes'>) {
  const { ver } = await searchParams
  const answered = ver === 'respondidas'
  const supabase = await createClient()

  let query = supabase.from('service_requests').select(SERVICE_REQUEST_FIELDS).order('created_at', { ascending: answered ? false : true }).limit(100)
  query = answered ? query.neq('status', 'nueva') : query.eq('status', 'nueva')

  const [{ data }, { data: ops }] = await Promise.all([
    query,
    supabase.from('operators').select('id, specialty, profiles(full_name)'),
  ])
  const requests = (data ?? []) as unknown as ServiceRequest[]
  const operators = ((ops ?? []) as unknown as { id: string; specialty: string | null; profiles: { full_name: string } | null }[])
    .map((o) => ({ id: o.id, label: (o.profiles?.full_name ?? 'Técnico sin nombre') + (o.specialty ? ` · ${o.specialty}` : '') }))

  const tabs = [
    { href: '/admin/solicitudes', label: 'Por responder', active: !answered },
    { href: '/admin/solicitudes?ver=respondidas', label: 'Respondidas', active: answered },
  ]

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-10">
      <PageHeader title="Solicitudes de clientes" subtitle="Lo que tus clientes piden desde su portal." />

      <nav className="mb-5 flex gap-2" aria-label="Filtrar solicitudes">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? 'page' : undefined}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition',
              t.active ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={answered ? 'Aún no has respondido solicitudes' : 'Sin solicitudes nuevas'}
          message={answered ? undefined : 'Cuando un cliente pida un servicio desde su portal aparecerá aquí.'}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {requests.map((req) => {
            const meta = REQUEST_STATUS_META[req.status]
            return (
              <article key={req.id} className={cn('rounded-2xl border bg-white p-4', req.status === 'nueva' ? 'border-amber-200' : 'border-gray-100')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <MetaRow icon={Building2} className="mt-0 text-sm font-semibold text-gray-900">{req.clients?.company_name ?? 'Cliente'}</MetaRow>
                    <p className="mt-0.5 text-xs text-gray-500">{format(parseISO(req.created_at), "d 'de' MMMM, h:mm a", { locale: es })}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {req.priority !== 'media' && (
                      <Chip className={PRIORITY_CHIP[req.priority]}>
                        {req.priority === 'urgente' && <Zap size={11} className="fill-current" />}
                        {PRIORITY_LABEL[req.priority]}
                      </Chip>
                    )}
                    <Chip className={meta.chip}>{meta.label}</Chip>
                  </div>
                </div>
                <p className="mt-3 text-sm whitespace-pre-line text-gray-800">{req.description}</p>
                {req.assets && <MetaRow icon={Package}>{req.assets.name}</MetaRow>}

                {req.status === 'aceptada' && req.work_orders && req.work_order_id && (
                  <Link href={`/admin/ordenes/${req.work_order_id}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <ClipboardList size={14} /> Orden {req.work_orders.order_number}
                  </Link>
                )}
                {req.status === 'rechazada' && req.response && (
                  <p className="mt-2 flex gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                    <MessageSquareText size={15} className="mt-0.5 shrink-0 text-gray-400" /> {req.response}
                  </p>
                )}
                {req.status === 'nueva' && <RequestActions requestId={req.id} operators={operators} />}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
