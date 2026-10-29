import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Building2, CalendarDays, HardHat, MapPin, Package, Phone, TriangleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { STATUS_META, type WorkOrderPriority, type WorkOrderStatus, type WorkOrderType } from '@/lib/workOrders'
import { Chip, InfoRow, PageHeader } from '@/components/app/ui'
import { OrderReport, OrderSummary, Steps, latestReport, reportPhotoUrls, type Report } from '@/components/orders/OrderParts'
import { CompleteOrderForm, StartOrderButton } from '@/components/orders/OperatorOrderActions'

interface OrderDetail {
  id: string
  order_number: string
  description: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  type: WorkOrderType
  scheduled_date: string | null
  asset_id: string | null
  clients: { company_name: string; address: string | null; contact_phone: string | null } | null
  assets: { name: string; location: string | null } | null
  projects: { name: string } | null
  maintenance_records: Report[]
}

const SELECT = `
  id, order_number, description, status, priority, type, scheduled_date, asset_id,
  clients(company_name, address, contact_phone),
  assets(name, location),
  projects(name),
  maintenance_records(id, date, tasks_performed, observations, pending_tasks, photos)
`

export default async function OperarioOrderPage({ params }: PageProps<'/operario/ordenes/[id]'>) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase.from('work_orders').select(SELECT).eq('id', id).maybeSingle()
  if (!data) notFound()
  const order = data as unknown as OrderDetail

  // What was left pending on this asset's last visit: the first thing the technician needs on site
  const { data: last } = order.asset_id
    ? await supabase
        .from('maintenance_records')
        .select('date, pending_tasks')
        .eq('asset_id', order.asset_id)
        .neq('work_order_id', order.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const status = STATUS_META[order.status] ?? STATUS_META.pendiente
  const report = latestReport(order.maintenance_records)
  const [photoUrls, { data: { user } }] = await Promise.all([reportPhotoUrls(supabase, report), supabase.auth.getUser()])
  // Company folder for uploads (Storage RLS checks it again)
  const { data: op } = await supabase.from('operators').select('organization_id').eq('user_id', user?.id ?? '').maybeSingle()

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        backHref="/operario"
        title={order.order_number}
        subtitle={order.clients?.company_name}
        actions={<Chip className={cn('px-3 text-sm', status.chip, status.text)}>{status.label}</Chip>}
      />

      <div className="space-y-5">
        {last?.pending_tasks && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-900">
              <TriangleAlert size={16} className="text-amber-700" /> Quedó pendiente en la última visita
            </p>
            <p className="text-sm whitespace-pre-line text-amber-900">{last.pending_tasks}</p>
            <p className="mt-2 text-xs text-amber-700">{format(parseISO(last.date), "d 'de' MMMM yyyy", { locale: es })}</p>
          </div>
        )}

        <OrderSummary type={order.type} priority={order.priority} description={order.description} />
        <Steps status={order.status} />

        {order.status === 'pendiente' && <StartOrderButton orderId={order.id} size="lg" />}
        {order.status === 'en_proceso' && op && (
          <CompleteOrderForm orderId={order.id} orderNumber={order.order_number} orgId={op.organization_id} />
        )}

        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white px-4">
          {order.clients && <InfoRow icon={Building2} label="Cliente" value={order.clients.company_name} />}
          {order.clients?.address && <InfoRow icon={MapPin} label="Dirección" value={order.clients.address} />}
          {order.clients?.contact_phone && (
            <InfoRow icon={Phone} label="Teléfono" value={order.clients.contact_phone} href={`tel:${order.clients.contact_phone}`} />
          )}
          {order.projects && <InfoRow icon={HardHat} label="Obra" value={order.projects.name} />}
          {order.assets && (
            <InfoRow icon={Package} label="Equipo" value={order.assets.name + (order.assets.location ? ` · ${order.assets.location}` : '')} />
          )}
          <InfoRow
            icon={CalendarDays}
            label="Programada"
            value={order.scheduled_date ? format(parseISO(order.scheduled_date), "EEEE d 'de' MMMM yyyy", { locale: es }) : 'Sin fecha'}
          />
        </div>

        <OrderReport report={report} status={order.status} photoUrls={photoUrls} />
      </div>
    </div>
  )
}
