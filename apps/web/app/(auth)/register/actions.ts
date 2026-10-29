'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { joinSchema, registerSchema, type JoinInput, type RegisterInput } from '@/lib/validations/auth.schema'

export type SignUpResult =
  | { ok: true; needsConfirmation: true; email: string }
  | { ok: true; needsConfirmation: false; role: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string | undefined> }

function signUpErrorMessage(message: string) {
  const m = message.toLowerCase()
  if (m.includes('already registered')) return 'Ya existe una cuenta con este correo. Inicia sesión.'
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'
  if (m.includes('password')) return 'La contraseña no cumple los requisitos. Usa al menos 8 caracteres.'
  if (m.includes('signups not allowed')) return 'El registro está deshabilitado por ahora.'
  return 'No pudimos crear la cuenta. Inténtalo de nuevo.'
}

/** Where the confirmation email sends the user back. Must be listed in Supabase → Auth → URL Configuration. */
async function confirmRedirect() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || (await headers()).get('origin') || ''
  return `${base.replace(/\/+$/, '')}/login?confirmado=1`
}

function fieldErrors(error: z.ZodError) {
  const errors = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v?.[0]]))
}

/**
 * Registers a company: handle_new_user() (DB trigger) creates the organization from
 * organization_name/business_type and makes this user its admin. The role is never sent:
 * the trigger only trusts app_metadata for roles.
 */
export async function registerCompany(input: RegisterInput): Promise<SignUpResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Revisa los campos marcados.', fieldErrors: fieldErrors(parsed.error) }
  const { email, password, full_name, organization_name, business_type } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { organization_name, business_type, full_name }, emailRedirectTo: await confirmRedirect() },
  })
  if (error) return { ok: false, error: signUpErrorMessage(error.message) }

  // With email confirmation on there is no session yet
  return data.session ? { ok: true, needsConfirmation: false, role: 'admin' } : { ok: true, needsConfirmation: true, email }
}

/** Sign-up for someone invited by a company. claim_my_invitation() links them on their first sign-in. */
export async function joinCompany(input: JoinInput): Promise<SignUpResult> {
  const parsed = joinSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Revisa los campos marcados.', fieldErrors: fieldErrors(parsed.error) }
  const { email, password, full_name } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name }, emailRedirectTo: await confirmRedirect() },
  })
  if (error) return { ok: false, error: signUpErrorMessage(error.message) }
  if (!data.session) return { ok: true, needsConfirmation: true, email }

  // Confirmation disabled: the email counts as confirmed, so the invitation can be claimed right away
  const { data: role } = await supabase.rpc('claim_my_invitation')
  return { ok: true, needsConfirmation: false, role: (role as string | null) ?? null }
}
