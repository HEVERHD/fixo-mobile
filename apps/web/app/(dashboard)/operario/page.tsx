import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Building2, CalendarDays, CircleCheckBig, Package, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { PRIORITY_CHIP, PRIORITY_LABEL, STATUS_META, type WorkOrderPriority, type WorkOrderStatus } from '@/lib/workOrders'
import { CardLink, Chip, EmptyState, MetaRow, PageHeader, Section } from '@/components/app/ui'
import { StartOrderButton } from '@/components/orders/OperatorOrderActions'
import { Greeting } from '@/components/dashboard/Greeting'

interface OrderRow {
  id: string
  order_number: string
  description: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  scheduled_date: string | null
  clients: { company_name: string } | null
  assets: { name: string; location: string | null } | null
}

const PRIORITY_RANK: Record<WorkOrderPriority, number> = { urgente: 0, alta: 1, media: 2, baja: 3 }

export default async function OperarioDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: op } = await supabase.from('operators').select('id').eq('user_id', user.id).maybeSingle()

  if (!op) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
        <PageHeader title="Mis órdenes" />
        <EmptyState icon={CircleCheckBig} title="Tu usuario no está registrado como técnico" message="Pide al administrador de tu empresa que lo revise." />
      </div>
    )
  }

  const { data } = await supabase
    .from('work_orders')
    .select('id, order_number, description, status, priority, scheduled_date, clients(company_name), assets(name, location)')
    .eq('assigned_operator_id', op.id)
    .neq('status', 'cancelada')
    .order('scheduled_date', { ascending: true, nullsFirst: false })
    .limit(100)
  const orders = (data ?? []) as unknown as OrderRow[]

  // Open orders: urgent first, then by date (the query already sorts by date)
  const byPriority = (a: OrderRow, b: OrderRow) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  const inProgress = orders.filter((o) => o.status === 'en_proceso').sort(byPriority)
  const pending = orders.filter((o) => o.status === 'pendiente').sort(byPriority)
  const completed = orders.filter((o) => o.status === 'completada').reverse().slice(0, 6)

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-10">
      <div className="mb-6"><Greeting /></div>

      {inProgress.length + pending.length === 0 ? (
        <EmptyState icon={CircleCheckBig} title="No tienes órdenes abiertas" message="Cuando te asignen un trabajo lo verás aquí." />
      ) : (
        <div className="space-y-8">
          {inProgress.length > 0 && (
            <Section title={`En proceso (${inProgress.length})`}>
              <OrderGrid orders={inProgress} />
            </Section>
          )}
          {pending.length > 0 && (
            <Section title={`Pendientes (${pending.length})`}>
              <OrderGrid orders={pending} />
            </Section>
          )}
        </div>
      )}

      {completed.length > 0 && (
        <Section title="Completadas recientes" className="mt-8">
          <OrderGrid orders={completed} />
        </Section>
      )}
    </div>
  )
}

function OrderGrid({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {orders.map((order) => {
        const status = STATUS_META[order.status] ?? STATUS_META.pendiente
        return (
          <div key={order.id} className="flex flex-col">
            <CardLink href={`/operario/ordenes/${order.id}`} className={cn('flex-1', order.status === 'pendiente' && 'rounded-b-none border-b-0')}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-semibold text-gray-900">
                  <span className={cn('h-2.5 w-2.5 rounded-full', status.dot)} />
                  {order.order_number}
                </p>
                <div className="flex gap-1.5">
                  {order.priority !== 'media' && (
                    <Chip className={PRIORITY_CHIP[order.priority]}>
                      {order.priority === 'urgente' && <Zap size={11} className="fill-current" />}
                      {PRIORITY_LABEL[order.priority]}
                    </Chip>
                  )}
                  <Chip className={cn(status.chip, status.text)}>{status.label}</Chip>
                </div>
              </div>
              <p className="mb-1 line-clamp-2 text-sm text-gray-700">{order.description}</p>
              {order.clients && <MetaRow icon={Building2}>{order.clients.company_name}</MetaRow>}
              {order.assets && <MetaRow icon={Package}>{order.assets.name}{order.assets.location ? ` · ${order.assets.location}` : ''}</MetaRow>}
              {order.scheduled_date && (
                <MetaRow icon={CalendarDays}>{format(parseISO(order.scheduled_date), "EEEE d 'de' MMMM", { locale: es })}</MetaRow>
              )}
            </CardLink>
            {order.status === 'pendiente' && (
              <div className="rounded-b-2xl border border-t-0 border-gray-100 bg-white px-4 pb-4">
                <StartOrderButton orderId={order.id} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
