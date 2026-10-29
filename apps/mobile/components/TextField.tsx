import { useState, type Ref } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  type TextInputProps, type TextInputInstance,
} from 'react-native'
import { Eye, EyeOff, CircleAlert, type LucideIcon } from 'lucide-react-native'
import { colors } from '@/lib/theme'

type Props = TextInputProps & {
  label: string
  icon: LucideIcon
  error?: string
  /** Renders a show/hide toggle and masks the value by default. */
  secure?: boolean
  ref?: Ref<TextInputInstance>
}

export function TextField({ label, icon: Icon, error, secure, ref, onFocus, onBlur, ...inputProps }: Props) {
  const [focused, setFocused] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const border = error
    ? 'border-red-400 bg-red-50'
    : focused
      ? 'border-primary bg-white'
      : 'border-gray-200 bg-gray-50'
  const iconColor = error ? '#f87171' : focused ? colors.primary : '#9ca3af'
  const RevealIcon = revealed ? EyeOff : Eye

  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      <View
        className={`flex-row rounded-2xl border px-4 ${border} ${
          inputProps.multiline ? 'items-start min-h-28 py-3.5' : 'items-center h-14'
        }`}
      >
        <Icon size={20} color={iconColor} strokeWidth={1.8} />
        <TextInput
          ref={ref}
          className={`flex-1 ml-3 py-0 text-base text-gray-900 ${inputProps.multiline ? 'min-h-20' : ''}`}
          textAlignVertical={inputProps.multiline ? 'top' : 'center'}
          placeholderTextColor="#9ca3af"
          secureTextEntry={secure && !revealed}
          onFocus={e => { setFocused(true); onFocus?.(e) }}
          onBlur={e => { setFocused(false); onBlur?.(e) }}
          {...inputProps}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setRevealed(v => !v)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={12}
          >
            <RevealIcon size={21} color="#6b7280" strokeWidth={1.8} />
          </TouchableOpacity>
        )}
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
