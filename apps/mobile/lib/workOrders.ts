import { addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

export type WorkOrderStatus ='pendiente' | 'en_proceso' | 'completada' | 'cancelada'
export type WorkOrderPriority = 'baja' | 'media' | 'alta' | 'urgente'
export type WorkOrderType = 'preventivo' | 'correctivo' | 'instalacion'

export const TYPE_LABEL: Record<WorkOrderType, string> = {
  preventivo: 'Preventivo',
  correctivo: 'Correctivo',
  instalacion: 'Instalación',
}

export const STATUS_META: Record<WorkOrderStatus, { label: string; chip: string; text: string; dot: string }> = {
  pendiente: { label: 'Pendiente', chip: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-400' },
  en_proceso: { label: 'En proceso', chip: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-primary' },
  completada: { label: 'Completada', chip: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  cancelada: { label: 'Cancelada', chip: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
}

export const PRIORITY_LABEL: Record<WorkOrderPriority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
}

/** Statuses that still need someone to act on them. */
export const OPEN_STATUSES: WorkOrderStatus[] = ['pendiente', 'en_proceso']

export type DateChoice = 'hoy' | 'manana' | '3dias' | 'semana' | 'ninguna'

const DATE_OFFSETS: Record<DateChoice, number | null> = {
  hoy: 0, manana: 1, '3dias': 3, semana: 7, ninguna: null,
}

/** Chip options for "Fecha programada", labelled with the actual day. */
export function dateChoiceOptions(today = new Date()) {
  const label = (offset: number, text: string) => `${text} · ${format(addDays(today, offset), 'd MMM', { locale: es })}`
  return [
    { value: 'hoy' as const, label: label(0, 'Hoy') },
    { value: 'manana' as const, label: label(1, 'Mañana') },
    { value: '3dias' as const, label: label(3, 'En 3 días') },
    { value: 'semana' as const, label: label(7, 'En 1 semana') },
    { value: 'ninguna' as const, label: 'Sin fecha' },
  ]
}

/** 'yyyy-MM-dd' for the chosen shortcut, or null for "Sin fecha". */
export function scheduledDateFor(choice: DateChoice): string | null {
  const offset = DATE_OFFSETS[choice]
  return offset === null ? null : format(addDays(new Date(), offset), 'yyyy-MM-dd')
}
