'use server'

import { createClient } from '@/lib/supabase/server'

function signInErrorMessage(code: string | undefined, message: string) {
  const m = message.toLowerCase()
  if (code === 'email_not_confirmed' || m.includes('email not confirmed')) {
    return 'Tu cuenta aún no está activa. Abre el enlace que te enviamos al correo al registrarte.'
  }
  if (code?.startsWith('over_') || m.includes('rate limit') || m.includes('security purposes')) {
    return 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.'
  }
  return 'Credenciales incorrectas. Verifica tu email y contraseña.'
}

export async function loginAction(
  email: string,
  password: string
): Promise<{ error?: string; role?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: signInErrorMessage(error.code, error.message) }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No se pudo obtener la sesión.' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // Log details on the server only; never expose DB errors or user ids to the browser
    console.error('loginAction: profile lookup failed', profileError?.code ?? 'no-profile')
    await supabase.auth.signOut()
    return { error: 'Tu cuenta no tiene un perfil asignado. Contacta al administrador de tu empresa.' }
  }

  // A role only counts once the user belongs to a company. No company yet: accept a pending
  // invitation for this (confirmed) email, same as the app does on sign-in.
  if (profile.organization_id) return { role: profile.role }

  const { data: claimed, error: claimError } = await supabase.rpc('claim_my_invitation')
  if (claimed) return { role: claimed as string }

  await supabase.auth.signOut()
  // Raised by claim_my_invitation() in Spanish when the client already has a user
  if (claimError?.code === 'P0001') return { error: claimError.message }
  return { error: 'Tu cuenta aún no pertenece a ninguna empresa. Si te invitaron, verifica que te registraste con el mismo correo de la invitación o pide una nueva.' }
}
