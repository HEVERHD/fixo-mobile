import { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { X, Building2, Package, HardHat, ClipboardCheck, Zap } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import {
  PRIORITY_LABEL, TYPE_LABEL, dateChoiceOptions, scheduledDateFor,
  type DateChoice, type WorkOrderType,
} from '@/lib/workOrders'
import { SERVICE_REQUEST_FIELDS, acceptServiceRequest, type ServiceRequest } from '@/lib/serviceRequests'
import { SelectField, type SelectOption } from '@/components/SelectField'
import { ChipGroup } from '@/components/ChipGroup'
import { PrimaryButton } from '@/components/AuthLayout'
import { AppModal, useModal } from '@/components/AppModal'
import { MetaRow } from '@/components/ui'

export default function AceptarSolicitud() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const modal = useModal()

  const [request, setRequest] = useState<ServiceRequest | null | undefined>(undefined)
  const [operators, setOperators] = useState<SelectOption[]>([])
  const [type, setType] = useState<WorkOrderType>('correctivo')
  const [date, setDate] = useState<DateChoice>('hoy')
  const [operatorId, setOperatorId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const [{ data: r }, { data: o }] = await Promise.all([
        supabase.from('service_requests').select(SERVICE_REQUEST_FIELDS).eq('id', id).maybeSingle(),
        supabase.from('operators').select('id, specialty, profiles(full_name)'),
      ])
      setRequest((r ?? null) as unknown as ServiceRequest | null)
      setOperators((o ?? []).map((x: any) => ({
        id: x.id,
        label: x.profiles?.full_name ?? 'Operario sin nombre',
        sublabel: x.specialty,
      })))
    })()
  }, [id])

  const dateOptions = useMemo(() => dateChoiceOptions(), [])

  async function accept() {
    if (!request) return
    setSaving(true)
    const { orderNumber, error } = await acceptServiceRequest(request.id, {
      type,
      operatorId,
      scheduledDate: scheduledDateFor(date),
    })
    setSaving(false)

    if (error) {
      await modal.alert({ variant: 'error', title: 'No se pudo aceptar', message: error })
      return
    }
    setCreated(orderNumber ?? '')
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 bg-white border-b border-gray-100" style={{ paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancelar">
          <X size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-4">Aceptar solicitud</Text>
      </View>

      {request === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !request || request.status !== 'nueva' ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base text-gray-600 text-center">
            {request ? 'Esta solicitud ya fue respondida.' : 'No encontramos esta solicitud.'}
          </Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          bottomOffset={96}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 20 }}
        >
          {/* What the client asked for */}
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <MetaRow icon={Building2}>{request.clients?.company_name ?? 'Cliente'}</MetaRow>
            {request.assets && <MetaRow icon={Package}>{request.assets.name}</MetaRow>}
            <Text className="text-gray-800 text-base mt-3">{request.description}</Text>
            <View className="flex-row items-center mt-3">
              {request.priority === 'urgente' && <Zap size={13} color="#b91c1c" fill="#b91c1c" />}
              <Text className="text-xs text-gray-500 ml-1">Prioridad {PRIORITY_LABEL[request.priority].toLowerCase()}</Text>
            </View>
          </View>

          <ChipGroup
            label="Tipo de servicio"
            value={type}
            onChange={setType}
            options={(Object.keys(TYPE_LABEL) as WorkOrderType[]).map(v => ({ value: v, label: TYPE_LABEL[v] }))}
          />

          <ChipGroup label="Fecha programada" value={date} onChange={setDate} options={dateOptions} />

          <SelectField
            label="Asignar a"
            optional
            icon={HardHat}
            placeholder={operators.length ? 'Elige un operario' : 'Aún no tienes operarios'}
            options={operators}
            value={operatorId}
            onChange={setOperatorId}
            disabled={operators.length === 0}
            allowClear
          />

          <PrimaryButton label="Crear orden" onPress={accept} loading={saving} className="mt-2" />
        </KeyboardAwareScrollView>
      )}

      <AppModal
        visible={created !== null}
        variant="success"
        icon={ClipboardCheck}
        title="¡Solicitud aceptada!"
        actionLabel="Listo"
        onAction={() => { setCreated(null); router.back() }}
      >
        <Text className="text-base text-gray-600 text-center">
          Se creó la orden <Text className="font-semibold text-gray-900">{created}</Text>
          {operatorId ? ' y quedó asignada.' : '. Puedes asignarla a un operario más adelante.'}
          {' '}El cliente verá el avance en su portal.
        </Text>
      </AppModal>
    </View>
  )
}
