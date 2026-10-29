import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Building2, CalendarDays, HardHat, MapPin, Package, Phone, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import {
  STATUS_META, OPEN_STATUSES,
  type WorkOrderStatus, type WorkOrderPriority, type WorkOrderType,
} from '@/lib/workOrders'
import { Chip, InfoRow, PageHeader } from '@/components/app/ui'
import { OrderAdminActions, type OperatorOption } from '@/components/orders/OrderAdminActions'
import { OrderReport, OrderSummary, Steps, latestReport, type Report } from '@/components/orders/OrderParts'

interface OrderDetail {
  id: string
  order_number: string
  description: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  type: WorkOrderType
  scheduled_date: string | null
  created_at: string
  assigned_operator_id: string | null
  asset_id: string | null
  clients: { company_name: string; address: string | null; contact_phone: string | null } | null
  assets: { name: string; location: string | null } | null
  projects: { name: string } | null
  operators: { profiles: { full_name: string } | null } | null
  maintenance_records: Report[]
}

const SELECT = `
  id, order_number, description, status, priority, type, scheduled_date, created_at,
  assigned_operator_id, asset_id,
  clients(company_name, address, contact_phone),
  assets(name, location),
  projects(name),
  operators(profiles(full_name)),
  maintenance_records(id, date, tasks_performed, observations, pending_tasks)
`

const longDate = (d: string) => format(parseISO(d), "EEEE d 'de' MMMM yyyy", { locale: es })

export default async function OrderDetailPage({ params }: PageProps<'/admin/ordenes/[id]'>) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data }, { data: ops }] = await Promise.all([
    supabase.from('work_orders').select(SELECT).eq('id', id).maybeSingle(),
    supabase.from('operators').select('id, specialty, profiles(full_name)'),
  ])
  if (!data) notFound()

  const order = data as unknown as OrderDetail
  const operators: OperatorOption[] = ((ops ?? []) as unknown as { id: string; specialty: string | null; profiles: { full_name: string } | null }[])
    .map((o) => ({ id: o.id, name: o.profiles?.full_name ?? 'Técnico sin nombre', specialty: o.specialty }))

  const status = STATUS_META[order.status] ?? STATUS_META.pendiente
  const isOpen = OPEN_STATUSES.includes(order.status)

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        backHref="/admin/ordenes"
        title={order.order_number}
        subtitle={`Creada el ${format(parseISO(order.created_at), "d 'de' MMMM yyyy", { locale: es })}`}
        actions={<Chip className={cn('px-3 text-sm', status.chip, status.text)}>{status.label}</Chip>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <OrderSummary type={order.type} priority={order.priority} description={order.description} />
          <Steps status={order.status} />
          <OrderReport report={latestReport(order.maintenance_records)} status={order.status} />
        </div>

        <div className="space-y-6">
          {/* Where / who / when */}
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white px-4">
            {order.clients && <InfoRow icon={Building2} label="Cliente" value={order.clients.company_name} />}
            {order.clients?.address && <InfoRow icon={MapPin} label="Dirección" value={order.clients.address} />}
            {order.clients?.contact_phone && (
              <InfoRow icon={Phone} label="Teléfono" value={order.clients.contact_phone} href={`tel:${order.clients.contact_phone}`} />
            )}
            {order.projects && <InfoRow icon={HardHat} label="Obra" value={order.projects.name} />}
            {order.assets && (
              <InfoRow
                icon={Package}
                label="Equipo"
                value={
                  <Link href={`/admin/activos/${order.asset_id}`} className="font-medium text-primary hover:underline">
                    {order.assets.name}{order.assets.location ? ` · ${order.assets.location}` : ''}
                  </Link>
                }
              />
            )}
            <InfoRow icon={CalendarDays} label="Programada" value={order.scheduled_date ? longDate(order.scheduled_date) : 'Sin fecha'} />
            <InfoRow icon={UserRound} label="Técnico" value={order.operators?.profiles?.full_name ?? 'Sin asignar'} />
          </div>

          {isOpen && (
            <OrderAdminActions orderId={order.id} operatorId={order.assigned_operator_id} operators={operators} />
          )}
        </div>
      </div>
    </div>
  )
}
