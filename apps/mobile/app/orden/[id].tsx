import { useCallback, useState, type ReactNode } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChevronLeft, Building2, MapPin, Phone, Package, HardHat, CalendarDays, UserRound,
  Play, CircleCheckBig, Ban, FileCheck2, Wrench, TriangleAlert, Zap, type LucideIcon,
} from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { supabase, type Role } from '@/lib/supabase'
import {
  STATUS_META, PRIORITY_LABEL, TYPE_LABEL,
  type WorkOrderStatus, type WorkOrderPriority, type WorkOrderType,
} from '@/lib/workOrders'
import { SelectField, type SelectOption } from '@/components/SelectField'
import { PhotoGrid } from '@/components/PhotoStrip'
import { signPhotoUrls } from '@/lib/photos'

const latestReport = (reports: Report[] | null | undefined) =>
  [...(reports ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0]

interface Report {
  id: string
  date: string
  tasks_performed: string
  observations: string | null
  pending_tasks: string | null
  photos: string[] | null
}

interface OrderDetail {
  id: string
  order_number: string
  description: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  type: WorkOrderType
  scheduled_date: string | null
  completed_date: string | null
  created_at: string
  assigned_operator_id: string | null
  clients: { company_name: string; address: string | null; contact_phone: string | null } | null
  assets: { name: string; location: string | null } | null
  projects: { name: string } | null
  operators: { profiles: { full_name: string } | null } | null
  maintenance_records: Report[]
}

const SELECT = `
  id, order_number, description, status, priority, type, scheduled_date, completed_date, created_at,
  assigned_operator_id,
  clients(company_name, address, contact_phone),
  assets(name, location),
  projects(name),
  operators(profiles(full_name)),
  maintenance_records(id, date, tasks_performed, observations, pending_tasks, photos)
`

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [operators, setOperators] = useState<SelectOption[]>([])
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: profile }, { data }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).single(),
      supabase.from('work_orders').select(SELECT).eq('id', id).maybeSingle(),
    ])
    const myRole = (profile?.role as Role) ?? null
    setRole(myRole)
    setOrder(data as unknown as OrderDetail | null)
    setNotFound(!data)
    const latest = latestReport((data as unknown as OrderDetail | null)?.maintenance_records)
    setPhotoUrls(await signPhotoUrls(latest?.photos ?? []))

    if (myRole === 'admin') {
      const { data: ops } = await supabase.from('operators').select('id, specialty, profiles(full_name)')
      setOperators((ops ?? []).map((o: any) => ({
        id: o.id, label: o.profiles?.full_name ?? 'Operario sin nombre', sublabel: o.specialty,
      })))
    }
  }, [id])

  // Reload when coming back from "Completar trabajo"
  useFocusEffect(useCallback(() => { load() }, [load]))

  async function updateOrder(patch: Record<string, unknown>, errorText: string) {
    setBusy(true)
    const { error } = await supabase.from('work_orders').update(patch).eq('id', id)
    setBusy(false)
    if (error) Alert.alert('No se pudo actualizar', errorText)
    else await load()
  }

  const startWork = () => updateOrder({ status: 'en_proceso' }, 'No pudimos iniciar la orden. Inténtalo de nuevo.')
  const assign = (operatorId: string | null) =>
    updateOrder({ assigned_operator_id: operatorId }, 'No pudimos asignar el técnico.')
  const cancel = () =>
    Alert.alert('Cancelar orden', '¿Seguro que quieres cancelar esta orden?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar', style: 'destructive',
        onPress: () => updateOrder({ status: 'cancelada' }, 'No pudimos cancelar la orden.'),
      },
    ])

  if (!order) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <StatusBar style="dark" />
        {notFound ? (
          <>
            <Text className="text-lg font-semibold text-gray-900">No encontramos esta orden</Text>
            <TouchableOpacity onPress={() => router.back()} className="mt-4">
              <Text className="text-primary font-medium">Volver</Text>
            </TouchableOpacity>
          </>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </View>
    )
  }

  const status = STATUS_META[order.status]
  const report = latestReport(order.maintenance_records)
  const longDate = (d: string) => format(parseISO(d), "EEEE d 'de' MMMM yyyy", { locale: es })
  const isOpen = order.status === 'pendiente' || order.status === 'en_proceso'

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 bg-white border-b border-gray-100" style={{ paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Volver">
          <ChevronLeft size={26} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-2 flex-1">{order.order_number}</Text>
        <View className={`rounded-full px-3 py-1 ${status.chip}`}>
          <Text className={`text-xs font-semibold ${status.text}`}>{status.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120, gap: 16 }}>
        {/* What */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row gap-2 mb-3">
            <Tag>{TYPE_LABEL[order.type]}</Tag>
            <Tag
              tone={order.priority === 'urgente' ? 'red' : order.priority === 'alta' ? 'orange' : 'gray'}
              icon={order.priority === 'urgente' ? <Zap size={11} color="#b91c1c" fill="#b91c1c" /> : undefined}
            >
              {PRIORITY_LABEL[order.priority]}
            </Tag>
          </View>
          <Text className="text-base text-gray-900 leading-6">{order.description}</Text>
        </View>

        <Steps status={order.status} />

        {/* Where / who / when */}
        <View className="bg-white rounded-2xl border border-gray-100 px-4">
          {order.clients && (
            <InfoRow icon={Building2} label="Cliente" value={order.clients.company_name} />
          )}
          {order.clients?.address && <InfoRow icon={MapPin} label="Dirección" value={order.clients.address} />}
          {order.clients?.contact_phone && role !== 'cliente' && (
            <InfoRow
              icon={Phone}
              label="Teléfono"
              value={order.clients.contact_phone}
              onPress={() => Linking.openURL(`tel:${order.clients!.contact_phone}`)}
            />
          )}
          {order.projects && <InfoRow icon={HardHat} label="Obra" value={order.projects.name} />}
          {order.assets && (
            <InfoRow
              icon={Package}
              label="Equipo"
              value={order.assets.name + (order.assets.location ? ` · ${order.assets.location}` : '')}
            />
          )}
          <InfoRow
            icon={CalendarDays}
            label="Programada"
            value={order.scheduled_date ? longDate(order.scheduled_date) : 'Sin fecha'}
          />
          {role !== 'cliente' && (
            <InfoRow
              icon={UserRound}
              label="Técnico"
              value={order.operators?.profiles?.full_name ?? 'Sin asignar'}
              last
            />
          )}
        </View>

        {/* Admin: assign technician */}
        {role === 'admin' && isOpen && (
          <SelectField
            label="Asignar técnico"
            icon={HardHat}
            placeholder={operators.length ? 'Elige un técnico' : 'Aún no tienes técnicos'}
            options={operators}
            value={order.assigned_operator_id}
            onChange={assign}
            disabled={operators.length === 0 || busy}
            allowClear
          />
        )}

        {/* Report */}
        {report ? (
          <View className="bg-white rounded-2xl p-4 border border-green-100">
            <View className="flex-row items-center mb-3">
              <View className="w-9 h-9 rounded-xl bg-green-100 items-center justify-center">
                <FileCheck2 size={18} color="#16a34a" />
              </View>
              <View className="ml-3">
                <Text className="font-semibold text-gray-900">Reporte del trabajo</Text>
                <Text className="text-xs text-gray-500">
                  {format(parseISO(report.date), "d 'de' MMMM yyyy, h:mm a", { locale: es })}
                </Text>
              </View>
            </View>
            <ReportBlock icon={Wrench} title="Trabajo realizado" text={report.tasks_performed} />
            {report.observations && <ReportBlock icon={FileCheck2} title="Observaciones" text={report.observations} />}
            {report.pending_tasks && (
              <ReportBlock icon={TriangleAlert} title="Quedó pendiente" text={report.pending_tasks} warn />
            )}
            {photoUrls.length > 0 && (
              <View className="mt-3">
                <PhotoGrid urls={photoUrls} />
              </View>
            )}
          </View>
        ) : order.status === 'completada' ? (
          <Text className="text-sm text-gray-500 text-center">Esta orden se completó sin reporte.</Text>
        ) : null}

        {role === 'admin' && isOpen && (
          <TouchableOpacity onPress={cancel} disabled={busy} className="flex-row items-center justify-center py-3" accessibilityRole="button">
            <Ban size={16} color="#dc2626" />
            <Text className="text-red-600 font-medium ml-2">Cancelar orden</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Operario: one big action at the bottom, easy to hit in the field */}
      {role === 'operario' && isOpen && (
        <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          {order.status === 'pendiente' ? (
            <BigButton icon={Play} label="Iniciar trabajo" onPress={startWork} busy={busy} />
          ) : (
            <BigButton
              icon={CircleCheckBig}
              label="Completar trabajo"
              onPress={() => router.push({ pathname: '/completar-orden/[id]', params: { id: order.id } })}
              busy={busy}
              green
            />
          )}
        </View>
      )}
    </View>
  )
}

const TAG_TONES = {
  gray: { bg: 'bg-gray-100', text: 'text-gray-700' },
  red: { bg: 'bg-red-100', text: 'text-red-700' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700' },
} as const

function Tag({ children, tone = 'gray', icon }: { children: ReactNode; tone?: keyof typeof TAG_TONES; icon?: ReactNode }) {
  const t = TAG_TONES[tone]
  return (
    <View className={`flex-row items-center rounded-full px-2.5 py-1 ${t.bg}`}>
      {icon}
      <Text className={`text-xs font-medium ${t.text} ${icon ? 'ml-1' : ''}`}>{children}</Text>
    </View>
  )
}

function InfoRow({
  icon: Icon, label, value, onPress, last = false,
}: { icon: LucideIcon; label: string; value: string; onPress?: () => void; last?: boolean }) {
  const content = (
    <View className={`flex-row items-center py-3.5 ${last ? '' : 'border-b border-gray-100'}`}>
      <Icon size={18} color="#9ca3af" />
      <View className="flex-1 ml-3">
        <Text className="text-xs text-gray-500">{label}</Text>
        <Text className={`text-base ${onPress ? 'text-primary font-medium' : 'text-gray-900'}`}>{value}</Text>
      </View>
    </View>
  )
  return onPress ? <TouchableOpacity onPress={onPress} accessibilityRole="link">{content}</TouchableOpacity> : content
}

function ReportBlock({ icon: Icon, title, text, warn = false }: { icon: LucideIcon; title: string; text: string; warn?: boolean }) {
  return (
    <View className={`rounded-xl p-3 mt-2 ${warn ? 'bg-amber-50' : 'bg-gray-50'}`}>
      <View className="flex-row items-center mb-1">
        <Icon size={14} color={warn ? '#d97706' : '#6b7280'} />
        <Text className={`text-xs font-semibold ml-1.5 ${warn ? 'text-amber-800' : 'text-gray-600'}`}>{title}</Text>
      </View>
      <Text className="text-sm text-gray-800 leading-5">{text}</Text>
    </View>
  )
}

/** Pendiente → En proceso → Completada (or Cancelada). */
function Steps({ status }: { status: WorkOrderStatus }) {
  if (status === 'cancelada') {
    return (
      <View className="flex-row items-center bg-gray-100 rounded-2xl p-4">
        <Ban size={18} color="#6b7280" />
        <Text className="text-gray-700 font-medium ml-2">Esta orden fue cancelada</Text>
      </View>
    )
  }
  const steps: { key: WorkOrderStatus; label: string }[] = [
    { key: 'pendiente', label: 'Pendiente' },
    { key: 'en_proceso', label: 'En proceso' },
    { key: 'completada', label: 'Completada' },
  ]
  const current = steps.findIndex(s => s.key === status)
  return (
    <View className="flex-row items-center bg-white rounded-2xl border border-gray-100 px-4 py-4">
      {steps.map((s, i) => {
        const done = i <= current
        return (
          <View key={s.key} className="flex-1 flex-row items-center">
            <View className="items-center">
              <View className={`w-7 h-7 rounded-full items-center justify-center ${done ? 'bg-primary' : 'bg-gray-200'}`}>
                <Text className={`text-xs font-bold ${done ? 'text-white' : 'text-gray-500'}`}>{i + 1}</Text>
              </View>
              <Text className={`text-[11px] mt-1 ${done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s.label}</Text>
            </View>
            {i < steps.length - 1 && (
              <View className={`flex-1 h-0.5 mx-1 mb-4 ${i < current ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </View>
        )
      })}
    </View>
  )
}

function BigButton({
  icon: Icon, label, onPress, busy, green = false,
}: { icon: LucideIcon; label: string; onPress: () => void; busy: boolean; green?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy}
      activeOpacity={0.85}
      className="h-14 rounded-2xl flex-row items-center justify-center"
      style={{ backgroundColor: green ? '#16a34a' : colors.primary, opacity: busy ? 0.7 : 1 }}
      accessibilityRole="button"
    >
      {busy ? <ActivityIndicator color="#fff" /> : (
        <>
          <Icon size={20} color="#fff" strokeWidth={2.4} />
          <Text className="text-white font-semibold text-base ml-2">{label}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}
