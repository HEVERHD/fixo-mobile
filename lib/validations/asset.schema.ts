import { z } from 'zod'

export const assetSchema = z.object({
  client_id: z.string().uuid('Selecciona un cliente'),
  name: z.string().min(2, 'Nombre requerido'),
  type: z.string().min(2, 'Tipo de equipo requerido'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  location: z.string().optional(),
  installation_date: z.string().optional(),
  status: z.enum(['activo', 'en_mantenimiento', 'fuera_de_servicio']),
})

export type AssetInput = z.infer<typeof assetSchema>
