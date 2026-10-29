import { useCallback, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useFocusEffect, type Href } from 'expo-router'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, Inbox, Package, Clock, ClipboardList, MessageSquare, Zap, Check, X } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { PRIORITY_LABEL } from '@/lib/workOrders'
import {
  REQUEST_STATUS_META, SERVICE_REQUEST_FIELDS, rejectServiceRequest, type ServiceRequest,
} from '@/lib/serviceRequests'
import { ChipGroup } from '@/components/ChipGroup'
import { TextField } from '@/components/TextField'
import { EmptyState, MetaRow } from '@/components/ui'
import { AppModal, useModal } from '@/components/AppModal'

type Filter = 'nuevas' | 'respondidas'

export default function Solicitudes() {
  const [requests, setRequests] = useState<ServiceRequest[] | null>(null)
  const [filter, setFilter] = useState<Filter>('nuevas')
  const [refreshing, setRefreshing] = useState(false)
  const [rejecting, setRejecting] = useState<ServiceRequest | null>(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const modal = useModal()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('service_requests')
      .select(SERVICE_REQUEST_FIELDS)
      .order('created_at', { ascending: false })
      .limit(100)
    setRequests((data ?? []) as unknown as ServiceRequest[])
    setRefreshing(false)
  }, [])

  // Reload when coming back from "Aceptar solicitud"
  useFocusEffect(useCallback(() => { load() }, [load]))

  const fresh = requests?.filter(r => r.status === 'nueva') ?? []
  const answered = requests?.filter(r => r.status !== 'nueva') ?? []
  const shown = filter === 'nuevas' ? fresh : answered

  const accept = (r: ServiceRequest) => router.push({ pathname: '/aceptar-solicitud/[id]', params: { id: r.id } } as unknown as Href)

  function openReject(r: ServiceRequest) {
    setReason('')
    setRejecting(r)
  }

  async function confirmReject() {
    if (!rejecting) return
    setSaving(true)
    const ok = await rejectServiceRequest(rejecting.id, reason)
    setSaving(false)
    setRejecting(null)
    if (!ok) {
      await modal.alert({
        variant: 'error',
        title: 'No se pudo rechazar',
        message: 'Puede que ya haya sido respondida. Actualiza la lista e inténtalo de nuevo.',
      })
    }
    load()
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="flex-row items-center px-4 py-2">
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Volver">
          <ChevronLeft size={26} color="#374151" />
        </TouchableOpacity>
      </View>

      {!requests ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load() }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Text className="text-2xl font-bold text-gray-900">Solicitudes de clientes</Text>
          <Text className="text-sm text-gray-500 mt-0.5 mb-4">
            Tus clientes las envían desde el portal web.
          </Text>

          <View className="mb-4">
            <ChipGroup
              label="Mostrar"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'nuevas', label: `Nuevas (${fresh.length})` },
                { value: 'respondidas', label: `Respondidas (${answered.length})` },
              ]}
            />
          </View>

          {shown.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={filter === 'nuevas' ? 'No hay solicitudes nuevas' : 'Aún no has respondido solicitudes'}
              message={filter === 'nuevas' ? 'Cuando un cliente pida un servicio, aparecerá aquí.' : undefined}
            />
          ) : (
            <View className="gap-3">
              {shown.map(r => (
                <RequestCard key={r.id} request={r} onAccept={() => accept(r)} onReject={() => openReject(r)} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <AppModal
        visible={rejecting !== null}
        variant="warning"
        animation={null}
        title="Rechazar solicitud"
        actionLabel="Rechazar"
        destructive
        loading={saving}
        onAction={confirmReject}
        secondaryLabel="Volver"
        onSecondary={() => setRejecting(null)}
      >
        <Text className="text-base text-gray-600 text-center mb-4">
          {rejecting?.clients?.company_name ?? 'El cliente'} verá el motivo en su portal.
        </Text>
        <TextField
          label="Motivo (opcional)"
          icon={MessageSquare}
          placeholder="Ej. No cubrimos esa zona."
          multiline
          maxLength={1000}
          value={reason}
          onChangeText={setReason}
        />
      </AppModal>
    </SafeAreaView>
  )
}

function RequestCard({ request: r, onAccept, onReject }: {
  request: ServiceRequest
  onAccept: () => void
  onReject: () => void
}) {
  const status = REQUEST_STATUS_META[r.status] ?? REQUEST_STATUS_META.nueva
  const urgent = r.priority === 'urgente'

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
          {r.clients?.company_name ?? 'Cliente'}
        </Text>
        <View className="flex-row gap-1.5">
          <View className={`flex-row items-center rounded-full px-2.5 py-1 ${urgent ? 'bg-red-100' : 'bg-gray-100'}`}>
            {urgent && <Zap size={11} color="#b91c1c" fill="#b91c1c" />}
            <Text className={`text-xs font-medium ${urgent ? 'text-red-700 ml-0.5' : 'text-gray-600'}`}>
              {PRIORITY_LABEL[r.priority]}
            </Text>
          </View>
          <View className={`rounded-full px-2.5 py-1 ${status.chip}`}>
            <Text className={`text-xs font-medium ${status.text}`}>{status.label}</Text>
          </View>
        </View>
      </View>

      <Text className="text-gray-700 text-sm mb-1">{r.description}</Text>
      {r.assets && <MetaRow icon={Package}>{r.assets.name}</MetaRow>}
      <MetaRow icon={Clock}>
        Hace {formatDistanceToNow(parseISO(r.created_at), { locale: es })}
      </MetaRow>
      {r.work_orders && <MetaRow icon={ClipboardList}>Orden {r.work_orders.order_number}</MetaRow>}
      {r.status === 'rechazada' && r.response && <MetaRow icon={MessageSquare}>{r.response}</MetaRow>}

      {r.status === 'nueva' && (
        <View className="flex-row gap-2 mt-3">
          <TouchableOpacity
            onPress={onAccept}
            className="flex-1 h-10 rounded-xl bg-primary flex-row items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={`Aceptar solicitud de ${r.clients?.company_name ?? 'cliente'}`}
          >
            <Check size={16} color="#fff" strokeWidth={2.4} />
            <Text className="text-sm font-semibold text-white ml-1.5">Aceptar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onReject}
            className="h-10 px-4 rounded-xl bg-gray-100 flex-row items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={`Rechazar solicitud de ${r.clients?.company_name ?? 'cliente'}`}
          >
            <X size={16} color="#4b5563" />
            <Text className="text-sm font-medium text-gray-600 ml-1">Rechazar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
