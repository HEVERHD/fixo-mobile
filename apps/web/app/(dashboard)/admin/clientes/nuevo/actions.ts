'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminClient } from '@/lib/auth'

const optionalText = (max: number) => z.string().trim().max(max).transform((s) => s || null)

const clientSchema = z.object({
  company_name: z.string().trim().min(2, 'Escribe el nombre del cliente').max(160),
  nit: optionalText(40),
  address: optionalText(200),
  contact_email: z.string().trim().toLowerCase().max(200)
    .refine((s) => s === '' || z.email().safeParse(s).success, 'Correo inválido')
    .transform((s) => s || null),
  contact_phone: optionalText(40),
})

export type ClientFormInput = z.input<typeof clientSchema>
export type CreateClientResult =
  | { ok: true; id: string; email: string | null }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof ClientFormInput, string>> }

export async function createClientRecord(input: ClientFormInput): Promise<CreateClientResult> {
  const parsed = clientSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(z.flattenError(parsed.error).fieldErrors).map(([k, v]) => [k, v?.[0]])
    )
    return { ok: false, error: 'Revisa los campos marcados.', fieldErrors }
  }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para crear clientes.' }

  // organization_id defaults to the admin's org (same as the app)
  const { data, error } = await supabase.from('clients').insert(parsed.data).select('id').single()
  if (error || !data) {
    console.error('createClientRecord failed', error?.code)
    return { ok: false, error: 'No pudimos crear el cliente. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/clientes')
  return { ok: true, id: data.id, email: parsed.data.contact_email }
}
