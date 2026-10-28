import { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native'
import { colors } from '@/lib/theme'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { Package, MapPin, CalendarCheck } from 'lucide-react-native'
import { EmptyState, MetaRow } from '@/components/ui'

export default function ClienteActivos() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!client) { setLoading(false); setRefreshing(false); return }

    const { data } = await supabase
      .from('assets')
      .select('id, name, type, brand, model, status, location, installation_date')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })

    setAssets(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  const STATUS: Record<string, { bg: string; text: string; label: string }> = {
    activo: { bg: 'bg-green-100', text: 'text-green-700', label: 'Activo' },
    en_mantenimiento: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En mantenimiento' },
    fuera_de_servicio: { bg: 'bg-red-100', text: 'text-red-700', label: 'Fuera de servicio' },
  }

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
        <Text className="text-2xl font-bold text-gray-900 mb-4">Mis equipos</Text>

        {assets.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No tienes equipos registrados"
            message="Tus equipos aparecerán aquí una vez el contratista los registre."
          />
        ) : (
          assets.map((asset) => {
            const s = STATUS[asset.status] ?? { bg: 'bg-gray-100', text: 'text-gray-700', label: asset.status }
            return (
              <View key={asset.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                <View className="flex-row justify-between items-start mb-1">
                  <Text className="font-semibold text-gray-900 flex-1 mr-2">{asset.name}</Text>
                  <View className={`rounded-full px-2 py-0.5 ${s.bg}`}>
                    <Text className={`text-xs font-medium ${s.text}`}>{s.label}</Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-sm">
                  {asset.type}{asset.brand ? ` · ${asset.brand}` : ''}{asset.model ? ` ${asset.model}` : ''}
                </Text>
                {asset.location && <MetaRow icon={MapPin}>{asset.location}</MetaRow>}
                {asset.installation_date && (
                  <MetaRow icon={CalendarCheck}>Instalado: {asset.installation_date}</MetaRow>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
