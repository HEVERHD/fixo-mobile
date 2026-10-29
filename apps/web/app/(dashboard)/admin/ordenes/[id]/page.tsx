import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Ban, Building2, CalendarDays, FileCheck2, HardHat, MapPin, Package, Phone,
  TriangleAlert, UserRound, Wrench, Zap, type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import {
  STATUS_META, PRIORITY_LABEL, PRIORITY_CHIP, TYPE_LABEL, OPEN_STATUSES,
  type WorkOrderStatus, type WorkOrderPriority, type WorkOrderType,
} from '@/lib/workOrders'
import { Chip, InfoRow, PageHeader, Section } from '@/components/app/ui'
import { OrderAdminActions, type OperatorOption } from '@/components/orders/OrderAdminActions'

interface Report {
  id: string
  date: string
  tasks_performed: string
  observations: string | null
  pending_tasks: string | null
}

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
  const report = [...(order.maintenance_records ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0]
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
          {/* What */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="mb-3 flex gap-2">
              <Chip className="bg-gray-100 text-gray-700">{TYPE_LABEL[order.type] ?? order.type}</Chip>
              <Chip className={PRIORITY_CHIP[order.priority]}>
                {order.priority === 'urgente' && <Zap size={11} className="fill-current" />}
                {PRIORITY_LABEL[order.priority]}
              </Chip>
            </div>
            <p className="leading-relaxed text-gray-900">{order.description}</p>
          </div>

          <Steps status={order.status} />

          {/* Report */}
          {report ? (
            <Section title="Reporte del trabajo">
              <div className="rounded-2xl border border-green-100 bg-white p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
                    <FileCheck2 size={18} className="text-green-600" />
                  </span>
                  <p className="text-sm text-gray-500">
                    {format(parseISO(report.date), "d 'de' MMMM yyyy, h:mm a", { locale: es })}
                  </p>
                </div>
                <ReportBlock icon={Wrench} title="Trabajo realizado" text={report.tasks_performed} />
                {report.observations && <ReportBlock icon={FileCheck2} title="Observaciones" text={report.observations} />}
                {report.pending_tasks && <ReportBlock icon={TriangleAlert} title="Quedó pendiente" text={report.pending_tasks} warn />}
              </div>
            </Section>
          ) : order.status === 'completada' ? (
            <p className="text-center text-sm text-gray-500">Esta orden se completó sin reporte.</p>
          ) : null}
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

function ReportBlock({ icon: Icon, title, text, warn = false }: { icon: LucideIcon; title: string; text: string; warn?: boolean }) {
  return (
    <div className={cn('mt-2 rounded-xl p-3', warn ? 'bg-amber-50' : 'bg-gray-50')}>
      <p className={cn('mb-1 flex items-center gap-1.5 text-xs font-semibold', warn ? 'text-amber-800' : 'text-gray-600')}>
        <Icon size={14} /> {title}
      </p>
      <p className="text-sm leading-relaxed whitespace-pre-line text-gray-800">{text}</p>
    </div>
  )
}

/** Pendiente → En proceso → Completada (or Cancelada). */
function Steps({ status }: { status: WorkOrderStatus }) {
  if (status === 'cancelada') {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-gray-100 p-4 font-medium text-gray-700">
        <Ban size={18} className="text-gray-500" /> Esta orden fue cancelada
      </div>
    )
  }
  const steps: { key: WorkOrderStatus; label: string }[] = [
    { key: 'pendiente', label: 'Pendiente' },
    { key: 'en_proceso', label: 'En proceso' },
    { key: 'completada', label: 'Completada' },
  ]
  const current = steps.findIndex((s) => s.key === status)
  return (
    <ol className="flex items-center rounded-2xl border border-gray-100 bg-white p-4">
      {steps.map((s, i) => {
        const done = i <= current
        return (
          <li key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold', done ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500')}>
                {i + 1}
              </span>
              <span className={cn('mt-1 text-xs', done ? 'font-medium text-gray-900' : 'text-gray-400')}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <span className={cn('mx-2 mb-5 h-0.5 flex-1', i < current ? 'bg-primary' : 'bg-gray-200')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
