import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { X, Wrench, FileText, TriangleAlert, CircleCheckBig } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { TextField } from '@/components/TextField'
import { PrimaryButton } from '@/components/AuthLayout'
import { AppModal } from '@/components/AppModal'

/**
 * Operator closes a work order: writes the report (maintenance_records) and
 * moves the order to "completada". The DB guard only allows en_proceso → completada.
 */
export default function CompletarOrden() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

  const [orderNumber, setOrderNumber] = useState('')
  const [assetId, setAssetId] = useState<string | null>(null)
  const [operatorId, setOperatorId] = useState<string | null>(null)

  const [tasks, setTasks] = useState('')
  const [observations, setObservations] = useState('')
  const [pending, setPending] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: order }, { data: op }] = await Promise.all([
        supabase.from('work_orders').select('order_number, asset_id').eq('id', id).single(),
        supabase.from('operators').select('id').eq('user_id', user?.id ?? '').maybeSingle(),
      ])
      setOrderNumber(order?.order_number ?? '')
      setAssetId(order?.asset_id ?? null)
      setOperatorId(op?.id ?? null)
    })()
  }, [id])

  async function submit() {
    if (tasks.trim().length < 5) {
      setError('Cuenta qué hiciste (mínimo 5 caracteres)')
      return
    }
    if (!operatorId) {
      Alert.alert('Sin perfil de técnico', 'Tu usuario no está registrado como técnico. Pide al administrador que lo revise.')
      return
    }

    setSaving(true)
    const { error: reportError } = await supabase.from('maintenance_records').insert({
      work_order_id: id,
      asset_id: assetId,
      operator_id: operatorId,
      tasks_performed: tasks.trim(),
      observations: observations.trim() || null,
      pending_tasks: pending.trim() || null,
    })
    if (reportError) {
      setSaving(false)
      Alert.alert('No se pudo guardar', 'No pudimos guardar el reporte. Revisa tu conexión e inténtalo de nuevo.')
      return
    }

    const { error: statusError } = await supabase.from('work_orders').update({ status: 'completada' }).eq('id', id)
    setSaving(false)
    if (statusError) {
      Alert.alert('Reporte guardado', 'Guardamos el reporte, pero no pudimos marcar la orden como completada. Inténtalo de nuevo.')
      return
    }
    setDone(true)
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <View className="flex-row items-center px-4 pb-3 bg-white border-b border-gray-100" style={{ paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancelar">
          <X size={24} color="#374151" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-lg font-bold text-gray-900">Completar trabajo</Text>
          {orderNumber ? <Text className="text-xs text-gray-500">{orderNumber}</Text> : null}
        </View>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={96}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 20 }}
      >
        <TextField
          label="¿Qué hiciste?"
          icon={Wrench}
          placeholder="Ej. Cambié el capacitor del compresor y recargué gas R410A."
          multiline
          value={tasks}
          onChangeText={t => { setTasks(t); if (error) setError(undefined) }}
          error={error}
        />
        <TextField
          label="Observaciones (opcional)"
          icon={FileText}
          placeholder="Estado en que quedó el equipo, recomendaciones…"
          multiline
          value={observations}
          onChangeText={setObservations}
        />
        <TextField
          label="¿Quedó algo pendiente? (opcional)"
          icon={TriangleAlert}
          placeholder="Ej. Falta cambiar el filtro, no había repuesto."
          multiline
          value={pending}
          onChangeText={setPending}
        />
        <Text className="text-xs text-gray-500 -mt-2">
          Lo pendiente quedará visible en la próxima visita a este cliente o equipo.
        </Text>

        <PrimaryButton label="Completar orden" onPress={submit} loading={saving} className="mt-2" />
      </KeyboardAwareScrollView>

      <AppModal
        visible={done}
        variant="success"
        icon={CircleCheckBig}
        title="¡Trabajo completado!"
        actionLabel="Listo"
        onAction={() => { setDone(false); router.back() }}
      >
        <Text className="text-base text-gray-600 text-center">
          El reporte de <Text className="font-semibold text-gray-900">{orderNumber}</Text> quedó guardado.
          El administrador y el cliente ya pueden verlo.
        </Text>
      </AppModal>
    </View>
  )
}
