import { useCallback, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native'
import { colors } from '@/lib/theme'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { fetchMyOrganization } from '@/lib/organization'
import { ASSET_STATUS_META, printAssetLabels, type AssetStatus } from '@/lib/assets'
import { Package, Building2, MapPin, Plus, QrCode, ScanQrCode, Printer } from 'lucide-react-native'
import { EmptyState, MetaRow } from '@/components/ui'

export default function ActivosAdmin() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [printing, setPrinting] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('assets')
      .select('id, name, type, brand, model, status, location, qr_code, clients(company_name)')
      .order('created_at', { ascending: false })
    setAssets(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const newAsset = () => router.push('/nuevo-equipo')

  // One sheet with every sticker, for the first walk-through at a client's site
  async function printAll() {
    setPrinting(true)
    try {
      const org = await fetchMyOrganization()
      await printAssetLabels(
        assets.map(a => ({ name: a.name, qr_code: a.qr_code, location: a.location, clientName: a.clients?.company_name })),
        org?.name ?? '',
      )
    } catch {
      // Closing the print dialog rejects on some platforms; nothing to report
    } finally {
      setPrinting(false)
    }
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
        contentContainerClassName="p-4 pb-28"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">Equipos</Text>
          <View className="flex-row gap-2">
            {assets.length > 0 && (
              <TouchableOpacity
                onPress={printAll}
                disabled={printing}
                className={`w-11 h-11 rounded-xl bg-white border border-gray-100 items-center justify-center ${printing ? 'opacity-50' : ''}`}
                accessibilityRole="button"
                accessibilityLabel="Imprimir etiquetas QR de todos los equipos"
              >
                {printing ? <ActivityIndicator size="small" color={colors.primary} /> : <Printer size={20} color={colors.primary} />}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push('/escanear')}
              className="w-11 h-11 rounded-xl bg-primary items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Escanear QR de un equipo"
            >
              <ScanQrCode size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {assets.length === 0 ? (
          <View className="gap-4">
            <EmptyState
              icon={Package}
              title="No hay equipos registrados"
              message="Los equipos que registres aparecerán aquí con su código QR."
            />
            <TouchableOpacity
              onPress={newAsset}
              className="h-12 rounded-2xl bg-primary flex-row items-center justify-center"
              accessibilityRole="button"
            >
              <Plus size={18} color="#fff" strokeWidth={2.4} />
              <Text className="text-white font-semibold ml-2">Registrar equipo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          assets.map((asset) => {
            const status = ASSET_STATUS_META[asset.status as AssetStatus] ?? ASSET_STATUS_META.activo
            return (
              <TouchableOpacity
                key={asset.id}
                onPress={() => router.push({ pathname: '/activo/[id]', params: { id: asset.id } })}
                activeOpacity={0.7}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                accessibilityRole="button"
              >
                <View className="flex-row items-start justify-between mb-1">
                  <Text className="font-semibold text-gray-900 flex-1 mr-2">{asset.name}</Text>
                  <View className={`rounded-full px-2 py-0.5 ${status.chip}`}>
                    <Text className={`text-xs font-medium ${status.text}`}>{status.label}</Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-sm">{asset.type}{asset.brand ? ` · ${asset.brand}` : ''}{asset.model ? ` ${asset.model}` : ''}</Text>
                {asset.clients && (
                  <MetaRow icon={Building2}>{asset.clients.company_name}</MetaRow>
                )}
                {asset.location && (
                  <MetaRow icon={MapPin}>{asset.location}</MetaRow>
                )}
                {asset.qr_code && (
                  <MetaRow icon={QrCode}>{asset.qr_code}</MetaRow>
                )}
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {assets.length > 0 && (
        <TouchableOpacity
          onPress={newAsset}
          activeOpacity={0.85}
          className="absolute right-5 bottom-6 h-14 pl-5 pr-6 rounded-full bg-primary flex-row items-center"
          style={{ elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
          accessibilityRole="button"
          accessibilityLabel="Registrar nuevo equipo"
        >
          <Plus size={22} color="#fff" strokeWidth={2.4} />
          <Text className="text-white font-semibold text-base ml-2">Nuevo</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}
