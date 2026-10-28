import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, type TextInputInstance } from 'react-native'
import { router } from 'expo-router'
import * as Linking from 'expo-linking'
import { Building2, UserRound, Mail, LockKeyhole, MailCheck } from 'lucide-react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'
import { TextField } from '@/components/TextField'
import { AuthLayout, PrimaryButton } from '@/components/AuthLayout'

const schema = z.object({
  organizationName: z.string().trim().min(2, 'Escribe el nombre de tu empresa'),
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
  if (m.includes('signups not allowed')) return 'El registro de empresas está deshabilitado por ahora.'
  return 'No pudimos crear la cuenta. Inténtalo de nuevo.'
}

export default function RegistroScreen() {
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const fullNameRef = useRef<TextInputInstance>(null)
  const emailRef = useRef<TextInputInstance>(null)
  const passwordRef = useRef<TextInputInstance>(null)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    // handle_new_user() (DB trigger) creates the organization from
    // organization_name and makes this user its admin.
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { organization_name: data.organizationName, full_name: data.fullName },
        // Confirmation link opens the app (fixo://login) instead of the default Site URL.
        // The URL must be listed in Supabase → Authentication → URL Configuration → Redirect URLs.
        emailRedirectTo: Linking.createURL('/login'),
      },
    })
    setLoading(false)

    if (error) {
      Alert.alert('No se pudo registrar', signUpErrorMessage(error.message))
      return
    }
    // With email confirmation on there is no session yet; otherwise
    // _layout.tsx picks up the new session and routes to the admin area.
    if (!result.session) setSentTo(data.email)
  }

  const submit = () => handleSubmit(onSubmit)()

  if (sentTo) {
    return (
      <AuthLayout title="Revisa tu correo" subtitle="Ya casi terminamos." compact>
        <View className="items-center py-2">
          <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
            <MailCheck size={30} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text className="text-base text-gray-700 text-center">
            Enviamos un enlace de confirmación a
          </Text>
          <Text className="text-base font-semibold text-gray-900 text-center mt-1">{sentTo}</Text>
          <Text className="text-sm text-gray-500 text-center mt-3">
            Ábrelo para activar tu cuenta y luego inicia sesión. Si no lo ves, revisa la carpeta de spam.
          </Text>
        </View>
        <PrimaryButton label="Ir a iniciar sesión" onPress={() => router.replace('/(auth)/login')} className="mt-8" />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Registra tu empresa"
      subtitle="Crea la cuenta de tu empresa. Serás su administrador."
      compact
      showBack
    >
      <View className="gap-5">
        <Controller
          control={control}
          name="organizationName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Nombre de la empresa"
              icon={Building2}
              placeholder="Ej. Servicios Técnicos S.A.S."
              autoCapitalize="words"
              autoComplete="organization"
              textContentType="organizationName"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => fullNameRef.current?.focus()}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.organizationName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              ref={fullNameRef}
              label="Tu nombre"
              icon={UserRound}
              placeholder="Nombre y apellido"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => emailRef.current?.focus()}
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
              placeholder="tu@empresa.com"
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

      <PrimaryButton label="Crear empresa" onPress={submit} loading={loading} className="mt-8" />

      <View className="flex-row justify-center items-center mt-6">
        <Text className="text-sm text-gray-500">¿Ya tienes cuenta? </Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} accessibilityRole="link">
          <Text className="text-sm font-semibold text-primary">Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  )
}
