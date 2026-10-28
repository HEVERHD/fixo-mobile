import { supabase } from '@/lib/supabase'

export type AuthLinkResult =
  | { kind: 'signed-in'; type: string | null }
  | { kind: 'error'; code: string | null; description: string | null }
  | { kind: 'none' }

/** Reads params from both the query string and the #fragment of a deep link. */
function linkParams(url: string) {
  const params = new Map<string, string>()
  const hashIndex = url.indexOf('#')
  const queryIndex = url.indexOf('?')
  const parts = [
    queryIndex >= 0 ? url.slice(queryIndex + 1, hashIndex >= 0 && hashIndex > queryIndex ? hashIndex : undefined) : '',
    hashIndex >= 0 ? url.slice(hashIndex + 1) : '',
  ]
  for (const part of parts) {
    new URLSearchParams(part).forEach((value, key) => params.set(key, value))
  }
  return params
}

/**
 * Handles Supabase auth redirects (email confirmation, later invites/recovery):
 * - implicit flow: #access_token=…&refresh_token=…&type=signup
 * - PKCE flow:     ?code=…
 * - failures:      #error=…&error_code=otp_expired&error_description=…
 * Returns 'none' for any other URL so normal deep links are untouched.
 */
export async function consumeAuthLink(url: string): Promise<AuthLinkResult> {
  const params = linkParams(url)

  if (params.has('error') || params.has('error_code')) {
    return {
      kind: 'error',
      code: params.get('error_code') ?? params.get('error') ?? null,
      description: params.get('error_description') ?? null,
    }
  }

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    if (error) return { kind: 'error', code: error.code ?? null, description: error.message }
    return { kind: 'signed-in', type: params.get('type') ?? null }
  }

  const code = params.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return { kind: 'error', code: error.code ?? null, description: error.message }
    // PKCE links don't carry `type`; this app only sends signup links that way.
    return { kind: 'signed-in', type: params.get('type') ?? 'signup' }
  }

  return { kind: 'none' }
}
