'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminClient } from '@/lib/auth'

// apu_catalog is per company (RLS: admins manage, technicians read, clients never see it)
const itemSchema = z.object({
  category: z.string().trim().min(2, 'Escribe la categoría').max(60),
  code: z.string().trim().toUpperCase().min(1, 'Escribe el código').max(20),
  description: z.string().trim().min(2, 'Describe el ítem').max(300),
  unit: z.string().trim().toUpperCase().min(1, 'Escribe la unidad').max(10),
  unit_price: z.number().min(0, 'El precio no puede ser negativo').max(10_000_000_000),
  type: z.enum(['material', 'mano_de_obra']),
})

export type ApuInput = z.input<typeof itemSchema>
type Result = { ok: true } | { ok: false; error: string }

export async function saveApuItem(id: string | null, input: ApuInput): Promise<Result> {
  const parsed = itemSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  if (id !== null && !z.uuid().safeParse(id).success) return { ok: false, error: 'Datos inválidos.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para editar el catálogo.' }

  // organization_id defaults to the admin's company on insert
  const { error } = id
    ? await supabase.from('apu_catalog').update(parsed.data).eq('id', id)
    : await supabase.from('apu_catalog').insert(parsed.data)
  if (error) {
    console.error('saveApuItem failed', error.code)
    return { ok: false, error: 'No pudimos guardar el ítem.' }
  }

  revalidatePath('/admin/financiero/catalogo')
  return { ok: true }
}

export async function deleteApuItem(id: string): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: 'Datos inválidos.' }
  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para editar el catálogo.' }

  // Quotes keep their own copy of each line, so removing a catalog item never changes them
  const { error } = await supabase.from('apu_catalog').delete().eq('id', id)
  if (error) return { ok: false, error: 'No pudimos borrar el ítem.' }

  revalidatePath('/admin/financiero/catalogo')
  return { ok: true }
}

/** Starter items for a new company (same list the original web seeded), only when the catalog is empty. */
export async function seedApuCatalog(): Promise<Result> {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para editar el catálogo.' }

  const { count } = await supabase.from('apu_catalog').select('*', { count: 'exact', head: true })
  if (count) return { ok: false, error: 'Tu catálogo ya tiene ítems.' }

  const { error } = await supabase.from('apu_catalog').insert(STARTER_ITEMS)
  if (error) return { ok: false, error: 'No pudimos cargar el catálogo de ejemplo.' }

  revalidatePath('/admin/financiero/catalogo')
  return { ok: true }
}

// From apps/web/supabase/migrations/005_financial.sql; prices are references to adjust
const STARTER_ITEMS: z.output<typeof itemSchema>[] = [
  ['Mano de obra', 'MO-001', 'Técnico electricista (hora)', 'HR', 45000, 'mano_de_obra'],
  ['Mano de obra', 'MO-002', 'Técnico en HVAC (hora)', 'HR', 55000, 'mano_de_obra'],
  ['Mano de obra', 'MO-003', 'Oficial electricista (hora)', 'HR', 35000, 'mano_de_obra'],
  ['Mano de obra', 'MO-004', 'Ayudante (hora)', 'HR', 25000, 'mano_de_obra'],
  ['Mano de obra', 'MO-005', 'Ingeniero supervisor (hora)', 'HR', 120000, 'mano_de_obra'],
  ['Materiales eléctricos', 'ME-001', 'Cable THHN calibre 12 AWG', 'ML', 4500, 'material'],
  ['Materiales eléctricos', 'ME-002', 'Cable THHN calibre 10 AWG', 'ML', 6800, 'material'],
  ['Materiales eléctricos', 'ME-004', 'Breaker 1P 20A', 'UN', 35000, 'material'],
  ['Materiales eléctricos', 'ME-005', 'Breaker 2P 30A', 'UN', 65000, 'material'],
  ['Materiales eléctricos', 'ME-007', 'Tablero eléctrico 12 circuitos', 'UN', 280000, 'material'],
  ['Materiales eléctricos', 'ME-010', 'Tubo conduit 3/4"', 'ML', 8500, 'material'],
  ['HVAC', 'HV-001', 'Refrigerante R-410A', 'LB', 85000, 'material'],
  ['HVAC', 'HV-003', 'Filtro aire acondicionado 12x24', 'UN', 45000, 'material'],
  ['Redes hidráulicas', 'RH-001', 'Bomba centrífuga 1HP', 'UN', 850000, 'material'],
  ['Redes hidráulicas', 'RH-002', 'Tubería PVC 1"', 'ML', 12000, 'material'],
  ['Generales', 'GE-001', 'Transporte y desplazamiento', 'VJ', 80000, 'mano_de_obra'],
  ['Generales', 'GE-002', 'Materiales consumibles (cinta, amarres, etc.)', 'GBL', 25000, 'material'],
].map(([category, code, description, unit, unit_price, type]) => ({
  category, code, description, unit, unit_price, type,
} as z.output<typeof itemSchema>))
