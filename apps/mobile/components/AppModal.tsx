import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import Animated, { ZoomIn } from 'react-native-reanimated'
import {
  CircleCheckBig, CircleX, TriangleAlert, Info, CircleHelp, type LucideIcon,
} from 'lucide-react-native'
import { Animation } from '@/components/Animation'
import type { AnimationName } from '@/lib/animations'

export type ModalVariant = 'success' | 'error' | 'warning' | 'info' | 'confirm'

const VARIANTS: Record<ModalVariant, {
  ring: string; circle: string; button: string; icon: LucideIcon; animation?: AnimationName
}> = {
  success: { ring: 'bg-green-50', circle: 'bg-green-500', button: 'bg-primary', icon: CircleCheckBig, animation: 'success' },
  error:   { ring: 'bg-red-50',   circle: 'bg-red-500',   button: 'bg-navy',    icon: CircleX,        animation: 'error' },
  warning: { ring: 'bg-amber-50', circle: 'bg-amber-500', button: 'bg-navy',    icon: TriangleAlert },
  info:    { ring: 'bg-blue-50',  circle: 'bg-primary',   button: 'bg-primary', icon: Info },
  confirm: { ring: 'bg-blue-50',  circle: 'bg-primary',   button: 'bg-primary', icon: CircleHelp },
}

export interface AppModalProps {
  visible: boolean
  variant: ModalVariant
  title: string
  /** Body: plain text or custom content (rich text, a QR code…). */
  children?: ReactNode
  /** Overrides the variant's icon (also the fallback when the animation is missing). */
  icon?: LucideIcon
  /** Overrides the variant's Lottie animation; `null` shows the static icon. */
  animation?: AnimationName | null
  actionLabel: string
  onAction: () => void
  /** Red main button, for actions that can't be undone. */
  destructive?: boolean
  loading?: boolean
  /** Optional text button under the main action (e.g. "Ahora no"). */
  secondaryLabel?: string
  onSecondary?: () => void
  /** Android back button / tap outside. Defaults to the secondary action, else the main one. */
  onDismiss?: () => void
}

/**
 * Centered card modal used across the app for success moments, errors,
 * warnings and confirmations. For one-off prompts prefer `useModal()`.
 */
export function AppModal({
  visible, variant, title, children, icon, animation, actionLabel, onAction,
  destructive = false, loading = false, secondaryLabel, onSecondary, onDismiss,
}: AppModalProps) {
  const v = VARIANTS[variant]
  const Icon = icon ?? v.icon
  const anim = animation === undefined ? v.animation : animation
  const dismiss = onDismiss ?? onSecondary ?? onAction

  const badge = (
    <View className={`w-24 h-24 rounded-full items-center justify-center mb-5 ${destructive ? 'bg-red-50' : v.ring}`}>
      <View className={`w-16 h-16 rounded-full items-center justify-center ${destructive ? 'bg-red-500' : v.circle}`}>
        <Icon size={32} color="#fff" strokeWidth={2.4} />
      </View>
    </View>
  )

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <Animated.View
          entering={ZoomIn.springify().damping(14)}
          className="w-full bg-white rounded-3xl px-6 pt-8 pb-6 items-center"
          accessibilityViewIsModal
        >
          {anim ? <Animation name={anim} size={128} loop={false} fallback={badge} /> : badge}

          <Text className="text-2xl font-bold text-gray-900 text-center" accessibilityRole="header">
            {title}
          </Text>
          <View className="mt-2 mb-7 w-full">
            {typeof children === 'string'
              ? <Text className="text-base text-gray-600 text-center">{children}</Text>
              : children}
          </View>

          <TouchableOpacity
            onPress={onAction}
            disabled={loading}
            activeOpacity={0.85}
            className={`w-full h-14 rounded-2xl items-center justify-center ${destructive ? 'bg-red-600' : v.button} ${loading ? 'opacity-70' : ''}`}
            accessibilityRole="button"
            accessibilityState={{ busy: loading, disabled: loading }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-semibold text-base">{actionLabel}</Text>}
          </TouchableOpacity>
          {secondaryLabel && onSecondary && (
            <TouchableOpacity onPress={onSecondary} disabled={loading} hitSlop={8} className="mt-4" accessibilityRole="button">
              <Text className="text-gray-500 font-medium text-base">{secondaryLabel}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

// -----------------------------------------------------------------------------
// Imperative API: a branded replacement for Alert.alert
// -----------------------------------------------------------------------------

interface ShowOptions {
  variant?: ModalVariant
  title: string
  message?: ReactNode
  icon?: LucideIcon
  animation?: AnimationName | null
  actionLabel?: string
  secondaryLabel?: string
  destructive?: boolean
}

type ModalResult = 'action' | 'secondary' | 'dismiss'

interface ModalApi {
  /** Shows a modal and resolves with how it was closed. */
  show: (options: ShowOptions) => Promise<ModalResult>
  /** Shows a message with a single "Entendido" button. */
  alert: (options: Omit<ShowOptions, 'secondaryLabel'>) => Promise<void>
  /** Asks a yes/no question; resolves true only when the main button is tapped. */
  confirm: (options: Omit<ShowOptions, 'variant'> & { cancelLabel?: string }) => Promise<boolean>
}

const ModalContext = createContext<ModalApi | null>(null)

/** Mount once near the root (app/_layout.tsx). */
export function ModalProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ShowOptions | null>(null)
  const resolver = useRef<((result: ModalResult) => void) | null>(null)

  const close = useCallback((result: ModalResult) => {
    resolver.current?.(result)
    resolver.current = null
    setCurrent(null)
  }, [])

  const show = useCallback((options: ShowOptions) => {
    // A new modal replaces an open one; the old promise resolves as dismissed
    resolver.current?.('dismiss')
    setCurrent(options)
    return new Promise<ModalResult>(resolve => { resolver.current = resolve })
  }, [])

  const api = useMemo<ModalApi>(() => ({
    show,
    alert: async options => { await show({ variant: 'info', actionLabel: 'Entendido', ...options }) },
    confirm: async ({ cancelLabel = 'Cancelar', ...options }) =>
      (await show({ variant: 'confirm', actionLabel: 'Confirmar', secondaryLabel: cancelLabel, ...options })) === 'action',
  }), [show])

  return (
    <ModalContext.Provider value={api}>
      {children}
      {current && (
        <AppModal
          visible
          variant={current.variant ?? 'info'}
          title={current.title}
          icon={current.icon}
          animation={current.animation}
          destructive={current.destructive}
          actionLabel={current.actionLabel ?? 'Entendido'}
          onAction={() => close('action')}
          secondaryLabel={current.secondaryLabel}
          onSecondary={current.secondaryLabel ? () => close('secondary') : undefined}
          onDismiss={() => close('dismiss')}
        >
          {current.message}
        </AppModal>
      )}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const api = useContext(ModalContext)
  if (!api) throw new Error('useModal must be used inside <ModalProvider>')
  return api
}
