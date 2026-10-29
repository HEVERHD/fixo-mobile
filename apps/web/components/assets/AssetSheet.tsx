import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Building2, CalendarDays, ChevronRight, ClipboardList, HardHat, History, Inbox, MapPin, Plus,
  Tag, TriangleAlert, Wrench, type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { ASSET_STATUS_META, assetLink, qrSvg, type AssetStatus } from '@/lib/assets'
import { STATUS_META, OPEN_STATUSES, type WorkOrderStatus } from '@/lib/workOrders'
import { Chip, EmptyState, InfoRow, PageHeader, PrimaryLink, Section } from '@/components/app/ui'
import { PrintLabelsButton } from '@/components/assets/PrintLabelsButton'

interface AssetDetail {
  id: string
  name: string
  type: string | null
  brand: string | null
  model: string | null
  serial_number: string | null
  location: string | null
  status: AssetStatus
  installation_date: string | null
  qr_code: string
  client_id: string
  clients: { company_name: string } | null
}

interface Visit {
  id: string
  date: string
  tasks_performed: string
  observations: string | null
  pending_tasks: string | null
  operators: { profiles: { full_name: string } | null } | null
  work_orders: { id: string; order_number: string } | null
}

interface OpenOrder {
  id: string
  order_number: string
  description: string
  status: WorkOrderStatus
}

const dateLabel = (d: string) => format(parseISO(d), "d 'de' MMMM yyyy", { locale: es })

/**
 * Asset sheet, same content as the app: pending from the last visit, data, QR, open orders and history.
 * RLS decides what each role sees (clients only their own assets); `mode` only changes the actions.
 */
export async function AssetSheet({ id, mode, backHref }: { id: string; mode: 'admin' | 'cliente'; backHref: string }) {
  const supabase = await createClient()
  const isAdmin = mode === 'admin'

  const [{ data: a }, { data: v }, { data: o }, { data: org }] = await Promise.all([
    supabase
      .from('assets')
      .select('id, name, type, brand, model, serial_number, location, status, installation_date, qr_code, client_id, clients(company_name)')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('maintenance_records')
      .select('id, date, tasks_performed, observations, pending_tasks, operators(profiles(full_name)), work_orders(id, order_number)')
      .eq('asset_id', id)
      .order('date', { ascending: false })
      .limit(20),
    supabase
      .from('work_orders')
      .select('id, order_number, description, status')
      .eq('asset_id', id)
      .in('status', OPEN_STATUSES)
      .order('created_at', { ascending: false }),
    supabase.from('organizations').select('name').maybeSingle(),
  ])
  if (!a) notFound()

  const asset = a as unknown as AssetDetail
  const visits = (v ?? []) as unknown as Visit[]
  const orders = (o ?? []) as OpenOrder[]
  const status = ASSET_STATUS_META[asset.status] ?? ASSET_STATUS_META.activo
  const lastVisit = visits[0]
  const brandModel = [asset.brand, asset.model].filter(Boolean).join(' ')
  const orderHref = (orderId: string) => (isAdmin ? `/admin/ordenes/${orderId}` : null)
  // Built from our own DB code (FX-…), rendered by the qrcode library
  const svg = await qrSvg(assetLink(asset.qr_code))

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-10">
      <PageHeader backHref={backHref} title={asset.name} subtitle={asset.type}>
        <Chip className={cn('mb-2', status.chip)}>{status.label}</Chip>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Pending from the last visit: the first thing a technician needs */}
          {lastVisit?.pending_tasks && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                <TriangleAlert size={16} className="text-amber-700" /> Quedó pendiente en la última visita
              </p>
              <p className="text-sm whitespace-pre-line text-amber-900">{lastVisit.pending_tasks}</p>
              <p className="mt-2 text-xs text-amber-700">{dateLabel(lastVisit.date)}</p>
            </div>
          )}

          {/* Technical sheet */}
          <div className="grid divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white px-4 sm:grid-cols-2 sm:divide-y-0 sm:[&>*]:border-b sm:[&>*]:border-gray-100">
            {isAdmin && asset.clients && <InfoRow icon={Building2} label="Cliente" value={asset.clients.company_name} />}
            {asset.location && <InfoRow icon={MapPin} label="Ubicación" value={asset.location} />}
            {brandModel && <InfoRow icon={Tag} label="Marca y modelo" value={brandModel} />}
            {asset.serial_number && <InfoRow icon={Tag} label="N.º de serie" value={asset.serial_number} />}
            {asset.installation_date && <InfoRow icon={CalendarDays} label="Instalado" value={dateLabel(asset.installation_date)} />}
            <InfoRow icon={History} label="Visitas registradas" value={String(visits.length)} />
          </div>

          {/* Open orders */}
          <Section title="Órdenes abiertas">
            {orders.length === 0 ? (
              <p className="text-sm text-gray-500">No hay órdenes abiertas para este equipo.</p>
            ) : (
              <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
                {orders.map((order) => {
                  const meta = STATUS_META[order.status] ?? STATUS_META.pendiente
                  const href = orderHref(order.id)
                  const row = (
                    <>
                      <span className={cn('mr-3 h-2.5 w-2.5 shrink-0 rounded-full', meta.dot)} />
                      <div className="mr-2 min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">{order.order_number}</p>
                        <p className="truncate text-sm text-gray-600">{order.description}</p>
                      </div>
                      {href ? <ChevronRight size={18} className="text-gray-300" /> : <Chip className={cn(meta.chip, meta.text)}>{meta.label}</Chip>}
                    </>
                  )
                  return href
                    ? <Link key={order.id} href={href} className="flex items-center px-4 py-3.5 transition hover:bg-gray-50">{row}</Link>
                    : <div key={order.id} className="flex items-center px-4 py-3.5">{row}</div>
                })}
              </div>
            )}
            <div className="mt-3">
              {isAdmin ? (
                <PrimaryLink href={`/admin/ordenes/nueva?clientId=${asset.client_id}&assetId=${asset.id}`} icon={Plus}>
                  Nueva orden para este equipo
                </PrimaryLink>
              ) : (
                <PrimaryLink href={`/cliente/solicitar?assetId=${asset.id}`} icon={Inbox}>
                  Solicitar servicio para este equipo
                </PrimaryLink>
              )}
            </div>
          </Section>

          {/* History */}
          <Section title="Historial de mantenimiento">
            {visits.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Sin visitas todavía" message="Cuando un técnico cierre una orden de este equipo, su reporte quedará aquí." />
            ) : (
              <ol className="relative space-y-3 border-l-2 border-gray-100 pl-5">
                {visits.map((visit) => {
                  const href = visit.work_orders ? orderHref(visit.work_orders.id) : null
                  return (
                    <li key={visit.id} className="relative rounded-2xl border border-gray-100 bg-white p-4">
                      <span aria-hidden className="absolute top-5 -left-[27px] h-3 w-3 rounded-full border-2 border-white bg-primary" />
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{dateLabel(visit.date)}</p>
                        {visit.work_orders && (href
                          ? <Link href={href} className="font-mono text-xs text-gray-400 hover:text-primary">{visit.work_orders.order_number}</Link>
                          : <span className="font-mono text-xs text-gray-400">{visit.work_orders.order_number}</span>)}
                      </div>
                      <VisitLine icon={Wrench} text={visit.tasks_performed} />
                      {visit.observations && <VisitLine icon={ClipboardList} text={visit.observations} muted />}
                      {visit.pending_tasks && <VisitLine icon={TriangleAlert} text={visit.pending_tasks} warn />}
                      {visit.operators?.profiles?.full_name && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <HardHat size={13} className="text-gray-400" /> {visit.operators.profiles.full_name}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </Section>
        </div>

        {/* QR */}
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6">
            <div className="h-44 w-44 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="mt-4 font-mono text-lg font-bold tracking-widest text-gray-900">{asset.qr_code}</p>
            <p className="mt-1 text-center text-xs text-gray-500">
              {isAdmin ? 'Pega la etiqueta en el equipo. Al escanearla se abre esta ficha.' : 'Es el código de la etiqueta pegada en el equipo.'}
            </p>
            {isAdmin && (
              <PrintLabelsButton
                className="mt-4"
                orgName={org?.name ?? ''}
                assets={[{ name: asset.name, qr_code: asset.qr_code, location: asset.location, clientName: asset.clients?.company_name }]}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function VisitLine({ icon: Icon, text, muted = false, warn = false }: { icon: LucideIcon; text: string; muted?: boolean; warn?: boolean }) {
  return (
    <p className={cn('mt-1 flex gap-2 text-sm', warn ? 'text-amber-800' : muted ? 'text-gray-500' : 'text-gray-700')}>
      <Icon size={14} className={cn('mt-0.5 shrink-0', warn ? 'text-amber-600' : 'text-gray-400')} />
      <span className="whitespace-pre-line">{text}</span>
    </p>
  )
}
