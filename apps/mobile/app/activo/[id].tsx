import { useCallback, useState, type ReactNode } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChevronLeft, Building2, MapPin, Tag, CalendarDays, Printer, Plus, TriangleAlert,
  Wrench, HardHat, ClipboardList, History, ChevronRight, type LucideIcon,
} from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { supabase, type Role } from '@/lib/supabase'
import { fetchMyOrganization } from '@/lib/organization'
import { ASSET_STATUS_META, assetLink, printAssetLabels, type AssetStatus } from '@/lib/assets'
import { STATUS_META, type WorkOrderStatus } from '@/lib/workOrders'
import { QrCode } from '@/components/QrCode'
import { EmptyState } from '@/components/ui'
import { PhotoGrid } from '@/components/PhotoStrip'
import { signPhotoUrls } from '@/lib/photos'

interface AssetDetail {
  id: string
  name: string
  type: string | null
  brand: string | null
  model: string | null
  location: string | null
  status: AssetStatus
  installation_date: string | null
  qr_code: string
  client_id: string
  clients: { company_name: string; address: string | null } | null
}

interface Visit {
  id: string
  date: string
  tasks_performed: string
  observations: string | null
  pending_tasks: string | null
  photos: string[] | null
  operators: { profiles: { full_name: string } | null } | null
  work_orders: { order_number: string } | null
}

interface OpenOrder {
  id: string
  order_number: string
  description: string
  status: WorkOrderStatus
}

const OPEN_STATUSES: WorkOrderStatus[] = ['pendiente', 'en_proceso']
const dateLabel = (d: string) => format(parseISO(d), "d 'de' MMMM yyyy", { locale: es })

/**
 * Asset sheet: what scanning its QR opens. Shows the technical data, what was
 * left pending on the last visit, open orders and the maintenance history.
 * RLS decides what each role sees (clients only their own assets).
 */
export default function ActivoDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [asset, setAsset] = useState<AssetDetail | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [orders, setOrders] = useState<OpenOrder[]>([])
  const [role, setRole] = useState<Role | null>(null)
  const [missing, setMissing] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [visitPhotos, setVisitPhotos] = useState<Record<string, string[]>>({})

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: profile }, { data: a }, { data: v }, { data: o }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).single(),
      supabase.from('assets')
        .select('id, name, type, brand, model, location, status, installation_date, qr_code, client_id, clients(company_name, address)')
        .eq('id', id).maybeSingle(),
      supabase.from('maintenance_records')
        .select('id, date, tasks_performed, observations, pending_tasks, photos, operators(profiles(full_name)), work_orders(order_number)')
        .eq('asset_id', id).order('date', { ascending: false }).limit(20),
      supabase.from('work_orders')
        .select('id, order_number, description, status')
        .eq('asset_id', id).in('status', OPEN_STATUSES).order('created_at', { ascending: false }),
    ])
    setRole((profile?.role as Role) ?? null)
    setAsset(a as unknown as AssetDetail | null)
    setMissing(!a)
    const visitRows = (v ?? []) as unknown as Visit[]
    setVisits(visitRows)
    setOrders((o ?? []) as OpenOrder[])
    // Signed one by one so each visit keeps its own photos in order
    const signed = await Promise.all(visitRows.map(row => signPhotoUrls(row.photos ?? [])))
    setVisitPhotos(Object.fromEntries(visitRows.map((row, i) => [row.id, signed[i] ?? []])))
  }, [id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function printLabel() {
    if (!asset) return
    setPrinting(true)
    try {
      const org = await fetchMyOrganization()
      await printAssetLabels(
        [{ name: asset.name, qr_code: asset.qr_code, location: asset.location, clientName: asset.clients?.company_name }],
        org?.name ?? '',
      )
    } catch {
      // Closing the print dialog rejects on some platforms; nothing to report
    } finally {
      setPrinting(false)
    }
  }

  const header = (
    <View className="flex-row items-center px-4 pb-2 bg-gray-50" style={{ paddingTop: insets.top + 8 }}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Volver">
        <ChevronLeft size={26} color="#374151" />
      </TouchableOpacity>
    </View>
  )

  if (missing) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        {header}
        <View className="p-4">
          <EmptyState
            icon={TriangleAlert}
            title="Equipo no encontrado"
            message="No existe o no pertenece a tu empresa."
          />
        </View>
      </View>
    )
  }

  if (!asset) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        {header}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    )
  }

  const status = ASSET_STATUS_META[asset.status] ?? ASSET_STATUS_META.activo
  const lastVisit = visits[0]
  const isAdmin = role === 'admin'
  const brandModel = [asset.brand, asset.model].filter(Boolean).join(' ')

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {header}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: insets.bottom + 24, gap: 16 }}>
        {/* Title */}
        <View>
          <View className={`self-start rounded-full px-2.5 py-1 mb-2 ${status.chip}`}>
            <Text className={`text-xs font-medium ${status.text}`}>{status.label}</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900">{asset.name}</Text>
          {asset.type && <Text className="text-sm text-gray-500 mt-0.5">{asset.type}</Text>}
        </View>

        {/* Pending from the last visit: the first thing a technician needs */}
        {lastVisit?.pending_tasks && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <View className="flex-row items-center mb-1.5">
              <TriangleAlert size={16} color="#b45309" />
              <Text className="text-sm font-semibold text-amber-900 ml-1.5">Quedó pendiente en la última visita</Text>
            </View>
            <Text className="text-sm text-amber-900">{lastVisit.pending_tasks}</Text>
            <Text className="text-xs text-amber-700 mt-2">{dateLabel(lastVisit.date)}</Text>
          </View>
        )}

        {/* Technical sheet */}
        <View className="bg-white rounded-2xl border border-gray-100 px-4">
          {asset.clients && <InfoRow icon={Building2} label="Cliente" value={asset.clients.company_name} />}
          {asset.location && <InfoRow icon={MapPin} label="Ubicación" value={asset.location} />}
          {brandModel.length > 0 && <InfoRow icon={Tag} label="Marca y modelo" value={brandModel} />}
          {asset.installation_date && (
            <InfoRow icon={CalendarDays} label="Instalado" value={dateLabel(asset.installation_date)} />
          )}
          <InfoRow icon={History} label="Visitas registradas" value={String(visits.length)} last />
        </View>

        {/* QR */}
        <View className="bg-white rounded-2xl border border-gray-100 p-5 items-center">
          <QrCode value={assetLink(asset.qr_code)} size={168} />
          <Text className="text-lg font-bold text-gray-900 mt-3 tracking-widest">{asset.qr_code}</Text>
          {isAdmin && (
            <TouchableOpacity
              onPress={printLabel}
              disabled={printing}
              className={`flex-row items-center h-11 px-5 rounded-xl bg-blue-50 mt-3 ${printing ? 'opacity-60' : ''}`}
              accessibilityRole="button"
            >
              {printing
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Printer size={17} color={colors.primary} />}
              <Text className="text-sm font-semibold text-primary ml-2">Imprimir etiqueta</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Open orders */}
        <Section title="Órdenes abiertas">
          {orders.length === 0 ? (
            <Text className="text-sm text-gray-500">No hay órdenes abiertas para este equipo.</Text>
          ) : (
            <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {orders.map((o, i) => {
                const meta = STATUS_META[o.status] ?? STATUS_META.pendiente
                return (
                  <TouchableOpacity
                    key={o.id}
                    onPress={() => router.push({ pathname: '/orden/[id]', params: { id: o.id } })}
                    activeOpacity={0.7}
                    className={`flex-row items-center px-4 py-3.5 ${i === orders.length - 1 ? '' : 'border-b border-gray-100'}`}
                  >
                    <View className={`w-2.5 h-2.5 rounded-full mr-3 ${meta.dot}`} />
                    <View className="flex-1 mr-2">
                      <Text className="font-semibold text-gray-900 text-sm">{o.order_number}</Text>
                      <Text className="text-sm text-gray-600" numberOfLines={1}>{o.description}</Text>
                    </View>
                    <ChevronRight size={18} color="#d1d5db" />
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
          {isAdmin && (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/nueva-orden', params: { clientId: asset.client_id, assetId: asset.id } })}
              className="h-12 rounded-2xl bg-primary flex-row items-center justify-center mt-3"
              accessibilityRole="button"
            >
              <Plus size={18} color="#fff" strokeWidth={2.4} />
              <Text className="text-white font-semibold ml-2">Nueva orden para este equipo</Text>
            </TouchableOpacity>
          )}
        </Section>

        {/* History */}
        <Section title="Historial de mantenimiento">
          {visits.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Sin visitas todavía" message="Cuando un técnico cierre una orden de este equipo, su reporte quedará aquí." />
          ) : (
            <View className="gap-3">
              {visits.map(v => (
                <View key={v.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-semibold text-gray-900">{dateLabel(v.date)}</Text>
                    {v.work_orders && <Text className="text-xs text-gray-400">{v.work_orders.order_number}</Text>}
                  </View>
                  <VisitLine icon={Wrench} text={v.tasks_performed} />
                  {v.observations && <VisitLine icon={ClipboardList} text={v.observations} muted />}
                  {v.pending_tasks && <VisitLine icon={TriangleAlert} text={v.pending_tasks} warn />}
                  {(visitPhotos[v.id]?.length ?? 0) > 0 && (
                    <View className="mt-3">
                      <PhotoGrid urls={visitPhotos[v.id]!} />
                    </View>
                  )}
                  {v.operators?.profiles?.full_name && (
                    <View className="flex-row items-center mt-2">
                      <HardHat size={13} color="#9ca3af" />
                      <Text className="text-xs text-gray-500 ml-1.5">{v.operators.profiles.full_name}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </Section>
      </ScrollView>
    </View>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="text-base font-semibold text-gray-900 mb-3">{title}</Text>
      {children}
    </View>
  )
}

function InfoRow({ icon: Icon, label, value, last = false }: { icon: LucideIcon; label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center py-3.5 ${last ? '' : 'border-b border-gray-100'}`}>
      <Icon size={17} color="#9ca3af" strokeWidth={2} />
      <Text className="text-sm text-gray-500 ml-3 w-32">{label}</Text>
      <Text className="text-sm text-gray-900 font-medium flex-1 text-right">{value}</Text>
    </View>
  )
}

function VisitLine({ icon: Icon, text, muted = false, warn = false }: { icon: LucideIcon; text: string; muted?: boolean; warn?: boolean }) {
  return (
    <View className="flex-row mt-1">
      <Icon size={14} color={warn ? '#d97706' : '#9ca3af'} style={{ marginTop: 2 }} />
      <Text className={`text-sm ml-2 flex-1 ${warn ? 'text-amber-800' : muted ? 'text-gray-500' : 'text-gray-700'}`}>{text}</Text>
    </View>
  )
}
