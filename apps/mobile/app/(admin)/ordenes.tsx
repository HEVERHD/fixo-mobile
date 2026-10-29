import { useCallback, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useFocusEffect } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ClipboardList, Building2, CalendarDays, HardHat, Plus, Zap } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { STATUS_META, PRIORITY_LABEL, type WorkOrderStatus, type WorkOrderPriority } from '@/lib/workOrders'
import { EmptyState, MetaRow } from '@/components/ui'

const PRIORITY_CHIP: Record<WorkOrderPriority, { chip: string; text: string }> = {
  baja: { chip: 'bg-gray-100', text: 'text-gray-600' },
  media: { chip: 'bg-blue-50', text: 'text-blue-700' },
  alta: { chip: 'bg-orange-100', text: 'text-orange-700' },
  urgente: { chip: 'bg-red-100', text: 'text-red-700' },
}

interface OrderRow {
  id: string
  order_number: string
  description: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  scheduled_date: string | null
  clients: { company_name: string } | null
  operators: { profiles: { full_name: string } | null } | null
}

export default function OrdenesAdmin() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('work_orders')
      .select('id, order_number, description, status, priority, scheduled_date, clients(company_name), operators(profiles(full_name))')
      .order('created_at', { ascending: false })
      .limit(50)
    setOrders((data ?? []) as unknown as OrderRow[])
    setRefreshing(false)
  }, [])

  // Reload when coming back from "Nueva orden"
  useFocusEffect(useCallback(() => { load() }, [load]))

  const newOrder = () => router.push('/nueva-orden')

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {!orders ? (
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
          <Text className="text-2xl font-bold text-gray-900">Órdenes de trabajo</Text>
          <Text className="text-sm text-gray-500 mt-0.5 mb-4">
            {orders.length === 1 ? '1 orden' : `${orders.length} órdenes`}
          </Text>

          {orders.length === 0 ? (
            <View className="gap-4">
              <EmptyState
                icon={ClipboardList}
                title="No hay órdenes registradas"
                message="Crea tu primera orden para asignar un trabajo a tu equipo."
              />
              <TouchableOpacity
                onPress={newOrder}
                className="h-12 rounded-2xl bg-primary flex-row items-center justify-center"
                accessibilityRole="button"
              >
                <Plus size={18} color="#fff" strokeWidth={2.4} />
                <Text className="text-white font-semibold ml-2">Crear orden</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {orders.map(order => {
                const status = STATUS_META[order.status] ?? STATUS_META.pendiente
                const priority = PRIORITY_CHIP[order.priority] ?? PRIORITY_CHIP.media
                const operator = order.operators?.profiles?.full_name
                return (
                  <View key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View className={`w-2.5 h-2.5 rounded-full mr-2 ${status.dot}`} />
                        <Text className="font-semibold text-gray-900">{order.order_number}</Text>
                      </View>
                      <View className="flex-row gap-1.5">
                        <View className={`flex-row items-center rounded-full px-2.5 py-1 ${priority.chip}`}>
                          {order.priority === 'urgente' && <Zap size={11} color="#b91c1c" fill="#b91c1c" />}
                          <Text className={`text-xs font-medium ${priority.text} ${order.priority === 'urgente' ? 'ml-0.5' : ''}`}>
                            {PRIORITY_LABEL[order.priority]}
                          </Text>
                        </View>
                        <View className={`rounded-full px-2.5 py-1 ${status.chip}`}>
                          <Text className={`text-xs font-medium ${status.text}`}>{status.label}</Text>
                        </View>
                      </View>
                    </View>
                    <Text className="text-gray-700 text-sm mb-1" numberOfLines={2}>{order.description}</Text>
                    {order.clients && <MetaRow icon={Building2}>{order.clients.company_name}</MetaRow>}
                    {order.scheduled_date && (
                      <MetaRow icon={CalendarDays}>
                        {format(parseISO(order.scheduled_date), "EEEE d 'de' MMMM", { locale: es })}
                      </MetaRow>
                    )}
                    <MetaRow icon={HardHat}>{operator ?? 'Sin asignar'}</MetaRow>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating action button */}
      {orders && orders.length > 0 && (
        <TouchableOpacity
          onPress={newOrder}
          activeOpacity={0.85}
          className="absolute right-5 bottom-6 h-14 pl-5 pr-6 rounded-full bg-primary flex-row items-center"
          style={{ elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
          accessibilityRole="button"
          accessibilityLabel="Crear nueva orden"
        >
          <Plus size={22} color="#fff" strokeWidth={2.4} />
          <Text className="text-white font-semibold text-base ml-2">Nueva</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}
