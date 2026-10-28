import { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalOrders: number
  pendingOrders: number
  totalAssets: number
  totalClients: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: totalOrders },
        { count: pendingOrders },
        { count: totalAssets },
        { count: totalClients },
      ] = await Promise.all([
        supabase.from('work_orders').select('*', { count: 'exact', head: true }),
        supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('status', 'pendiente'),
        supabase.from('assets').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        totalOrders: totalOrders ?? 0,
        pendingOrders: pendingOrders ?? 0,
        totalAssets: totalAssets ?? 0,
        totalClients: totalClients ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
          <Text className="text-gray-500 text-sm mt-1">Resumen general de operaciones</Text>
        </View>

        {/* KPI Grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <KPICard label="Total Órdenes" value={stats?.totalOrders ?? 0} emoji="📋" color="bg-blue-50" textColor="text-blue-700" />
          <KPICard label="Pendientes" value={stats?.pendingOrders ?? 0} emoji="⚠️" color="bg-yellow-50" textColor="text-yellow-700" />
          <KPICard label="Activos" value={stats?.totalAssets ?? 0} emoji="⚙️" color="bg-green-50" textColor="text-green-700" />
          <KPICard label="Clientes" value={stats?.totalClients ?? 0} emoji="🏢" color="bg-purple-50" textColor="text-purple-700" />
        </View>

        {/* Quick info */}
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="font-semibold text-gray-900 mb-2">Fixo — Admin</Text>
          <Text className="text-gray-500 text-sm">
            Gestiona órdenes de trabajo, activos y clientes desde el panel de administración.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function KPICard({
  label, value, emoji, color, textColor,
}: {
  label: string; value: number; emoji: string; color: string; textColor: string
}) {
  return (
    <View className={`flex-1 min-w-[45%] ${color} rounded-2xl p-4`}>
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text className={`text-3xl font-bold ${textColor}`}>{value}</Text>
      <Text className="text-gray-600 text-xs mt-1">{label}</Text>
    </View>
  )
}
