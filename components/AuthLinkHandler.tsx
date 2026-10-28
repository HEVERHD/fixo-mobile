import { useEffect, useRef, useState } from 'react'
import { Text } from 'react-native'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { PartyPopper, Clock } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { consumeAuthLink } from '@/lib/authLinks'
import { FeedbackModal } from '@/components/FeedbackModal'

type Notice =
  | { kind: 'verified'; name: string | null; organization: string | null }
  | { kind: 'link-error'; expired: boolean }

/**
 * Listens for auth deep links (e.g. the email confirmation link opening
 * fixo://login#access_token=…), signs the user in and greets them.
 * Routing to the right area is still done by the root layout on session change.
 */
export function AuthLinkHandler() {
  const url = Linking.useURL()
  const handled = useRef(new Set<string>())
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    if (!url || handled.current.has(url)) return
    handled.current.add(url)

    consumeAuthLink(url).then(async result => {
      if (result.kind === 'error') {
        setNotice({ kind: 'link-error', expired: result.code === 'otp_expired' })
        return
      }
      if (result.kind !== 'signed-in' || result.type !== 'signup') return

      // RLS: a member can read their own profile and organization.
      const [{ data: { user } }, { data: org }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('organizations').select('name').maybeSingle(),
      ])
      const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim() || null
      setNotice({ kind: 'verified', name: fullName?.split(' ')[0] ?? null, organization: org?.name ?? null })
    })
  }, [url])

  const close = () => setNotice(null)

  if (notice?.kind === 'verified') {
    return (
      <FeedbackModal
        visible
        variant="success"
        icon={PartyPopper}
        title={notice.name ? `¡Bienvenido, ${notice.name}!` : '¡Bienvenido a Fixo!'}
        actionLabel="Empezar"
        onAction={close}
      >
        <Text className="text-base text-gray-600 text-center">
          Tu correo fue verificado y tu cuenta ya está activa.
        </Text>
        {notice.organization && (
          <Text className="text-base text-gray-600 text-center mt-2">
            <Text className="font-semibold text-gray-900">{notice.organization}</Text> está lista para gestionar
            órdenes, activos y clientes.
          </Text>
        )}
      </FeedbackModal>
    )
  }

  if (notice?.kind === 'link-error') {
    return (
      <FeedbackModal
        visible
        variant="warning"
        icon={Clock}
        title={notice.expired ? 'El enlace ya no es válido' : 'No pudimos verificar el enlace'}
        actionLabel="Ir a iniciar sesión"
        onAction={() => { close(); router.replace('/(auth)/login') }}
      >
        <Text className="text-base text-gray-600 text-center">
          {notice.expired
            ? 'Este enlace venció o ya fue usado. Si ya confirmaste tu correo, simplemente inicia sesión.'
            : 'Intenta iniciar sesión. Si el problema continúa, regístrate de nuevo para recibir otro enlace.'}
        </Text>
      </FeedbackModal>
    )
  }

  return null
}
