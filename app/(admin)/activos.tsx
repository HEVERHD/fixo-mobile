import { useCallback, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native'
import { colors } from '@/lib/theme'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Package, Building2, MapPin } from 'lucide-react-native'
import { EmptyState, MetaRow } from '@/components/ui'

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  activo: { bg: 'bg-green-100', text: 'text-green-800' },
  en_mantenimiento: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  fuera_de_servicio: { bg: 'bg-red-100', text: 'text-red-800' },
}

export default function ActivosAdmin() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('assets')
      .select('id, name, type, brand, model, status, location, clients(company_name)')
      .order('created_at', { ascending: false })
    setAssets(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      >
        <Text className="text-2xl font-bold text-gray-900 mb-4">Equipos</Text>

        {assets.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay equipos registrados"
            message="Los equipos que registres aparecerán aquí con su código QR."
          />
        ) : (
          assets.map((asset) => {
            const color = STATUS_COLOR[asset.status] ?? { bg: 'bg-gray-100', text: 'text-gray-800' }
            return (
              <View key={asset.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-start justify-between mb-1">
                  <Text className="font-semibold text-gray-900 flex-1 mr-2">{asset.name}</Text>
                  <View className={`rounded-full px-2 py-0.5 ${color.bg}`}>
                    <Text className={`text-xs font-medium ${color.text}`}>
                      {asset.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-sm">{asset.type}{asset.brand ? ` · ${asset.brand}` : ''}{asset.model ? ` ${asset.model}` : ''}</Text>
                {asset.clients && (
                  <MetaRow icon={Building2}>{asset.clients.company_name}</MetaRow>
                )}
                {asset.location && (
                  <MetaRow icon={MapPin}>{asset.location}</MetaRow>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
