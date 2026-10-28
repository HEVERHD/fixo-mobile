import type { ReactNode } from 'react'
import { Modal, View, Text, TouchableOpacity } from 'react-native'
import Animated, { ZoomIn } from 'react-native-reanimated'
import type { LucideIcon } from 'lucide-react-native'

const VARIANTS = {
  success: { ring: 'bg-green-50', circle: 'bg-green-500', button: 'bg-primary' },
  warning: { ring: 'bg-amber-50', circle: 'bg-amber-500', button: 'bg-navy' },
} as const

/** Centered card modal for one-off moments (welcome, expired link…). */
export function FeedbackModal({
  visible, variant, icon: Icon, title, children, actionLabel, onAction, secondaryLabel, onSecondary,
}: {
  visible: boolean
  variant: keyof typeof VARIANTS
  icon: LucideIcon
  title: string
  children: ReactNode
  actionLabel: string
  onAction: () => void
  /** Optional text button under the main action (e.g. "Ahora no"). */
  secondaryLabel?: string
  onSecondary?: () => void
}) {
  const v = VARIANTS[variant]

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onAction}>
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <Animated.View
          entering={ZoomIn.springify().damping(14)}
          className="w-full bg-white rounded-3xl px-6 pt-8 pb-6 items-center"
          accessibilityViewIsModal
        >
          <View className={`w-24 h-24 rounded-full items-center justify-center mb-5 ${v.ring}`}>
            <View className={`w-16 h-16 rounded-full items-center justify-center ${v.circle}`}>
              <Icon size={32} color="#fff" strokeWidth={2.4} />
            </View>
          </View>

          <Text className="text-2xl font-bold text-gray-900 text-center" accessibilityRole="header">
            {title}
          </Text>
          <View className="mt-2 mb-7">{children}</View>

          <TouchableOpacity
            onPress={onAction}
            activeOpacity={0.85}
            className={`w-full h-14 rounded-2xl items-center justify-center ${v.button}`}
            accessibilityRole="button"
          >
            <Text className="text-white font-semibold text-base">{actionLabel}</Text>
          </TouchableOpacity>
          {secondaryLabel && onSecondary && (
            <TouchableOpacity onPress={onSecondary} hitSlop={8} className="mt-4" accessibilityRole="button">
              <Text className="text-gray-500 font-medium text-base">{secondaryLabel}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}
