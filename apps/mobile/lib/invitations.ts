import { Share } from 'react-native'
import * as Linking from 'expo-linking'
import { supabase } from '@/lib/supabase'

export type InviteRole = 'operario' | 'cliente'

export interface Invitation {
  id: string
  email: string
  role: InviteRole
  full_name: string | null
  specialty: string | null
  client_id: string | null
  created_at: string
  expires_at: string
}

export const INVITATION_FIELDS = 'id, email, role, full_name, specialty, client_id, created_at, expires_at'

export const ROLE_LABEL: Record<InviteRole, string> = {
  operario: 'técnico',
  cliente: 'cliente',
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

/**
 * Creates (or replaces) the open invitation for an email in the caller's company.
 * Access is granted later by claim_my_invitation(), once that email is confirmed.
 */
export async function createInvitation(input: {
  email: string
  role: InviteRole
  fullName?: string
  specialty?: string
  clientId?: string | null
}) {
  const email = normalizeEmail(input.email)
  // RLS scopes the delete to this company's invitations
  await supabase.from('invitations').delete().eq('email', email).is('accepted_at', null)

  const { error } = await supabase.from('invitations').insert({
    email,
    role: input.role,
    full_name: input.fullName?.trim() || null,
    specialty: input.role === 'operario' ? input.specialty?.trim() || null : null,
    client_id: input.role === 'cliente' ? input.clientId : null,
  })
  return !error
}

export async function cancelInvitation(id: string) {
  const { error } = await supabase.from('invitations').delete().eq('id', id)
  return !error
}

/** Opens the share sheet (WhatsApp, SMS, email…) with the sign-up link. */
export async function shareInvitation(inv: { email: string; role: InviteRole; full_name: string | null }, orgName: string) {
  const link = Linking.createURL('/unirme', { queryParams: { email: inv.email } })
  const greeting = inv.full_name ? `Hola ${inv.full_name.split(' ')[0]}` : 'Hola'
  const message =
    `${greeting}, ${orgName} te invitó a Fixo como ${ROLE_LABEL[inv.role]}.\n\n` +
    `1. Instala la app Fixo.\n` +
    `2. Crea tu cuenta con este correo: ${inv.email}\n` +
    `3. Confirma el correo y listo.\n\n` +
    `Abrir en la app: ${link}`
  try {
    await Share.share({ message })
  } catch {
    // The user closed the share sheet or no app can handle it; nothing to do
  }
}
