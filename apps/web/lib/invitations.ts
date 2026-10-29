// Same model and message as apps/mobile/lib/invitations.ts.
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

/** Text sent by WhatsApp/email. The link opens the app's "unirme" screen (scheme from apps/mobile/app.json). */
export function invitationMessage(inv: { email: string; role: InviteRole; full_name: string | null }, orgName: string) {
  const link = `fixo://unirme?email=${encodeURIComponent(inv.email)}`
  const greeting = inv.full_name ? `Hola ${inv.full_name.split(' ')[0]}` : 'Hola'
  return (
    `${greeting}, ${orgName || 'tu empresa'} te invitó a Fixo como ${ROLE_LABEL[inv.role]}.\n\n` +
    `1. Instala la app Fixo.\n` +
    `2. Crea tu cuenta con este correo: ${inv.email}\n` +
    `3. Confirma el correo y listo.\n\n` +
    `Abrir en la app: ${link}`
  )
}
