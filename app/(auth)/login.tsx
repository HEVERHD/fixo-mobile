import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, type TextInputInstance } from 'react-native'
import { Link } from 'expo-router'
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

export default function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<TextInputInstance>(null)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Error', 'Credenciales incorrectas. Verifica tu email y contraseña.')
    }
    // On success, _layout.tsx detects the session change and navigates automatically
  }

  const submit = () => handleSubmit(onSubmit)()

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

      <PrimaryButton label="Ingresar" onPress={submit} loading={loading} className="mt-8" />

      <View className="flex-row justify-center items-center mt-6">
        <Text className="text-sm text-gray-500">¿Tu empresa aún no usa Fixo? </Text>
        <Link href="/(auth)/registro" asChild>
          <TouchableOpacity hitSlop={8} accessibilityRole="link">
            <Text className="text-sm font-semibold text-primary">Regístrala</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AuthLayout>
  )
}
