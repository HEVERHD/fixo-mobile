import { useCallback, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useFocusEffect, type Href } from 'expo-router'
import {
  ClipboardList, Wrench, Package, Building2, ChevronRight, FileText,
  CheckCheck, Zap, ArrowRight, type LucideIcon,
} from 'lucide-react-native'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { STATUS_META, OPEN_STATUSES, type WorkOrderStatus, type WorkOrderPriority } from '@/lib/workOrders'
import { fetchMyOrganization, type Organization } from '@/lib/organization'
import { OrgAvatar } from '@/components/OrgAvatar'

interface Stats {
  totalOrders: number
  pendingOrders: number
  inProgressOrders: number
  urgentOrders: number
  totalAssets: number
  totalClients: number
}

interface RecentOrder {
  id: string
  order_number: string
  description: string | null
  status: WorkOrderStatus
  priority: WorkOrderPriority
  scheduled_date: string | null
  clients: { company_name: string } | null
}

function greeting(date: Date) {
  const h = date.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<RecentOrder[]>([])
  const [org, setOrg] = useState<Organization | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const count = { count: 'exact', head: true } as const
    const [
      { count: totalOrders },
      { count: pendingOrders },
      { count: inProgressOrders },
      { count: urgentOrders },
      { count: totalAssets },
      { count: totalClients },
      { data: recentOrders },
      myOrg,
    ] = await Promise.all([
      supabase.from('work_orders').select('*', count),
      supabase.from('work_orders').select('*', count).eq('status', 'pendiente'),
      supabase.from('work_orders').select('*', count).eq('status', 'en_proceso'),
      supabase.from('work_orders').select('*', count).eq('priority', 'urgente').in('status', OPEN_STATUSES),
      supabase.from('assets').select('*', count),
      supabase.from('clients').select('*', count),
      supabase
        .from('work_orders')
        .select('id, order_number, description, status, priority, scheduled_date, clients(company_name)')
        .order('created_at', { ascending: false })
        .limit(5),
      fetchMyOrganization(),
    ])
    setStats({
      totalOrders: totalOrders ?? 0,
      pendingOrders: pendingOrders ?? 0,
      inProgressOrders: inProgressOrders ?? 0,
      urgentOrders: urgentOrders ?? 0,
      totalAssets: totalAssets ?? 0,
      totalClients: totalClients ?? 0,
    })
    setRecent((recentOrders ?? []) as unknown as RecentOrder[])
    setOrg(myOrg)
    setRefreshing(false)
  }, [])

  // Reload every time the tab gets focus so numbers stay current after editing elsewhere
  useFocusEffect(useCallback(() => { load() }, [load]))

  if (!stats) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const now = new Date()
  const go = (href: Href) => router.push(href)

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
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-1">
            <Text className="text-sm text-gray-500 capitalize">
              {format(now, "EEEE, d 'de' MMMM", { locale: es })}
            </Text>
            <Text className="text-2xl font-bold text-gray-900 mt-0.5">{greeting(now)}</Text>
            {org && <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>{org.name}</Text>}
          </View>
          <TouchableOpacity
            onPress={() => go('/(admin)/perfil')}
            accessibilityRole="button"
            accessibilityLabel="Ir al perfil de mi empresa"
          >
            <OrgAvatar name={org?.name ?? ''} logoUrl={org?.logo_url} size={48} />
          </TouchableOpacity>
        </View>

        {/* Attention card */}
        <AttentionCard
          pending={stats.pendingOrders}
          urgent={stats.urgentOrders}
          onPress={() => go('/(admin)/ordenes')}
        />

        {/* KPIs */}
        <Text className="text-base font-semibold text-gray-900 mt-6 mb-3">Resumen</Text>
        <View className="flex-row flex-wrap gap-3">
          <KPICard
            label="Órdenes" value={stats.totalOrders}
            icon={ClipboardList} tint="bg-blue-100" iconColor={colors.primary}
            onPress={() => go('/(admin)/ordenes')}
          />
          <KPICard
            label="En proceso" value={stats.inProgressOrders}
            icon={Wrench} tint="bg-cyan-100" iconColor="#0891b2"
            onPress={() => go('/(admin)/ordenes')}
          />
          <KPICard
            label="Activos" value={stats.totalAssets}
            icon={Package} tint="bg-green-100" iconColor="#16a34a"
            onPress={() => go('/(admin)/activos')}
          />
          <KPICard
            label="Clientes" value={stats.totalClients}
            icon={Building2} tint="bg-purple-100" iconColor="#9333ea"
          />
        </View>

        {/* Recent orders */}
        <View className="flex-row items-center justify-between mt-6 mb-3">
          <Text className="text-base font-semibold text-gray-900">Órdenes recientes</Text>
          {recent.length > 0 && (
            <TouchableOpacity onPress={() => go('/(admin)/ordenes')} hitSlop={8}>
              <Text className="text-sm font-medium text-primary">Ver todas</Text>
            </TouchableOpacity>
          )}
        </View>

        {recent.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-gray-100">
            <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-3">
              <FileText size={26} color="#9ca3af" strokeWidth={1.8} />
            </View>
            <Text className="font-semibold text-gray-900">Aún no hay órdenes</Text>
            <Text className="text-sm text-gray-500 text-center mt-1">
              Cuando un cliente solicite un servicio o crees una orden, aparecerá aquí.
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {recent.map((order, i) => (
              <OrderRow
                key={order.id}
                order={order}
                last={i === recent.length - 1}
                onPress={() => go('/(admin)/ordenes')}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function AttentionCard({ pending, urgent, onPress }: { pending: number; urgent: number; onPress: () => void }) {
  if (pending === 0 && urgent === 0) {
    return (
      <View className="bg-green-50 border border-green-100 rounded-3xl p-5 flex-row items-center">
        <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-4">
          <CheckCheck size={24} color="#16a34a" strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-green-900">Todo al día</Text>
          <Text className="text-sm text-green-700 mt-0.5">No hay órdenes pendientes por asignar.</Text>
        </View>
      </View>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="bg-navy rounded-3xl p-5 overflow-hidden"
      accessibilityRole="button"
      accessibilityLabel={`${pending} órdenes pendientes, ${urgent} urgentes. Revisar`}
    >
      <View pointerEvents="none" className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary opacity-30" />
      <Text className="text-sm font-medium text-blue-200">Requiere tu atención</Text>
      <View className="flex-row items-end mt-2">
        <Text className="text-5xl font-extrabold text-white">{pending}</Text>
        <Text className="text-base text-white ml-2 mb-2">
          {pending === 1 ? 'orden pendiente' : 'órdenes pendientes'}
        </Text>
      </View>
      {urgent > 0 && (
        <View className="flex-row items-center self-start bg-highlight rounded-full px-3 py-1 mt-2">
          <Zap size={14} color={colors.navy} fill={colors.navy} />
          <Text className="text-xs font-bold text-navy ml-1">
            {urgent} {urgent === 1 ? 'urgente' : 'urgentes'}
          </Text>
        </View>
      )}
      <View className="flex-row items-center justify-center bg-white rounded-2xl h-12 mt-5">
        <Text className="font-semibold text-navy mr-2">Revisar órdenes</Text>
        <ArrowRight size={18} color={colors.navy} strokeWidth={2.2} />
      </View>
    </TouchableOpacity>
  )
}

function KPICard({
  label, value, icon: Icon, tint, iconColor, onPress,
}: {
  label: string
  value: number
  icon: LucideIcon
  tint: string
  iconColor: string
  onPress?: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      className="flex-1 min-w-[45%] bg-white rounded-2xl p-4 border border-gray-100"
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
    >
      <View className="flex-row items-center justify-between">
        <View className={`w-10 h-10 rounded-xl items-center justify-center ${tint}`}>
          <Icon size={20} color={iconColor} strokeWidth={2} />
        </View>
        {onPress && <ChevronRight size={18} color="#d1d5db" />}
      </View>
      <Text className="text-3xl font-bold text-gray-900 mt-3">{value}</Text>
      <Text className="text-sm text-gray-500 mt-0.5">{label}</Text>
    </TouchableOpacity>
  )
}

function OrderRow({ order, last, onPress }: { order: RecentOrder; last: boolean; onPress: () => void }) {
  const status = STATUS_META[order.status] ?? STATUS_META.pendiente
  const meta = [
    order.clients?.company_name,
    order.scheduled_date && format(parseISO(order.scheduled_date), "d 'de' MMM", { locale: es }),
  ].filter(Boolean).join(' · ')

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center px-4 py-3.5 ${last ? '' : 'border-b border-gray-100'}`}
    >
      <View className={`w-2.5 h-2.5 rounded-full mr-3 ${status.dot}`} />
      <View className="flex-1 mr-3">
        <View className="flex-row items-center">
          <Text className="font-semibold text-gray-900 text-sm">{order.order_number}</Text>
          {order.priority === 'urgente' && (
            <Zap size={13} color="#ef4444" fill="#ef4444" style={{ marginLeft: 4 }} />
          )}
        </View>
        {order.description && (
          <Text className="text-sm text-gray-600 mt-0.5" numberOfLines={1}>{order.description}</Text>
        )}
        {meta.length > 0 && <Text className="text-xs text-gray-400 mt-0.5">{meta}</Text>}
      </View>
      <View className={`rounded-full px-2.5 py-1 ${status.chip}`}>
        <Text className={`text-xs font-medium ${status.text}`}>{status.label}</Text>
      </View>
    </TouchableOpacity>
  )
}
