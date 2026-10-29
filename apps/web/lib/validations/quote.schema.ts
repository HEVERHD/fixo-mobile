import { z } from 'zod'

export const quoteItemSchema = z.object({
  description: z.string().trim().min(2, 'Describe el ítem').max(500),
  unit: z.string().trim().min(1, 'Unidad requerida').max(10),
  quantity: z.number().positive('La cantidad debe ser mayor que 0').max(1_000_000),
  unit_price: z.number().min(0, 'El precio no puede ser negativo').max(10_000_000_000),
})

export const quoteSchema = z.object({
  client_id: z.uuid('Elige el cliente'),
  aiu_pct: z.number().min(0).max(100),
  tax_pct: z.number().min(0).max(100),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')).transform((s) => s || null),
  notes: z.string().trim().max(2000).transform((s) => s || null),
  items: z.array(quoteItemSchema).min(1, 'Agrega al menos un ítem').max(200),
})

export type QuoteItemInput = z.input<typeof quoteItemSchema>
export type QuoteInput = z.input<typeof quoteSchema>
