'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminClient } from '@/lib/auth'
import { normalizeEmail } from '@/lib/invitations'

const inviteSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('operario'),
    email: z.email('Escribe un correo válido'),
    full_name: z.string().trim().max(120),
    specialty: z.string().trim().max(120),
  }),
  z.object({
    role: z.literal('cliente'),
    email: z.email('Escribe un correo válido'),
    full_name: z.string().trim().max(120),
    client_id: z.uuid('Elige el cliente'),
  }),
])

export type InviteInput = z.input<typeof inviteSchema>
type Result = { ok: true } | { ok: false; error: string; field?: 'email' | 'client_id' }

/**
 * Creates (or replaces) the open invitation for an email in the admin's company.
 * Access is granted later by claim_my_invitation(), once that email is confirmed.
 */
export async function createInvitation(input: InviteInput): Promise<Result> {
  const parsed = inviteSchema.safeParse({ ...input, email: normalizeEmail(input.email ?? '') })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue?.path[0] === 'client_id' ? 'client_id' : issue?.path[0] === 'email' ? 'email' : undefined
    return { ok: false, error: issue?.message ?? 'Datos inválidos.', field }
  }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'No tienes permiso para invitar.' }

  const data = parsed.data
  // One open invitation per email and company (unique index): replace the old one. RLS scopes the delete.
  await supabase.from('invitations').delete().eq('email', data.email).is('accepted_at', null)

  const { error } = await supabase.from('invitations').insert({
    email: data.email,
    role: data.role,
    full_name: data.full_name || null,
    specialty: data.role === 'operario' ? data.specialty || null : null,
    client_id: data.role === 'cliente' ? data.client_id : null,
  })
  if (error) {
    console.error('createInvitation failed', error.code)
    return { ok: false, error: 'No pudimos crear la invitación. Inténtalo de nuevo.' }
  }

  revalidatePath(data.role === 'cliente' ? '/admin/clientes' : '/admin/operarios')
  return { ok: true }
}

export async function cancelInvitation(id: string): Promise<{ error?: string }> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const supabase = await adminClient()
  if (!supabase) return { error: 'No tienes permiso para esta acción.' }

  const { error } = await supabase.from('invitations').delete().eq('id', parsed.data).is('accepted_at', null)
  if (error) return { error: 'No pudimos cancelar la invitación.' }

  revalidatePath('/admin/clientes')
  revalidatePath('/admin/operarios')
  return {}
}
