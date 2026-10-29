import type { ReactNode } from 'react'
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Constants from 'expo-constants'
import { ArrowRight, ChevronLeft } from 'lucide-react-native'
import { Animation } from '@/components/Animation'

/**
 * Shared shell for auth screens: navy brand header + white bottom sheet,
 * scrolled so the focused field stays above the keyboard.
 */
export function AuthLayout({
  title, subtitle, children, compact = false, showBack = false,
}: {
  title: string
  subtitle: string
  children: ReactNode
  /** Smaller header for long forms. */
  compact?: boolean
  showBack?: boolean
}) {
  const insets = useSafeAreaInsets()

  return (
    <View className="flex-1 bg-navy">
      <StatusBar style="light" />

      {/* Decorative brand shapes */}
      <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
        <View className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary opacity-25" />
        <View className="absolute top-40 -left-20 w-48 h-48 rounded-full bg-accent opacity-10" />
        <View className="absolute top-16 left-10 w-3 h-3 rounded-full bg-highlight opacity-80" />
      </View>

      {showBack && (
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          style={{ top: insets.top + 8 }}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
        >
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
      )}

      <KeyboardAwareScrollView
        bottomOffset={96}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand header */}
        <View
          className={`flex-1 items-center justify-end px-6 ${compact ? 'pb-6' : 'pb-10'}`}
          style={{ paddingTop: insets.top + (compact ? 56 : 32) }}
        >
          {(() => {
            const logo = (
              <Image
                source={require('@/assets/splash-icon.png')}
                className={compact ? 'w-12 h-12 mb-3' : 'w-20 h-20 mb-5'}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            )
            // The full header (login) gets the brand animation; long forms keep the small logo
            return compact ? logo : (
              <View className="mb-2">
                <Animation name="login" size={180} fallback={logo} />
              </View>
            )
          })()}
          <Text className={`${compact ? 'text-2xl' : 'text-4xl'} font-extrabold tracking-tight text-white`}>
            Fixo
          </Text>
          {!compact && (
            <Text className="text-sm text-blue-200 mt-2 text-center">
              Gestión de servicios de campo
            </Text>
          )}
        </View>

        {/* Form sheet */}
        <View
          className="bg-white rounded-t-[32px] px-6 pt-8"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <Text className="text-2xl font-bold text-gray-900">{title}</Text>
          <Text className="text-sm text-gray-500 mt-1 mb-7">{subtitle}</Text>
          {children}
          <Text className="text-xs text-gray-400 text-center mt-8">
            Fixo v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  )
}

export function PrimaryButton({
  label, onPress, loading = false, className = '',
}: {
  label: string
  onPress: () => void
  loading?: boolean
  className?: string
}) {
  return (
    <TouchableOpacity
      className={`h-14 rounded-2xl bg-primary flex-row items-center justify-center ${loading ? 'opacity-70' : ''} ${className}`}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: loading }}
    >
      {loading
        ? <ActivityIndicator color="#fff" />
        : (
          <>
            <Text className="text-white font-semibold text-base mr-2">{label}</Text>
            <ArrowRight size={18} color="#fff" strokeWidth={2.2} />
          </>
        )
      }
    </TouchableOpacity>
  )
}
