import { useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as Linking from 'expo-linking'
import { Mail, MailCheck } from 'lucide-react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'
import { TextField } from '@/components/TextField'
import { AuthLayout, PrimaryButton } from '@/components/AuthLayout'

const schema = z.object({
  email: z.string().trim().email('Email inválido'),
})
type FormData = z.infer<typeof schema>

function recoveryErrorMessage(code: string | undefined, message: string) {
  const m = message.toLowerCase()
  if (code?.startsWith('over_') || m.includes('rate limit') || m.includes('security purposes')) {
    return 'Ya enviamos un enlace hace poco. Espera un momento y vuelve a intentarlo.'
  }
  return 'No pudimos enviar el enlace. Inténtalo de nuevo.'
}

/**
 * Step 1 of password recovery: emails a link that opens app/(auth)/restablecer.tsx.
 * The link must be allowed in Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export default function RecuperarScreen() {
  const { email: initialEmail } = useLocalSearchParams<{ email?: string }>()
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: initialEmail ?? '' },
  })

  async function onSubmit(data: FormData) {
    const email = data.email.trim().toLowerCase()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('/restablecer'),
    })
    setLoading(false)

    if (error) {
      Alert.alert('No se pudo enviar', recoveryErrorMessage(error.code, error.message))
      return
    }
    // Supabase answers the same for unknown emails, so don't reveal whether the account exists
    setSentTo(email)
  }

  const submit = () => handleSubmit(onSubmit)()

  if (sentTo) {
    return (
      <AuthLayout title="Revisa tu correo" subtitle="Te ayudamos a recuperar el acceso." compact>
        <View className="items-center py-2">
          <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
            <MailCheck size={30} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text className="text-base text-gray-700 text-center">
            Si existe una cuenta con este correo, enviamos un enlace a
          </Text>
          <Text className="text-base font-semibold text-gray-900 text-center mt-1">{sentTo}</Text>
          <Text className="text-sm text-gray-500 text-center mt-3">
            Ábrelo desde este teléfono para crear una contraseña nueva. Si no lo ves, revisa la carpeta de spam.
          </Text>
        </View>
        <PrimaryButton label="Volver a iniciar sesión" onPress={() => router.replace('/(auth)/login')} className="mt-8" />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Recupera tu contraseña"
      subtitle="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva."
      compact
      showBack
    >
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Correo electrónico"
            icon={Mail}
            placeholder="usuario@empresa.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={submit}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <PrimaryButton label="Enviar enlace" onPress={submit} loading={loading} className="mt-8" />

      <View className="flex-row justify-center items-center mt-6">
        <Text className="text-sm text-gray-500">¿La recordaste? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} hitSlop={8} accessibilityRole="link">
          <Text className="text-sm font-semibold text-primary">Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  )
}
