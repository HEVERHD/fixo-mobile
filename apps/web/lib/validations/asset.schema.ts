import { z } from 'zod'

// Same type list as the app (apps/mobile/app/nuevo-equipo.tsx)
export const ASSET_TYPES = ['Climatización', 'Eléctrico', 'Hidráulico', 'Generación eléctrica', 'Refrigeración', 'Otro'] as const

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((s) => s || null)

export const assetSchema = z.object({
  client_id: z.uuid('Elige el cliente dueño del equipo'),
  name: z.string().trim().min(3, 'Escribe un nombre que lo identifique').max(120),
  type: z.enum(ASSET_TYPES),
  brand: optionalText(80),
  model: optionalText(80),
  serial_number: optionalText(80),
  location: optionalText(160),
  installation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')).transform((s) => s || null),
  status: z.enum(['activo', 'en_mantenimiento', 'fuera_de_servicio']),
})

export type AssetFormInput = z.input<typeof assetSchema>
export type AssetInput = z.output<typeof assetSchema>
