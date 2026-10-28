'use server'

import { createClient } from '@/lib/supabase/server'

export async function loginAction(
  email: string,
  password: string
): Promise<{ error?: string; role?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciales incorrectas. Verifica tu email y contraseña.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No se pudo obtener la sesión.' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.role) {
    return {
      error: profileError
        ? `DB error: ${profileError.message} [${profileError.code}]`
        : `Sin perfil para user: ${user.id}`,
    }
  }

  return { role: profile.role }
}
