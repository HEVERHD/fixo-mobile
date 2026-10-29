// Same labels and colors as apps/mobile/lib/workOrders.ts.
// TODO: move to packages/shared once it exists (see README "Próximos pasos").
export type WorkOrderStatus = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada'
export type WorkOrderPriority = 'baja' | 'media' | 'alta' | 'urgente'

export const STATUS_META: Record<WorkOrderStatus, { label: string; chip: string; text: string; dot: string }> = {
  pendiente: { label: 'Pendiente', chip: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-400' },
  en_proceso: { label: 'En proceso', chip: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-primary' },
  completada: { label: 'Completada', chip: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  cancelada: { label: 'Cancelada', chip: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
}

/** Statuses that still need someone to act on them. */
export const OPEN_STATUSES: WorkOrderStatus[] = ['pendiente', 'en_proceso']

export type BusinessType = 'mantenimiento' | 'construccion' | 'ambos'

/** Which modules each business type shows (same rule as the mobile app). */
export function featuresFor(type: BusinessType | null | undefined) {
  const t = type ?? 'mantenimiento'
  return { equipos: t !== 'construccion', obras: t !== 'mantenimiento' }
}
