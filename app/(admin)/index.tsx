import { useCallback, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useFocusEffect, type Href } from 'expo-router'
import {
  ClipboardList, Wrench, Package, Building2, ChevronRight, FileText,
  CheckCheck, Zap, ArrowRight, Plus, HardHat, Inbox, type LucideIcon,
} from 'lucide-react-native'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { STATUS_META, OPEN_STATUSES, type WorkOrderStatus, type WorkOrderPriority } from '@/lib/workOrders'
import { PROJECT_STATUS_META } from '@/lib/projects'
import { OrgAvatar } from '@/components/OrgAvatar'
import { ProgressBar } from '@/components/ProgressBar'
import { useOrganization } from '@/components/OrganizationContext'

interface Stats {
  totalOrders: number
  pendingOrders: number
  inProgressOrders: number
  urgentOrders: number
  totalAssets: number
  totalClients: number
  activeProjects: number
  newRequests: number
}

interface ActiveProject {
  id: string
  name: string
  progress: number
  clients: { company_name: string } | null
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
  const [projects, setProjects] = useState<ActiveProject[]>([])
  const [refreshing, setRefreshing] = useState(false)
  // Business type decides which KPIs and sections are shown
  const { org, features } = useOrganization()

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
      { count: activeProjects },
      { data: activeProjectList },
      { count: newRequests },
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
      supabase.from('projects').select('*', count).eq('status', 'en_ejecucion'),
      supabase
        .from('projects')
        .select('id, name, progress, clients(company_name)')
        .eq('status', 'en_ejecucion')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase.from('service_requests').select('*', count).eq('status', 'nueva'),
    ])
    setStats({
      totalOrders: totalOrders ?? 0,
      pendingOrders: pendingOrders ?? 0,
      inProgressOrders: inProgressOrders ?? 0,
      urgentOrders: urgentOrders ?? 0,
      totalAssets: totalAssets ?? 0,
      totalClients: totalClients ?? 0,
      activeProjects: activeProjects ?? 0,
      newRequests: newRequests ?? 0,
    })
    setRecent((recentOrders ?? []) as unknown as RecentOrder[])
    setProjects((activeProjectList ?? []) as unknown as ActiveProject[])
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

        {/* Client requests from the web portal */}
        <TouchableOpacity
          onPress={() => go('/solicitudes' as Href)}
          activeOpacity={0.8}
          className={`flex-row items-center rounded-2xl p-4 mt-3 border ${
            stats.newRequests > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'
          }`}
          accessibilityRole="button"
          accessibilityLabel={`Solicitudes de clientes: ${stats.newRequests} nuevas`}
        >
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${stats.newRequests > 0 ? 'bg-amber-500' : 'bg-gray-100'}`}>
            <Inbox size={20} color={stats.newRequests > 0 ? '#fff' : '#6b7280'} strokeWidth={2.2} />
          </View>
          <View className="flex-1 ml-3">
            <Text className="font-semibold text-gray-900">Solicitudes de clientes</Text>
            <Text className="text-xs text-gray-500">
              {stats.newRequests === 0
                ? 'Sin solicitudes nuevas'
                : stats.newRequests === 1 ? '1 solicitud por responder' : `${stats.newRequests} solicitudes por responder`}
            </Text>
          </View>
          {stats.newRequests > 0 && (
            <View className="min-w-6 h-6 px-1.5 rounded-full bg-amber-500 items-center justify-center mr-2">
              <Text className="text-xs font-bold text-white">{stats.newRequests}</Text>
            </View>
          )}
          <ChevronRight size={18} color="#d1d5db" />
        </TouchableOpacity>

        {/* Quick action */}
        <TouchableOpacity
          onPress={() => go('/nueva-orden')}
          activeOpacity={0.8}
          className="flex-row items-center bg-white border border-gray-100 rounded-2xl p-4 mt-3"
          accessibilityRole="button"
        >
          <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
            <Plus size={20} color="#fff" strokeWidth={2.4} />
          </View>
          <View className="flex-1 ml-3">
            <Text className="font-semibold text-gray-900">Nueva orden de trabajo</Text>
            <Text className="text-xs text-gray-500">Registra un servicio y asígnalo a tu equipo</Text>
          </View>
          <ChevronRight size={18} color="#d1d5db" />
        </TouchableOpacity>

        {features.obras && (
          <TouchableOpacity
            onPress={() => go('/nueva-obra')}
            activeOpacity={0.8}
            className="flex-row items-center bg-white border border-gray-100 rounded-2xl p-4 mt-3"
            accessibilityRole="button"
          >
            <View className="w-10 h-10 rounded-xl bg-navy items-center justify-center">
              <HardHat size={20} color="#fff" strokeWidth={2.2} />
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-900">Nueva obra</Text>
              <Text className="text-xs text-gray-500">Agrupa órdenes, avance y presupuesto</Text>
            </View>
            <ChevronRight size={18} color="#d1d5db" />
          </TouchableOpacity>
        )}

        {/* Active projects (construction) */}
        {features.obras && projects.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mt-6 mb-3">
              <Text className="text-base font-semibold text-gray-900">Obras en ejecución</Text>
              <TouchableOpacity onPress={() => go('/(admin)/obras' as Href)} hitSlop={8}>
                <Text className="text-sm font-medium text-primary">Ver todas</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-white rounded-2xl border border-gray-100 px-4">
              {projects.map((p, i) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => go('/(admin)/obras' as Href)}
                  activeOpacity={0.7}
                  className={`py-3.5 ${i === projects.length - 1 ? '' : 'border-b border-gray-100'}`}
                >
                  <Text className="font-semibold text-gray-900 text-sm" numberOfLines={1}>{p.name}</Text>
                  {p.clients && <Text className="text-xs text-gray-500 mb-2">{p.clients.company_name}</Text>}
                  <ProgressBar value={p.progress} barClass={PROJECT_STATUS_META.en_ejecucion.bar} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* KPIs: the third card follows the business type */}
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
          {features.obras && (
            <KPICard
              label="Obras activas" value={stats.activeProjects}
              icon={HardHat} tint="bg-amber-100" iconColor="#d97706"
              onPress={() => go('/(admin)/obras' as Href)}
            />
          )}
          {features.equipos && (
            <KPICard
              label="Equipos" value={stats.totalAssets}
              icon={Package} tint="bg-green-100" iconColor="#16a34a"
              onPress={() => go('/(admin)/activos')}
            />
          )}
          <KPICard
            label="Clientes" value={stats.totalClients}
            icon={Building2} tint="bg-purple-100" iconColor="#9333ea"
            onPress={() => go('/clientes')}
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
