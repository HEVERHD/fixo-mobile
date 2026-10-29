import { View, Text, TouchableOpacity } from 'react-native'
import { Wrench, HardHat, Layers, CircleAlert, type LucideIcon } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { BUSINESS_TYPES, type BusinessType } from '@/lib/organization'

const ICONS: Record<BusinessType, LucideIcon> = {
  mantenimiento: Wrench,
  construccion: HardHat,
  ambos: Layers,
}

/** Large tappable cards to choose what the company does. */
export function BusinessTypePicker({
  label = '¿A qué se dedica tu empresa?', value, onChange, error,
}: {
  label?: string
  value: BusinessType | null
  onChange: (type: BusinessType) => void
  error?: string
}) {
  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      <View className="gap-2" accessibilityRole="radiogroup">
        {(Object.keys(BUSINESS_TYPES) as BusinessType[]).map(type => {
          const active = type === value
          const Icon = ICONS[type]
          return (
            <TouchableOpacity
              key={type}
              onPress={() => onChange(type)}
              activeOpacity={0.8}
              className={`flex-row items-center rounded-2xl border p-3.5 ${
                active ? 'border-primary bg-blue-50' : error ? 'border-red-300 bg-white' : 'border-gray-200 bg-white'
              }`}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <View className={`w-10 h-10 rounded-xl items-center justify-center ${active ? 'bg-primary' : 'bg-gray-100'}`}>
                <Icon size={20} color={active ? '#fff' : '#6b7280'} strokeWidth={2} />
              </View>
              <View className="flex-1 ml-3">
                <Text className={`font-semibold ${active ? 'text-primary' : 'text-gray-900'}`}>{BUSINESS_TYPES[type].label}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">{BUSINESS_TYPES[type].description}</Text>
              </View>
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${active ? 'border-primary' : 'border-gray-300'}`}
              >
                {active && <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.primary }} />}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
      {error && (
        <View className="flex-row items-center mt-1.5">
          <CircleAlert size={14} color="#ef4444" strokeWidth={2.2} />
          <Text className="text-red-500 text-xs ml-1">{error}</Text>
        </View>
      )}
    </View>
  )
}
