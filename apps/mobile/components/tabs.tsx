import type { ColorValue } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { colors } from '@/lib/theme'

// Shared look for every role's bottom tab bar.
export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: '#9ca3af',
  tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#f3f4f6' },
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
} as const

/** Lucide icon for a tab: thicker stroke when the tab is active. */
export function tabIcon(Icon: LucideIcon) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <Icon
        size={22}
        color={typeof color === 'string' ? color : undefined}
        strokeWidth={focused ? 2.4 : 1.8}
      />
    )
  }
}
