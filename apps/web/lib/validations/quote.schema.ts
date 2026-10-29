import { z } from 'zod'

export const quoteItemSchema = z.object({
  description: z.string().min(2, 'Descripción requerida'),
  unit: z.string().min(1, 'Unidad requerida'),
  quantity: z.number().positive('Cantidad debe ser positiva'),
  unit_price: z.number().positive('Precio debe ser positivo'),
})

export const quoteSchema = z.object({
  client_id: z.string().uuid('Selecciona un cliente'),
  work_order_id: z.string().uuid().optional().or(z.literal('')),
  aiu_pct: z.number().min(0).max(100),
  tax_pct: z.number().min(0).max(100),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'Agrega al menos un ítem'),
})

export type QuoteItemInput = z.infer<typeof quoteItemSchema>
export type QuoteInput = z.infer<typeof quoteSchema>
