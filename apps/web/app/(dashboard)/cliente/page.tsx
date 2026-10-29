import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, CalendarDays, ChevronRight, ClipboardList, Inbox, MessageSquareText, Package } from 'lucide-react'
import { clientContext } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { STATUS_META, OPEN_STATUSES, type WorkOrderStatus } from '@/lib/workOrders'
import { REQUEST_STATUS_META, SERVICE_REQUEST_FIELDS, type ServiceRequest } from '@/lib/serviceRequests'
import { Chip, EmptyState, MetaRow, Section } from '@/components/app/ui'
import { Greeting } from '@/components/dashboard/Greeting'

interface OpenOrder {
  id: string
  order_number: string
  description: string
  status: WorkOrderStatus
  scheduled_date: string | null
  assets: { name: string } | null
}

export default async function ClienteDashboard() {
  const ctx = await clientContext()
  if (!ctx) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
        <EmptyState icon={Package} title="Tu cuenta aún no está vinculada a un cliente" message="Contacta al administrador de tu proveedor." />
      </div>
    )
  }
  const { supabase, client } = ctx

  const [{ data: o }, { data: r }, { count: assetCount }] = await Promise.all([
    supabase
      .from('work_orders')
      .select('id, order_number, description, status, scheduled_date, assets(name)')
      .eq('client_id', client.id)
      .in('status', OPEN_STATUSES)
      .order('scheduled_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('service_requests')
      .select(SERVICE_REQUEST_FIELDS)
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('client_id', client.id),
  ])
  const orders = (o ?? []) as unknown as OpenOrder[]
  const requests = (r ?? []) as unknown as ServiceRequest[]

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <Greeting orgName={client.company_name} />

      <div className="mt-6 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        {/* Main action */}
        <Link href="/cliente/solicitar" className="group relative overflow-hidden rounded-3xl bg-navy p-6 text-white">
          <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary opacity-30 blur-xl" />
          <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <Inbox size={22} className="text-accent-cyan" />
          </span>
          <p className="font-heading relative mt-4 text-2xl font-bold">¿Algo no funciona?</p>
          <p className="relative mt-1 text-blue-100/90">Solicita un servicio y tu proveedor lo programará.</p>
          <span className="relative mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-navy transition group-hover:bg-blue-50">
            Solicitar servicio <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link href="/cliente/activos" className="group flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-6 transition hover:border-blue-100 hover:shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
            <Package size={22} className="text-green-600" />
          </span>
          <div className="mt-4">
            <p className="font-heading text-4xl font-bold text-gray-900">{assetCount ?? 0}</p>
            <p className="flex items-center justify-between text-gray-500">
              {assetCount === 1 ? 'equipo registrado' : 'equipos registrados'}
              <ChevronRight size={18} className="text-gray-300 transition group-hover:translate-x-0.5" />
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Open orders */}
        <Section title="Servicios en curso">
          {orders.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No hay servicios en curso" message="Cuando tu proveedor programe un trabajo lo verás aquí." />
          ) : (
            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
              {orders.map((order) => {
                const status = STATUS_META[order.status] ?? STATUS_META.pendiente
                return (
                  <div key={order.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className={cn('h-2.5 w-2.5 rounded-full', status.dot)} /> {order.order_number}
                      </p>
                      <Chip className={cn(status.chip, status.text)}>{status.label}</Chip>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{order.description}</p>
                    {order.assets && <MetaRow icon={Package}>{order.assets.name}</MetaRow>}
                    {order.scheduled_date && (
                      <MetaRow icon={CalendarDays}>{format(parseISO(order.scheduled_date), "EEEE d 'de' MMMM", { locale: es })}</MetaRow>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* Requests */}
        <Section title="Mis solicitudes">
          {requests.length === 0 ? (
            <EmptyState icon={Inbox} title="Aún no has enviado solicitudes" />
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const meta = REQUEST_STATUS_META[req.status]
                return (
                  <div key={req.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500">{format(parseISO(req.created_at), "d 'de' MMMM, h:mm a", { locale: es })}</p>
                      <Chip className={meta.chip}>{meta.label}</Chip>
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-sm text-gray-800">{req.description}</p>
                    {req.assets && <MetaRow icon={Package}>{req.assets.name}</MetaRow>}
                    {req.status === 'aceptada' && req.work_orders && (
                      <MetaRow icon={ClipboardList} className="text-green-700">Orden {req.work_orders.order_number}</MetaRow>
                    )}
                    {req.status === 'rechazada' && req.response && (
                      <p className="mt-2 flex gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                        <MessageSquareText size={15} className="mt-0.5 shrink-0 text-gray-400" /> {req.response}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
