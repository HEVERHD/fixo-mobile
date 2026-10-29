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
import { AddPhotoButtons, PhotoGrid } from '@/components/PhotoStrip'
import { MAX_PHOTOS, pickPhotos, removeWorkPhoto, uploadWorkPhoto } from '@/lib/photos'

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
  const [orgId, setOrgId] = useState<string | null>(null)
  // Uploaded right away; the paths go with the report (local uri only for the preview)
  const [photos, setPhotos] = useState<{ path: string; uri: string }[]>([])
  const [uploading, setUploading] = useState(false)

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
        supabase.from('operators').select('id, organization_id').eq('user_id', user?.id ?? '').maybeSingle(),
      ])
      setOrderNumber(order?.order_number ?? '')
      setAssetId(order?.asset_id ?? null)
      setOperatorId(op?.id ?? null)
      setOrgId(op?.organization_id ?? null)
    })()
  }, [id])

  async function addPhotos(source: 'camera' | 'library') {
    if (!orgId) return
    const picked = await pickPhotos(source, MAX_PHOTOS - photos.length)
    if (!picked.ok) {
      if (picked.reason === 'permission') {
        Alert.alert('Sin acceso a la cámara', 'Permite el acceso a la cámara en los ajustes del teléfono para tomar fotos.')
      }
      return
    }
    setUploading(true)
    const added: { path: string; uri: string }[] = []
    for (const asset of picked.assets) {
      const path = await uploadWorkPhoto(orgId, id, asset)
      if (path) added.push({ path, uri: asset.uri })
    }
    setUploading(false)
    setPhotos(p => [...p, ...added])
    if (added.length < picked.assets.length) {
      Alert.alert('Algunas fotos no se subieron', 'Revisa tu conexión e inténtalo de nuevo.')
    }
  }

  function removePhoto(index: number) {
    const photo = photos[index]
    if (!photo) return
    setPhotos(p => p.filter((_, i) => i !== index))
    removeWorkPhoto(photo.path)
  }

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
      photos: photos.map(p => p.path),
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

        <View className="gap-3">
          <Text className="text-sm font-medium text-gray-700">
            Fotos de evidencia <Text className="font-normal text-gray-400">(opcional, máximo {MAX_PHOTOS})</Text>
          </Text>
          <PhotoGrid urls={photos.map(p => p.uri)} onRemove={removePhoto} />
          {photos.length < MAX_PHOTOS && (
            <AddPhotoButtons
              onCamera={() => addPhotos('camera')}
              onLibrary={() => addPhotos('library')}
              busy={uploading}
              disabled={!orgId}
            />
          )}
        </View>

        <PrimaryButton label="Completar orden" onPress={submit} loading={saving || uploading} className="mt-2" />
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
