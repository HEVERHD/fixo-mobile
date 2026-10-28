import { useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, Image, ActivityIndicator, Alert,
  type TextInputInstance,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { Mail, LockKeyhole, ArrowRight } from 'lucide-react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { TextField } from '@/components/TextField'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const insets = useSafeAreaInsets()
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
    <View className="flex-1 bg-navy">
      <StatusBar style="light" />

      {/* Decorative brand shapes */}
      <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
        <View className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary opacity-25" />
        <View className="absolute top-40 -left-20 w-48 h-48 rounded-full bg-accent opacity-10" />
        <View className="absolute top-16 left-10 w-3 h-3 rounded-full bg-highlight opacity-80" />
      </View>

      {/* Scrolls the focused field (plus the submit button below it) above the keyboard */}
      <KeyboardAwareScrollView
        bottomOffset={96}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand header */}
        <View
          className="flex-1 items-center justify-end px-6 pb-10"
          style={{ paddingTop: insets.top + 32 }}
        >
          <Image
            source={require('@/assets/splash-icon.png')}
            className="w-20 h-20 mb-5"
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text className="text-4xl font-extrabold tracking-tight text-white">Fixo</Text>
          <Text className="text-sm text-blue-200 mt-2 text-center">
            Gestión de servicios de campo
          </Text>
        </View>

        {/* Form sheet */}
        <View
          className="bg-white rounded-t-[32px] px-6 pt-8"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <Text className="text-2xl font-bold text-gray-900">Bienvenido</Text>
          <Text className="text-sm text-gray-500 mt-1 mb-7">
            Ingresa con tu cuenta para continuar.
          </Text>

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

          <TouchableOpacity
            className={`h-14 rounded-2xl bg-primary flex-row items-center justify-center mt-8 ${loading ? 'opacity-70' : ''}`}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ busy: loading, disabled: loading }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Text className="text-white font-semibold text-base mr-2">Ingresar</Text>
                  <ArrowRight size={18} color="#fff" strokeWidth={2.2} />
                </>
              )
            }
          </TouchableOpacity>

          <Text className="text-xs text-gray-400 text-center mt-8">
            Fixo v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  )
}
