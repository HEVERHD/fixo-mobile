import { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'

const STATUS_COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  en_proceso: 'bg-blue-100 text-blue-800',
  completada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
}

const PRIORITY_COLOR: Record<string, string> = {
  baja: 'bg-gray-100 text-gray-600',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
}

export default function OrdenesAdmin() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('work_orders')
      .select('id, order_number, description, status, priority, scheduled_date, clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(20)
    setOrders(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#1e40af" />
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
        <Text className="text-2xl font-bold text-gray-900 mb-4">Órdenes de Trabajo</Text>

        {orders.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Text className="text-4xl mb-2">📋</Text>
            <Text className="text-gray-500">No hay órdenes registradas</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-start justify-between mb-2">
                <Text className="font-semibold text-gray-900 text-sm">{order.order_number}</Text>
                <View className="flex-row gap-2">
                  <View className={`rounded-full px-2 py-0.5 ${PRIORITY_COLOR[order.priority]}`}>
                    <Text className={`text-xs font-medium ${PRIORITY_COLOR[order.priority]}`}>
                      {order.priority}
                    </Text>
                  </View>
                  <View className={`rounded-full px-2 py-0.5 ${STATUS_COLOR[order.status]}`}>
                    <Text className={`text-xs font-medium`}>
                      {order.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>
              <Text className="text-gray-700 text-sm mb-1" numberOfLines={2}>
                {order.description}
              </Text>
              {order.clients && (
                <Text className="text-gray-400 text-xs">{order.clients.company_name}</Text>
              )}
              {order.scheduled_date && (
                <Text className="text-gray-400 text-xs mt-1">📅 {order.scheduled_date}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
