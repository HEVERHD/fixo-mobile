import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, type TextInputInstance } from 'react-native'
import { Link, router, type Href } from 'expo-router'
import * as Linking from 'expo-linking'
import { Mail, LockKeyhole } from 'lucide-react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { TextField } from '@/components/TextField'
import { AuthLayout, PrimaryButton } from '@/components/AuthLayout'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

function isRateLimited(code: string | undefined, message: string) {
  const m = message.toLowerCase()
  return !!code?.startsWith('over_') || m.includes('rate limit') || m.includes('security purposes')
}

export default function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<TextInputInstance>(null)

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: Linking.createURL('/login') },
    })
    if (error) {
      Alert.alert('No se pudo reenviar', isRateLimited(error.code, error.message)
        ? 'Ya enviamos un correo hace poco. Espera un momento y vuelve a intentarlo.'
        : 'No pudimos reenviar el correo. Inténtalo de nuevo.')
      return
    }
    Alert.alert('Correo enviado', `Revisa ${email} (y la carpeta de spam) y abre el enlace para activar tu cuenta.`)
  }

  async function onSubmit(data: FormData) {
    const email = data.email.trim().toLowerCase()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: data.password,
    })
    setLoading(false)
    // On success, _layout.tsx detects the session change and navigates automatically
    if (!error) return

    const m = error.message.toLowerCase()
    if (error.code === 'email_not_confirmed' || m.includes('email not confirmed')) {
      Alert.alert('Confirma tu correo', 'Tu cuenta aún no está activa. Abre el enlace que te enviamos al registrarte.', [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Reenviar correo', onPress: () => resendConfirmation(email) },
      ])
    } else if (isRateLimited(error.code, error.message)) {
      Alert.alert('Demasiados intentos', 'Espera unos minutos antes de volver a intentarlo.')
    } else if (error.code === 'invalid_credentials' || m.includes('invalid login credentials')) {
      Alert.alert('Error', 'Credenciales incorrectas. Verifica tu email y contraseña.')
    } else {
      Alert.alert('Error', 'No pudimos iniciar sesión. Revisa tu conexión e inténtalo de nuevo.')
    }
  }

  const submit = () => handleSubmit(onSubmit)()

  const forgotPassword = () =>
    router.push(`/(auth)/recuperar?email=${encodeURIComponent(getValues('email')?.trim() ?? '')}` as Href)

  return (
    <AuthLayout title="Bienvenido" subtitle="Ingresa con tu cuenta para continuar.">
      <View className="gap-5">
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
              placeholder="••••••••"
              secure
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
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

      <TouchableOpacity onPress={forgotPassword} hitSlop={8} accessibilityRole="link" className="self-end mt-3">
        <Text className="text-sm font-semibold text-primary">¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <PrimaryButton label="Ingresar" onPress={submit} loading={loading} className="mt-6" />

      <View className="flex-row justify-center items-center mt-6">
        <Text className="text-sm text-gray-500">¿Tu empresa aún no usa Fixo? </Text>
        <Link href="/(auth)/registro" asChild>
          <TouchableOpacity hitSlop={8} accessibilityRole="link">
            <Text className="text-sm font-semibold text-primary">Regístrala</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View className="flex-row justify-center items-center mt-3">
        <Text className="text-sm text-gray-500">¿Te invitó tu empresa? </Text>
        <Link href="/(auth)/unirme" asChild>
          <TouchableOpacity hitSlop={8} accessibilityRole="link">
            <Text className="text-sm font-semibold text-primary">Crea tu cuenta</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AuthLayout>
  )
}
