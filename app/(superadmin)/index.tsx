import { useCallback, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useFocusEffect } from 'expo-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Users, ClipboardList, Package, Briefcase, TrendingUp, type LucideIcon,
} from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { fetchPlatformStats, type PlatformStats } from '@/lib/platform'

export default function PlatformOverview() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [failed, setFailed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const data = await fetchPlatformStats()
    setStats(data)
    setFailed(data === null)
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (!stats && !failed) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const byRole = stats?.users_by_role ?? {}
  const completion = stats && stats.work_orders > 0
    ? Math.round((stats.work_orders_completed / stats.work_orders) * 100)
    : 0

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load() }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Text className="text-sm text-gray-500">Panel de plataforma</Text>
        <Text className="text-2xl font-bold text-gray-900 mt-0.5 mb-5">Resumen de Fixo</Text>

        {failed || !stats ? (
          <View className="bg-white rounded-2xl p-6 border border-gray-100">
            <Text className="font-semibold text-gray-900">No se pudieron cargar las estadísticas</Text>
            <Text className="text-sm text-gray-500 mt-1">Desliza hacia abajo para reintentar.</Text>
          </View>
        ) : (
          <>
            {/* Hero */}
            <View className="bg-navy rounded-3xl p-5 overflow-hidden">
              <View pointerEvents="none" className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary opacity-30" />
              <Text className="text-sm font-medium text-blue-200">Empresas registradas</Text>
              <Text className="text-5xl font-extrabold text-white mt-1">{stats.organizations}</Text>
              <View className="flex-row items-center self-start bg-highlight rounded-full px-3 py-1 mt-3">
                <TrendingUp size={14} color={colors.navy} strokeWidth={2.4} />
                <Text className="text-xs font-bold text-navy ml-1">
                  +{stats.organizations_last_30d} en los últimos 30 días
                </Text>
              </View>
            </View>

            {/* Signups chart */}
            <Text className="text-base font-semibold text-gray-900 mt-6 mb-3">Nuevas empresas por semana</Text>
            <SignupsChart data={stats.signups_by_week} />

            {/* Usage */}
            <Text className="text-base font-semibold text-gray-900 mt-6 mb-3">Uso de la plataforma</Text>
            <View className="flex-row flex-wrap gap-3">
              <StatCard icon={Users} tint="bg-blue-100" iconColor={colors.primary} label="Usuarios" value={stats.users}
                detail={`${byRole.admin ?? 0} admin · ${byRole.operario ?? 0} operarios · ${byRole.cliente ?? 0} clientes`} />
              <StatCard icon={ClipboardList} tint="bg-cyan-100" iconColor="#0891b2" label="Órdenes" value={stats.work_orders}
                detail={`${completion}% completadas`} />
              <StatCard icon={Briefcase} tint="bg-purple-100" iconColor="#9333ea" label="Clientes finales" value={stats.clients} />
              <StatCard icon={Package} tint="bg-green-100" iconColor="#16a34a" label="Activos" value={stats.assets} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({
  icon: Icon, tint, iconColor, label, value, detail,
}: {
  icon: LucideIcon; tint: string; iconColor: string; label: string; value: number; detail?: string
}) {
  return (
    <View className="flex-1 min-w-[45%] bg-white rounded-2xl p-4 border border-gray-100">
      <View className={`w-10 h-10 rounded-xl items-center justify-center ${tint}`}>
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </View>
      <Text className="text-3xl font-bold text-gray-900 mt-3">{value}</Text>
      <Text className="text-sm text-gray-500 mt-0.5">{label}</Text>
      {detail && <Text className="text-xs text-gray-400 mt-1">{detail}</Text>}
    </View>
  )
}

/** Last 12 weeks, filling weeks without signups with 0. */
function SignupsChart({ data }: { data: { week: string; count: number }[] }) {
  const byWeek = new Map(data.map(d => [d.week, d.count]))
  const monday = new Date()
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() - (11 - i) * 7)
    const key = format(d, 'yyyy-MM-dd')
    return { key, date: d, count: byWeek.get(key) ?? 0 }
  })
  const max = Math.max(1, ...weeks.map(w => w.count))

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100">
      <View className="flex-row items-end justify-between h-28 gap-1.5">
        {weeks.map((w, i) => (
          <View key={w.key} className="flex-1 items-center justify-end h-full">
            {w.count > 0 && <Text className="text-[10px] text-gray-500 mb-1">{w.count}</Text>}
            <View
              className={`w-full rounded-md ${i === weeks.length - 1 ? 'bg-primary' : 'bg-blue-200'}`}
              style={{ height: `${Math.max(4, (w.count / max) * 85)}%` }}
            />
          </View>
        ))}
      </View>
      <View className="flex-row justify-between mt-2">
        <Text className="text-[10px] text-gray-400">{format(weeks[0]!.date, 'd MMM', { locale: es })}</Text>
        <Text className="text-[10px] text-gray-400">Esta semana</Text>
      </View>
      {data.length === 0 && (
        <Text className="text-xs text-gray-400 text-center mt-2">Sin registros en las últimas 12 semanas</Text>
      )}
    </View>
  )
}
