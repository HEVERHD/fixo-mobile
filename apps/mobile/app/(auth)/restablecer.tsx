import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, type TextInputInstance } from 'react-native'
import { router } from 'expo-router'
import { LockKeyhole } from 'lucide-react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { TextField } from '@/components/TextField'
import { AuthLayout, PrimaryButton } from '@/components/AuthLayout'

const schema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { path: ['confirm'], message: 'Las contraseñas no coinciden' })
type FormData = z.infer<typeof schema>

function updateErrorMessage(code: string | undefined, message: string) {
  const m = message.toLowerCase()
  if (code === 'same_password' || m.includes('different from the old')) return 'La contraseña nueva debe ser distinta a la anterior.'
  if (code === 'weak_password' || m.includes('password')) return 'La contraseña no cumple los requisitos. Usa al menos 8 caracteres.'
  if (code === 'session_not_found' || m.includes('session')) {
    return 'El enlace no es válido o ya venció. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".'
  }
  return 'No pudimos guardar la contraseña. Inténtalo de nuevo.'
}

/**
 * Step 2 of password recovery, opened by the emailed link (fixo://restablecer#access_token=…&type=recovery).
 * AuthLinkHandler signs the user in from the link; the root layout keeps them here
 * until the new password is saved.
 */
export default function RestablecerScreen() {
  const [loading, setLoading] = useState(false)
  const confirmRef = useRef<TextInputInstance>(null)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    setLoading(false)

    if (error) {
      Alert.alert('No se pudo cambiar', updateErrorMessage(error.code, error.message))
      return
    }
    // Leaving this screen lets the root layout route the (already signed-in) user to their area
    Alert.alert('Contraseña actualizada', 'Ya puedes usar tu nueva contraseña.', [
      { text: 'Continuar', onPress: () => router.replace('/') },
    ])
  }

  const submit = () => handleSubmit(onSubmit)()

  async function cancel() {
    // The recovery link signed the user in; don't leave that session open if they back out
    await supabase.auth.signOut()
    router.replace('/(auth)/login')
  }

  return (
    <AuthLayout title="Crea una contraseña nueva" subtitle="Elige una contraseña que no hayas usado antes." compact>
      <View className="gap-5">
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Contraseña nueva"
              icon={LockKeyhole}
              placeholder="Mínimo 8 caracteres"
              secure
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => confirmRef.current?.focus()}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirm"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              ref={confirmRef}
              label="Repite la contraseña"
              icon={LockKeyhole}
              placeholder="Escríbela otra vez"
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
              error={errors.confirm?.message}
            />
          )}
        />
      </View>

      <PrimaryButton label="Guardar contraseña" onPress={submit} loading={loading} className="mt-8" />

      <View className="flex-row justify-center items-center mt-6">
        <TouchableOpacity onPress={cancel} hitSlop={8} accessibilityRole="link">
          <Text className="text-sm font-semibold text-primary">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  )
}
