import { useCallback, useMemo, useState } from 'react'
import { View, Text, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useFocusEffect } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, Mail, CalendarDays, Building2 } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { fetchPlatformOrganizations, type PlatformOrganization } from '@/lib/platform'
import { OrgAvatar } from '@/components/OrgAvatar'
import { EmptyState, MetaRow } from '@/components/ui'

export default function PlatformOrganizations() {
  const [orgs, setOrgs] = useState<PlatformOrganization[] | null>(null)
  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setOrgs(await fetchPlatformOrganizations())
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!orgs || !q) return orgs ?? []
    return orgs.filter(o =>
      o.name.toLowerCase().includes(q)
      || o.admin_name?.toLowerCase().includes(q)
      || o.admin_email?.toLowerCase().includes(q))
  }, [orgs, query])

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-gray-900">Empresas</Text>
        <Text className="text-sm text-gray-500 mt-0.5 mb-4">
          {orgs ? `${orgs.length} registradas` : 'Cargando…'}
        </Text>
        <View className="flex-row items-center h-12 rounded-2xl border border-gray-200 bg-white px-4 mb-3">
          <Search size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-3 py-0 text-base text-gray-900"
            placeholder="Buscar por empresa, admin o correo"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      {!orgs ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={o => o.id}
          contentContainerClassName="px-4 pb-8 gap-3"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load() }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Building2}
              title={query ? 'Sin resultados' : 'Aún no hay empresas'}
              message={query ? 'Prueba con otro nombre o correo.' : 'Las empresas que se registren aparecerán aquí.'}
            />
          }
          renderItem={({ item: o }) => (
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <View className="flex-row items-center">
                <OrgAvatar name={o.name} logoUrl={o.logo_url} size={48} />
                <View className="flex-1 ml-3">
                  <Text className="font-semibold text-gray-900 text-base" numberOfLines={1}>{o.name}</Text>
                  <Text className="text-sm text-gray-500" numberOfLines={1}>{o.admin_name ?? 'Sin administrador'}</Text>
                </View>
              </View>
              {o.admin_email && <MetaRow icon={Mail} className="mt-3">{o.admin_email}</MetaRow>}
              <MetaRow icon={CalendarDays}>
                Registrada el {format(parseISO(o.created_at), "d 'de' MMMM yyyy", { locale: es })}
              </MetaRow>
              <View className="flex-row gap-2 mt-3">
                <Chip label="Usuarios" value={o.users} />
                <Chip label="Clientes" value={o.clients} />
                <Chip label="Activos" value={o.assets} />
                <Chip label="Órdenes" value={o.work_orders} />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 bg-gray-50 rounded-xl py-2 items-center">
      <Text className="text-base font-bold text-gray-900">{value}</Text>
      <Text className="text-[11px] text-gray-500">{label}</Text>
    </View>
  )
}
