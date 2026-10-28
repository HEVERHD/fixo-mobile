import { View, Text, TouchableOpacity } from 'react-native'

export interface ChipOption<T extends string> {
  value: T
  label: string
  /** Tailwind classes for the selected state, e.g. 'bg-red-500 border-red-500'. */
  activeClass?: string
}

/** Single-choice row of tappable chips (type, priority, date shortcuts…). */
export function ChipGroup<T extends string>({
  label, options, value, onChange,
}: {
  label: string
  options: ChipOption<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
        {options.map(o => {
          const active = o.value === value
          return (
            <TouchableOpacity
              key={o.value}
              onPress={() => onChange(o.value)}
              activeOpacity={0.8}
              className={`px-4 h-11 rounded-full border items-center justify-center ${
                active ? (o.activeClass ?? 'bg-primary border-primary') : 'bg-white border-gray-200'
              }`}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-700'}`}>{o.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
