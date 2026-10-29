import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, type TextInputInstance } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as Linking from 'expo-linking'
import { UserRound, Mail, LockKeyhole, MailCheck } from 'lucide-react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'
import { TextField } from '@/components/TextField'
import { AuthLayout, PrimaryButton } from '@/components/AuthLayout'

const schema = z.object({
  fullName: z.string().trim().min(2, 'Escribe tu nombre'),
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})
type FormData = z.infer<typeof schema>

function signUpErrorMessage(message: string) {
  const m = message.toLowerCase()
  if (m.includes('already registered')) return 'Ya existe una cuenta con este correo. Inicia sesión.'
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'
  if (m.includes('password')) return 'La contraseña no cumple los requisitos. Usa al menos 8 caracteres.'
  return 'No pudimos crear la cuenta. Inténtalo de nuevo.'
}

/**
 * Sign-up for people invited by a company (technicians, client users).
 * No organization is created: claim_my_invitation() links the account to the
 * inviting company after the email is confirmed (see app/_layout.tsx).
 */
export default function UnirmeScreen() {
  const { email: invitedEmail } = useLocalSearchParams<{ email?: string }>()
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const emailRef = useRef<TextInputInstance>(null)
  const passwordRef = useRef<TextInputInstance>(null)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: invitedEmail ?? '' },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        data: { full_name: data.fullName },
        emailRedirectTo: Linking.createURL('/login'),
      },
    })
    setLoading(false)

    if (error) {
      Alert.alert('No se pudo crear la cuenta', signUpErrorMessage(error.message))
      return
    }
    if (!result.session) setSentTo(data.email.trim().toLowerCase())
  }

  const submit = () => handleSubmit(onSubmit)()

  if (sentTo) {
    return (
      <AuthLayout title="Revisa tu correo" subtitle="Ya casi terminamos." compact>
        <View className="items-center py-2">
          <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
            <MailCheck size={30} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text className="text-base text-gray-700 text-center">Enviamos un enlace de confirmación a</Text>
          <Text className="text-base font-semibold text-gray-900 text-center mt-1">{sentTo}</Text>
          <Text className="text-sm text-gray-500 text-center mt-3">
            Ábrelo desde este teléfono y entrarás directo a la empresa que te invitó. Si no lo ves, revisa la
            carpeta de spam.
          </Text>
        </View>
        <PrimaryButton label="Ir a iniciar sesión" onPress={() => router.replace('/(auth)/login')} className="mt-8" />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Únete a tu empresa"
      subtitle="Crea tu cuenta con el correo en el que te invitaron."
      compact
      showBack
    >
      <View className="gap-5">
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Tu nombre"
              icon={UserRound}
              placeholder="Nombre y apellido"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => (invitedEmail ? passwordRef : emailRef).current?.focus()}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.fullName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              ref={emailRef}
              label="Correo electrónico"
              icon={Mail}
              placeholder="El correo de la invitación"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              ref={passwordRef}
              label="Contraseña"
              icon={LockKeyhole}
              placeholder="Mínimo 8 caracteres"
              secure
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />
      </View>

      <PrimaryButton label="Crear mi cuenta" onPress={submit} loading={loading} className="mt-8" />

      <View className="flex-row justify-center items-center mt-6">
        <Text className="text-sm text-gray-500">¿Ya tienes cuenta? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} hitSlop={8} accessibilityRole="link">
          <Text className="text-sm font-semibold text-primary">Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  )
}
