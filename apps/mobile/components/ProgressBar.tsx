import { View, Text } from 'react-native'

/** Thin progress bar with the percentage on the right. */
export function ProgressBar({ value, barClass = 'bg-primary' }: { value: number; barClass?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <View className="flex-row items-center" accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <View className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <View className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </View>
      <Text className="text-xs font-semibold text-gray-700 ml-2 w-9 text-right">{pct}%</Text>
    </View>
  )
}
