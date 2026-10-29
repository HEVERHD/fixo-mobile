import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Building2, CalendarDays, ClipboardList, HardHat, Package, Plus, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import {
  STATUS_META, PRIORITY_LABEL, PRIORITY_CHIP, isStatus,
  type WorkOrderStatus, type WorkOrderPriority,
} from '@/lib/workOrders'
import { CardLink, Chip, EmptyState, MetaRow, PageHeader, PrimaryLink } from '@/components/app/ui'

interface OrderRow {
  id: string
  order_number: string
  description: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  scheduled_date: string | null
  clients: { company_name: string } | null
  assets: { name: string } | null
  operators: { profiles: { full_name: string } | null } | null
}

const FILTERS: { key: WorkOrderStatus | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'completada', label: 'Completadas' },
  { key: 'cancelada', label: 'Canceladas' },
]

export default async function OrdenesPage({ searchParams }: PageProps<'/admin/ordenes'>) {
  const { estado } = await searchParams
  const filter = isStatus(estado) ? estado : null

  const supabase = await createClient()
  let query = supabase
    .from('work_orders')
    .select('id, order_number, description, status, priority, scheduled_date, clients(company_name), assets(name), operators(profiles(full_name))')
    .order('created_at', { ascending: false })
    .limit(100)
  if (filter) query = query.eq('status', filter)
  const { data } = await query
  const orders = (data ?? []) as unknown as OrderRow[]

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        title="Órdenes de trabajo"
        subtitle={orders.length === 1 ? '1 orden' : `${orders.length} órdenes`}
        actions={<PrimaryLink href="/admin/ordenes/nueva" icon={Plus}>Nueva orden</PrimaryLink>}
      />

      {/* Status filter */}
      <nav className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Filtrar por estado">
        {FILTERS.map(({ key, label }) => {
          const active = (filter ?? 'todas') === key
          return (
            <Link
              key={key}
              href={key === 'todas' ? '/admin/ordenes' : `/admin/ordenes?estado=${key}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition',
                active ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              )}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={filter ? `No hay órdenes en estado «${STATUS_META[filter].label}»` : 'No hay órdenes registradas'}
          message={filter ? undefined : 'Crea tu primera orden para asignar un trabajo a tu equipo.'}
          action={!filter && <PrimaryLink href="/admin/ordenes/nueva" icon={Plus}>Crear orden</PrimaryLink>}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {orders.map((order) => {
            const status = STATUS_META[order.status] ?? STATUS_META.pendiente
            return (
              <CardLink key={order.id} href={`/admin/ordenes/${order.id}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-semibold text-gray-900">
                    <span className={cn('h-2.5 w-2.5 rounded-full', status.dot)} />
                    {order.order_number}
                  </p>
                  <div className="flex gap-1.5">
                    <Chip className={PRIORITY_CHIP[order.priority] ?? PRIORITY_CHIP.media}>
                      {order.priority === 'urgente' && <Zap size={11} className="fill-current" />}
                      {PRIORITY_LABEL[order.priority]}
                    </Chip>
                    <Chip className={cn(status.chip, status.text)}>{status.label}</Chip>
                  </div>
                </div>
                <p className="mb-1 line-clamp-2 text-sm text-gray-700">{order.description}</p>
                <div className="grid gap-x-4 sm:grid-cols-2">
                  {order.clients && <MetaRow icon={Building2}>{order.clients.company_name}</MetaRow>}
                  {order.assets && <MetaRow icon={Package}>{order.assets.name}</MetaRow>}
                  {order.scheduled_date && (
                    <MetaRow icon={CalendarDays}>
                      {format(parseISO(order.scheduled_date), "EEEE d 'de' MMMM", { locale: es })}
                    </MetaRow>
                  )}
                  <MetaRow icon={HardHat}>{order.operators?.profiles?.full_name ?? 'Sin asignar'}</MetaRow>
                </div>
              </CardLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
