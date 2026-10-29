import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { MailQuestion } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { PrimaryButton } from '@/components/AuthLayout'
import { SignOutButton } from '@/components/ui'
import { Animation } from '@/components/Animation'
import { useModal } from '@/components/AppModal'

/**
 * Signed in, but the account belongs to no company yet (e.g. signed up before
 * being invited, or with a different email). The root layout routes here.
 */
export default function SinAcceso() {
  const [email, setEmail] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const modal = useModal()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setEmail(user?.email ?? null))
  }, [])

  async function checkAgain() {
    setChecking(true)
    const { data: role, error } = await supabase.rpc('claim_my_invitation')
    if (role) {
      // Token refresh fires onAuthStateChange, so the root layout re-reads the role and routes
      await supabase.auth.refreshSession()
      setChecking(false)
      return
    }
    setChecking(false)
    modal.alert({
      variant: 'warning',
      title: 'Sin invitación',
      message: error?.message ?? `Aún no hay una invitación vigente para ${email ?? 'tu correo'}. Pide al administrador de tu empresa que te invite con este correo.`,
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 justify-center">
        <View className="items-center">
          <Animation
            name="waiting"
            size={160}
            fallback={
              <View className="w-20 h-20 rounded-full bg-amber-100 items-center justify-center mb-5">
                <MailQuestion size={36} color="#d97706" strokeWidth={1.8} />
              </View>
            }
          />
          <Text className="text-2xl font-bold text-gray-900 text-center">Tu cuenta aún no tiene empresa</Text>
          <Text className="text-base text-gray-600 text-center mt-3">
            Iniciaste sesión como
          </Text>
          <Text className="text-base font-semibold text-gray-900 text-center">{email ?? ' '}</Text>
          <Text className="text-sm text-gray-500 text-center mt-3">
            Para entrar, el administrador de tu empresa debe invitarte con este mismo correo desde Fixo. Cuando lo
            haga, toca “Volver a revisar”.
          </Text>
        </View>

        <PrimaryButton label="Volver a revisar" onPress={checkAgain} loading={checking} className="mt-8" />
        <View className="mt-3">
          <SignOutButton />
        </View>
      </View>
    </SafeAreaView>
  )
}
