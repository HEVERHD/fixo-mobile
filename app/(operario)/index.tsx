import { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'

const STATUS_COLOR: Record<string, string> = {
  pendiente: 'text-yellow-700',
  en_proceso: 'text-blue-700',
  completada: 'text-green-700',
  cancelada: 'text-red-700',
}

export default function OperarioOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })
  }, [])

  async function load() {
    if (!userId) return
    // Get operator id from userId
    const { data: op } = await supabase
      .from('operators')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!op) { setLoading(false); setRefreshing(false); return }

    const { data } = await supabase
      .from('work_orders')
      .select('id, order_number, description, status, priority, scheduled_date, clients(company_name)')
      .eq('assigned_operator_id', op.id)
      .neq('status', 'cancelada')
      .order('scheduled_date', { ascending: true })

    setOrders(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { if (userId) load() }, [userId])

  async function markInProgress(orderId: string) {
    await supabase.from('work_orders').update({ status: 'en_proceso' }).eq('id', orderId)
    load()
  }

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
        <Text className="text-2xl font-bold text-gray-900 mb-4">Mis Órdenes</Text>

        {orders.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Text className="text-4xl mb-2">✅</Text>
            <Text className="text-gray-500">No tienes órdenes asignadas</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="font-semibold text-gray-900">{order.order_number}</Text>
                <Text className={`text-xs font-medium ${STATUS_COLOR[order.status]}`}>
                  {order.status.replace('_', ' ')}
                </Text>
              </View>
              <Text className="text-gray-700 text-sm mb-2" numberOfLines={2}>{order.description}</Text>
              {order.clients && (
                <Text className="text-gray-400 text-xs mb-1">🏢 {order.clients.company_name}</Text>
              )}
              {order.scheduled_date && (
                <Text className="text-gray-400 text-xs mb-3">📅 {order.scheduled_date}</Text>
              )}
              {order.status === 'pendiente' && (
                <TouchableOpacity
                  className="bg-primary rounded-xl py-2 items-center"
                  onPress={() => markInProgress(order.id)}
                >
                  <Text className="text-white text-sm font-medium">Iniciar orden</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
