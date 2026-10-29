export type ProjectStatus = 'planeacion' | 'en_ejecucion' | 'pausada' | 'terminada'

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; chip: string; text: string; bar: string }> = {
  planeacion: { label: 'Planeación', chip: 'bg-gray-100', text: 'text-gray-700', bar: 'bg-gray-400' },
  en_ejecucion: { label: 'En ejecución', chip: 'bg-blue-100', text: 'text-blue-800', bar: 'bg-primary' },
  pausada: { label: 'Pausada', chip: 'bg-amber-100', text: 'text-amber-800', bar: 'bg-amber-400' },
  terminada: { label: 'Terminada', chip: 'bg-green-100', text: 'text-green-800', bar: 'bg-green-500' },
}

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

/** Budget as currency, e.g. "$ 45.000.000". */
export function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  return cop.format(Number(value))
}
