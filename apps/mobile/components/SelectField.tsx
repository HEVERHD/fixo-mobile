import { useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronDown, Check, Search, X, CircleAlert, type LucideIcon } from 'lucide-react-native'
import { colors } from '@/lib/theme'

export interface SelectOption {
  id: string
  label: string
  sublabel?: string | null
}

/**
 * Field that opens a searchable bottom-sheet style list. Better than a native
 * picker for long lists (clients, assets) on small screens.
 */
export function SelectField({
  label, icon: Icon, placeholder, options, value, onChange, error,
  disabled = false, emptyText = 'No hay opciones', allowClear = false, optional = false,
}: {
  label: string
  icon: LucideIcon
  placeholder: string
  options: SelectOption[]
  value: string | null
  onChange: (id: string | null) => void
  error?: string
  disabled?: boolean
  emptyText?: string
  allowClear?: boolean
  optional?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const insets = useSafeAreaInsets()
  const selected = options.find(o => o.id === value) ?? null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q))
  }, [options, query])

  const border = error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
  const close = () => { setOpen(false); setQuery('') }

  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-2">
        {label}{optional && <Text className="text-gray-400 font-normal"> (opcional)</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
        className={`flex-row items-center min-h-14 rounded-2xl border px-4 py-2 ${border} ${disabled ? 'opacity-50' : ''}`}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
      >
        <Icon size={20} color={error ? '#f87171' : '#9ca3af'} strokeWidth={1.8} />
        <View className="flex-1 ml-3">
          <Text className={`text-base ${selected ? 'text-gray-900' : 'text-gray-400'}`} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
          {selected?.sublabel && <Text className="text-xs text-gray-500" numberOfLines={1}>{selected.sublabel}</Text>}
        </View>
        {allowClear && selected ? (
          <TouchableOpacity onPress={() => onChange(null)} hitSlop={10} accessibilityLabel={`Quitar ${label}`}>
            <X size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : (
          <ChevronDown size={18} color="#9ca3af" />
        )}
      </TouchableOpacity>
      {error && (
        <View className="flex-row items-center mt-1.5">
          <CircleAlert size={14} color="#ef4444" strokeWidth={2.2} />
          <Text className="text-red-500 text-xs ml-1">{error}</Text>
        </View>
      )}

      <Modal visible={open} animationType="slide" transparent statusBarTranslucent onRequestClose={close}>
        <View className="flex-1 bg-black/40 justify-end">
          <TouchableOpacity className="flex-1" onPress={close} accessibilityLabel="Cerrar" />
          <View className="bg-white rounded-t-3xl max-h-[80%]" style={{ paddingBottom: insets.bottom + 8 }}>
            <View className="items-center pt-3">
              <View className="w-10 h-1 rounded-full bg-gray-300" />
            </View>
            <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
              <Text className="text-lg font-bold text-gray-900">{label}</Text>
              <TouchableOpacity onPress={close} hitSlop={10} accessibilityLabel="Cerrar">
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {options.length > 6 && (
              <View className="flex-row items-center h-12 mx-5 mb-2 rounded-2xl border border-gray-200 bg-gray-50 px-4">
                <Search size={18} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 py-0 text-base text-gray-900"
                  placeholder="Buscar"
                  placeholderTextColor="#9ca3af"
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                />
              </View>
            )}
            <FlatList
              data={filtered}
              keyExtractor={o => o.id}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="px-3 pb-2"
              ListEmptyComponent={<Text className="text-center text-gray-500 py-8">{emptyText}</Text>}
              renderItem={({ item }) => {
                const active = item.id === value
                return (
                  <TouchableOpacity
                    onPress={() => { onChange(item.id); close() }}
                    className={`flex-row items-center px-3 py-3.5 rounded-xl ${active ? 'bg-blue-50' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <View className="flex-1">
                      <Text className={`text-base ${active ? 'font-semibold text-primary' : 'text-gray-900'}`}>{item.label}</Text>
                      {item.sublabel && <Text className="text-sm text-gray-500">{item.sublabel}</Text>}
                    </View>
                    {active && <Check size={20} color={colors.primary} strokeWidth={2.4} />}
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}
