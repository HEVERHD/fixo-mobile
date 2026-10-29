import { useCallback, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useFocusEffect } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { HardHat, Building2, MapPin, CalendarDays, Wallet, Plus } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { PROJECT_STATUS_META, formatMoney, type ProjectStatus } from '@/lib/projects'
import { EmptyState, MetaRow } from '@/components/ui'
import { ProgressBar } from '@/components/ProgressBar'

interface ProjectRow {
  id: string
  name: string
  address: string | null
  status: ProjectStatus
  progress: number
  start_date: string | null
  end_date: string | null
  budget: number | null
  clients: { company_name: string } | null
}

export default function ObrasAdmin() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, name, address, status, progress, start_date, end_date, budget, clients(company_name)')
      .order('created_at', { ascending: false })
    setProjects((data ?? []) as unknown as ProjectRow[])
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const newProject = () => router.push('/nueva-obra')
  const shortDate = (d: string) => format(parseISO(d), "d MMM yyyy", { locale: es })

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {!projects ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4 pb-28"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load() }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Text className="text-2xl font-bold text-gray-900">Obras</Text>
          <Text className="text-sm text-gray-500 mt-0.5 mb-4">
            {projects.length === 1 ? '1 obra' : `${projects.length} obras`}
          </Text>

          {projects.length === 0 ? (
            <View className="gap-4">
              <EmptyState
                icon={HardHat}
                title="Aún no tienes obras"
                message="Crea una obra para agrupar sus órdenes, seguir el avance y controlar el presupuesto."
              />
              <TouchableOpacity
                onPress={newProject}
                className="h-12 rounded-2xl bg-primary flex-row items-center justify-center"
                accessibilityRole="button"
              >
                <Plus size={18} color="#fff" strokeWidth={2.4} />
                <Text className="text-white font-semibold ml-2">Crear obra</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {projects.map(p => {
                const status = PROJECT_STATUS_META[p.status] ?? PROJECT_STATUS_META.planeacion
                const budget = formatMoney(p.budget)
                return (
                  <View key={p.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <View className="flex-row items-start justify-between">
                      <Text className="font-semibold text-gray-900 text-base flex-1 mr-2" numberOfLines={2}>{p.name}</Text>
                      <View className={`rounded-full px-2.5 py-1 ${status.chip}`}>
                        <Text className={`text-xs font-medium ${status.text}`}>{status.label}</Text>
                      </View>
                    </View>
                    {p.clients && <MetaRow icon={Building2}>{p.clients.company_name}</MetaRow>}
                    {p.address && <MetaRow icon={MapPin}>{p.address}</MetaRow>}
                    {p.start_date && (
                      <MetaRow icon={CalendarDays}>
                        {shortDate(p.start_date)}{p.end_date ? ` → ${shortDate(p.end_date)}` : ''}
                      </MetaRow>
                    )}
                    {budget && <MetaRow icon={Wallet}>Presupuesto {budget}</MetaRow>}
                    <View className="mt-3">
                      <ProgressBar value={p.progress} barClass={status.bar} />
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}

      {projects && projects.length > 0 && (
        <TouchableOpacity
          onPress={newProject}
          activeOpacity={0.85}
          className="absolute right-5 bottom-6 h-14 pl-5 pr-6 rounded-full bg-primary flex-row items-center"
          style={{ elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
          accessibilityRole="button"
          accessibilityLabel="Crear nueva obra"
        >
          <Plus size={22} color="#fff" strokeWidth={2.4} />
          <Text className="text-white font-semibold text-base ml-2">Nueva</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}
