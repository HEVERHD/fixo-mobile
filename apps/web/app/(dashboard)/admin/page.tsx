import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ClipboardList, Wrench, Package, Building2, ChevronRight, FileText,
  CheckCheck, Zap, ArrowRight, Plus, HardHat, Inbox, type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { STATUS_META, OPEN_STATUSES, featuresFor, type BusinessType, type WorkOrderStatus, type WorkOrderPriority } from '@/lib/workOrders'
import { Greeting } from '@/components/dashboard/Greeting'

interface RecentOrder {
  id: string
  order_number: string
  description: string | null
  status: WorkOrderStatus
  priority: WorkOrderPriority
  scheduled_date: string | null
  clients: { company_name: string } | null
}

interface ActiveProject {
  id: string
  name: string
  progress: number
  clients: { company_name: string } | null
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const count = { count: 'exact', head: true } as const

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: inProgressOrders },
    { count: urgentOrders },
    { count: totalAssets },
    { count: totalClients },
    { data: recentOrders },
    { count: activeProjects },
    { data: activeProjectList },
    { count: newRequests },
    { data: org },
  ] = await Promise.all([
    supabase.from('work_orders').select('*', count),
    supabase.from('work_orders').select('*', count).eq('status', 'pendiente'),
    supabase.from('work_orders').select('*', count).eq('status', 'en_proceso'),
    supabase.from('work_orders').select('*', count).eq('priority', 'urgente').in('status', OPEN_STATUSES),
    supabase.from('assets').select('*', count),
    supabase.from('clients').select('*', count),
    supabase
      .from('work_orders')
      .select('id, order_number, description, status, priority, scheduled_date, clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('projects').select('*', count).eq('status', 'en_ejecucion'),
    supabase
      .from('projects')
      .select('id, name, progress, clients(company_name)')
      .eq('status', 'en_ejecucion')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('service_requests').select('*', count).eq('status', 'nueva'),
    // RLS only returns the caller's organization
    supabase.from('organizations').select('name, business_type').maybeSingle(),
  ])

  const features = featuresFor((org?.business_type as BusinessType | undefined) ?? null)
  const recent = (recentOrders ?? []) as unknown as RecentOrder[]
  const projects = (activeProjectList ?? []) as unknown as ActiveProject[]
  const requests = newRequests ?? 0

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <Greeting orgName={org?.name} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Left column: attention + actions */}
        <div className="space-y-3">
          <AttentionCard pending={pendingOrders ?? 0} urgent={urgentOrders ?? 0} />

          {/* Client requests from the web portal */}
          <Link
            href="/admin/solicitudes"
            aria-label={`Solicitudes de clientes: ${requests} nuevas`}
            className={cn(
              'flex items-center rounded-2xl border p-4 transition hover:shadow-sm',
              requests > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white'
            )}
          >
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', requests > 0 ? 'bg-amber-500' : 'bg-gray-100')}>
              <Inbox size={20} className={requests > 0 ? 'text-white' : 'text-gray-500'} strokeWidth={2.2} />
            </span>
            <div className="ml-3 flex-1">
              <p className="font-semibold text-gray-900">Solicitudes de clientes</p>
              <p className="text-xs text-gray-500">
                {requests === 0
                  ? 'Sin solicitudes nuevas'
                  : requests === 1 ? '1 solicitud por responder' : `${requests} solicitudes por responder`}
              </p>
            </div>
            {requests > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                {requests}
              </span>
            )}
            <ChevronRight size={18} className="ml-2 text-gray-300" />
          </Link>

          <ActionRow
            href="/admin/ordenes/nueva"
            icon={Plus}
            iconClass="bg-primary"
            title="Nueva orden de trabajo"
            subtitle="Registra un servicio y asígnalo a tu equipo"
          />
          {features.obras && (
            <ActionRow
              icon={HardHat}
              iconClass="bg-navy"
              title="Nueva obra"
              subtitle="Agrupa órdenes, avance y presupuesto"
            />
          )}

          {features.obras && projects.length > 0 && (
            <section className="pt-3">
              <h2 className="mb-3 text-base font-semibold text-gray-900">Obras en ejecución</h2>
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white px-4">
                {projects.map((p) => (
                  <div key={p.id} className="py-3.5">
                    <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                    {p.clients && <p className="mb-2 text-xs text-gray-500">{p.clients.company_name}</p>}
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }} />
                      </div>
                      <span className="w-9 text-right text-xs font-semibold text-gray-700">{p.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column: KPIs */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 lg:sr-only">Resumen</h2>
          <div className="grid grid-cols-2 gap-3">
            <KPICard label="Órdenes" value={totalOrders ?? 0} icon={ClipboardList} tint="bg-blue-100 text-primary" href="/admin/ordenes" />
            <KPICard label="En proceso" value={inProgressOrders ?? 0} icon={Wrench} tint="bg-cyan-100 text-cyan-600" href="/admin/ordenes" />
            {features.obras && (
              <KPICard label="Obras activas" value={activeProjects ?? 0} icon={HardHat} tint="bg-amber-100 text-amber-600" />
            )}
            {features.equipos && (
              <KPICard label="Equipos" value={totalAssets ?? 0} icon={Package} tint="bg-green-100 text-green-600" href="/admin/activos" />
            )}
            <KPICard label="Clientes" value={totalClients ?? 0} icon={Building2} tint="bg-purple-100 text-purple-600" href="/admin/clientes" />
          </div>
        </section>
      </div>

      {/* Recent orders */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Órdenes recientes</h2>
          {recent.length > 0 && (
            <Link href="/admin/ordenes" className="text-sm font-medium text-primary hover:underline">
              Ver todas
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <FileText size={26} className="text-gray-400" strokeWidth={1.8} />
            </span>
            <p className="font-semibold text-gray-900">Aún no hay órdenes</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Cuando un cliente solicite un servicio o crees una orden, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {recent.map((order) => <OrderRow key={order.id} order={order} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function AttentionCard({ pending, urgent }: { pending: number; urgent: number }) {
  if (pending === 0 && urgent === 0) {
    return (
      <div className="flex items-center rounded-3xl border border-green-100 bg-green-50 p-5">
        <span className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCheck size={24} className="text-green-600" strokeWidth={2.2} />
        </span>
        <div>
          <p className="font-semibold text-green-900">Todo al día</p>
          <p className="mt-0.5 text-sm text-green-700">No hay órdenes pendientes por asignar.</p>
        </div>
      </div>
    )
  }

  return (
    <Link
      href="/admin/ordenes"
      className="group relative block overflow-hidden rounded-3xl bg-navy p-5 sm:p-6"
      aria-label={`${pending} órdenes pendientes, ${urgent} urgentes. Revisar`}
    >
      <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary opacity-30 blur-xl" />
      <p className="relative text-sm font-medium text-blue-200">Requiere tu atención</p>
      <div className="relative mt-2 flex items-end">
        <span className="font-heading text-5xl font-extrabold text-white">{pending}</span>
        <span className="mb-2 ml-2 text-white">{pending === 1 ? 'orden pendiente' : 'órdenes pendientes'}</span>
      </div>
      {urgent > 0 && (
        <span className="relative mt-2 inline-flex items-center gap-1 rounded-full bg-highlight px-3 py-1 text-xs font-bold text-navy">
          <Zap size={14} className="fill-navy" />
          {urgent} {urgent === 1 ? 'urgente' : 'urgentes'}
        </span>
      )}
      <span className="relative mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-navy transition group-hover:bg-blue-50">
        Revisar órdenes <ArrowRight size={18} strokeWidth={2.2} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

function ActionRow({
  href, icon: Icon, iconClass, title, subtitle,
}: { href?: string; icon: LucideIcon; iconClass: string; title: string; subtitle: string }) {
  const body = (
    <>
      <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-white', iconClass)}>
        <Icon size={20} strokeWidth={2.3} />
      </span>
      <div className="ml-3 flex-1">
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      {href && <ChevronRight size={18} className="text-gray-300" />}
    </>
  )
  const cls = 'flex items-center rounded-2xl border border-gray-100 bg-white p-4'
  return href
    ? <Link href={href} className={cn(cls, 'transition hover:border-blue-100 hover:shadow-sm')}>{body}</Link>
    : <div className={cls}>{body}</div>
}

function KPICard({
  label, value, icon: Icon, tint, href,
}: { label: string; value: number; icon: LucideIcon; tint: string; href?: string }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tint)}>
          <Icon size={20} />
        </span>
        {href && <ChevronRight size={18} className="text-gray-300" />}
      </div>
      <p className="font-heading mt-3 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-500">{label}</p>
    </>
  )
  const cls = 'rounded-2xl border border-gray-100 bg-white p-4'
  return href
    ? <Link href={href} className={cn(cls, 'transition hover:border-blue-100 hover:shadow-sm')} aria-label={`${label}: ${value}`}>{body}</Link>
    : <div className={cls}>{body}</div>
}

function OrderRow({ order }: { order: RecentOrder }) {
  const status = STATUS_META[order.status] ?? STATUS_META.pendiente
  const meta = [
    order.clients?.company_name,
    order.scheduled_date && format(parseISO(order.scheduled_date), "d 'de' MMM", { locale: es }),
  ].filter(Boolean).join(' · ')

  return (
    <Link href="/admin/ordenes" className="flex items-center px-4 py-3.5 transition hover:bg-gray-50">
      <span className={cn('mr-3 h-2.5 w-2.5 shrink-0 rounded-full', status.dot)} />
      <div className="mr-3 min-w-0 flex-1">
        <p className="flex items-center gap-1 text-sm font-semibold text-gray-900">
          {order.order_number}
          {order.priority === 'urgente' && <Zap size={13} className="fill-red-500 text-red-500" aria-label="Urgente" />}
        </p>
        {order.description && <p className="mt-0.5 truncate text-sm text-gray-600">{order.description}</p>}
        {meta && <p className="mt-0.5 text-xs text-gray-400">{meta}</p>}
      </div>
      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', status.chip, status.text)}>{status.label}</span>
    </Link>
  )
}
