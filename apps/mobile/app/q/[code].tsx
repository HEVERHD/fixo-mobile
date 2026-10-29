import { useEffect, useState } from 'react'
import { View, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, TriangleAlert } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { parseScannedCode, findAssetIdByCode } from '@/lib/assets'
import { EmptyState } from '@/components/ui'

/**
 * Same path as the printed QR (<base>/q/FX-…), so opening the sticker link
 * (fixo://q/FX-… today, https universal link later) lands on the asset sheet.
 */
export default function QrLink() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const insets = useSafeAreaInsets()
  const parsed = parseScannedCode(code ?? '')
  const [lookupFailed, setLookupFailed] = useState(false)

  useEffect(() => {
    if (!parsed) return
    findAssetIdByCode(parsed).then(id => {
      if (id) router.replace({ pathname: '/activo/[id]', params: { id } })
      else setLookupFailed(true)
    })
  }, [parsed])

  if (parsed && !lookupFailed) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-4 pb-2">
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={26} color="#374151" />
        </TouchableOpacity>
      </View>
      <View className="p-4">
        <EmptyState icon={TriangleAlert} title="Equipo no encontrado" message={`El código ${code} no existe o no pertenece a tu empresa.`} />
      </View>
    </View>
  )
}
