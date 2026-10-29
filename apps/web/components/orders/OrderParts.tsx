import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Ban, FileCheck2, TriangleAlert, Wrench, Zap, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PRIORITY_CHIP, PRIORITY_LABEL, TYPE_LABEL,
  type WorkOrderPriority, type WorkOrderStatus, type WorkOrderType,
} from '@/lib/workOrders'
import { Chip, Section } from '@/components/app/ui'

export interface Report {
  id: string
  date: string
  tasks_performed: string
  observations: string | null
  pending_tasks: string | null
}

/** Most recent report of an order, if any. */
export const latestReport = (reports: Report[] | null | undefined) =>
  [...(reports ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0]

/** Type + priority chips and the description. */
export function OrderSummary({ type, priority, description }: { type: WorkOrderType; priority: WorkOrderPriority; description: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="mb-3 flex gap-2">
        <Chip className="bg-gray-100 text-gray-700">{TYPE_LABEL[type] ?? type}</Chip>
        <Chip className={PRIORITY_CHIP[priority]}>
          {priority === 'urgente' && <Zap size={11} className="fill-current" />}
          {PRIORITY_LABEL[priority]}
        </Chip>
      </div>
      <p className="leading-relaxed whitespace-pre-line text-gray-900">{description}</p>
    </div>
  )
}

/** Pendiente → En proceso → Completada (or Cancelada). */
export function Steps({ status }: { status: WorkOrderStatus }) {
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

/** The technician's report, or a note when an order was completed without one. */
export function OrderReport({ report, status }: { report: Report | undefined; status: WorkOrderStatus }) {
  if (!report) {
    return status === 'completada'
      ? <p className="text-center text-sm text-gray-500">Esta orden se completó sin reporte.</p>
      : null
  }
  return (
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
