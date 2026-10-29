import { useState } from 'react'
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView } from 'react-native'
import { TriangleAlert } from 'lucide-react-native'
import type { PlatformOrganization } from '@/lib/platform'

/**
 * Destructive confirmation: lists what will be deleted and only enables the
 * button once the exact company name is typed.
 */
export function DeleteOrganizationModal({
  org, deleting, onCancel, onConfirm,
}: {
  org: PlatformOrganization | null
  deleting: boolean
  onCancel: () => void
  onConfirm: (confirmName: string) => void
}) {
  const [typed, setTyped] = useState('')
  const matches = !!org && typed.trim() === org.name
  const close = () => { setTyped(''); onCancel() }

  const counts = org ? [
    ['usuarios (sus cuentas no podrán volver a entrar)', org.users],
    ['clientes', org.clients],
    ['equipos', org.assets],
    ['obras', org.projects ?? 0],
    ['órdenes de trabajo', org.work_orders],
  ] as const : []

  return (
    <Modal visible={!!org} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex-1 bg-black/50 items-center justify-center px-5">
          <View className="w-full bg-white rounded-3xl p-6">
            <View className="w-14 h-14 rounded-full bg-red-100 items-center justify-center self-center mb-4">
              <TriangleAlert size={28} color="#dc2626" strokeWidth={2.2} />
            </View>
            <Text className="text-xl font-bold text-gray-900 text-center">Eliminar empresa</Text>
            <Text className="text-sm text-gray-600 text-center mt-2">
              Vas a eliminar <Text className="font-semibold text-gray-900">{org?.name}</Text> de forma
              permanente. <Text className="font-semibold text-red-600">Esta acción no se puede deshacer.</Text>
            </Text>

            <View className="bg-red-50 rounded-2xl p-4 mt-4">
              <Text className="text-xs font-semibold text-red-800 mb-1">Se borrará:</Text>
              {counts.map(([label, n]) => (
                <Text key={label} className="text-sm text-red-900">• {n} {label}</Text>
              ))}
            </View>

            <Text className="text-sm text-gray-700 mt-4 mb-2">
              Escribe <Text className="font-semibold">{org?.name}</Text> para confirmar:
            </Text>
            <TextInput
              className="h-12 rounded-2xl border border-gray-300 bg-gray-50 px-4 text-base text-gray-900"
              value={typed}
              onChangeText={setTyped}
              placeholder={org?.name}
              placeholderTextColor="#d1d5db"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!deleting}
            />

            <TouchableOpacity
              onPress={() => onConfirm(typed.trim())}
              disabled={!matches || deleting}
              className="py-3.5 rounded-2xl items-center justify-center mt-5"
              // Inline color: the swap between enabled/disabled must always paint
              style={{ backgroundColor: matches ? '#dc2626' : '#fca5a5' }}
              accessibilityRole="button"
              accessibilityState={{ disabled: !matches || deleting }}
            >
              {deleting
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-semibold text-base">Eliminar definitivamente</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={close} disabled={deleting} className="py-3.5 items-center mt-1" accessibilityRole="button">
              <Text className="text-gray-600 font-medium">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
