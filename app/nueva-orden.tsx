import { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { X, Building2, Package, HardHat, FileText, ClipboardCheck } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import {
  PRIORITY_LABEL, TYPE_LABEL, dateChoiceOptions, scheduledDateFor,
  type DateChoice, type WorkOrderPriority, type WorkOrderType,
} from '@/lib/workOrders'
import { fetchMyOrganization, featuresFor } from '@/lib/organization'
import { TextField } from '@/components/TextField'
import { SelectField, type SelectOption } from '@/components/SelectField'
import { ChipGroup } from '@/components/ChipGroup'
import { PrimaryButton } from '@/components/AuthLayout'
import { AppModal } from '@/components/AppModal'

const PRIORITY_ACTIVE: Record<WorkOrderPriority, string> = {
  baja: 'bg-gray-500 border-gray-500',
  media: 'bg-primary border-primary',
  alta: 'bg-orange-500 border-orange-500',
  urgente: 'bg-red-500 border-red-500',
}

interface AssetRow { id: string; name: string; location: string | null; client_id: string }
interface ProjectRow { id: string; name: string; address: string | null; client_id: string }

export default function NuevaOrden() {
  const insets = useSafeAreaInsets()

  const [clients, setClients] = useState<SelectOption[]>([])
  const [assets, setAssets] = useState<AssetRow[]>([])
  const [operators, setOperators] = useState<SelectOption[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [features, setFeatures] = useState(featuresFor(null))

  // Optional prefill, e.g. "Nueva orden" from an asset's detail screen
  const params = useLocalSearchParams<{ clientId?: string; assetId?: string }>()
  const [clientId, setClientId] = useState<string | null>(params.clientId ?? null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [assetId, setAssetId] = useState<string | null>(params.assetId ?? null)
  const [operatorId, setOperatorId] = useState<string | null>(null)
  const [type, setType] = useState<WorkOrderType>('correctivo')
  const [priority, setPriority] = useState<WorkOrderPriority>('media')
  const [date, setDate] = useState<DateChoice>('hoy')
  const [description, setDescription] = useState('')

  const [errors, setErrors] = useState<{ client?: string; description?: string }>({})
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: a }, { data: o }, { data: p }, org] = await Promise.all([
        supabase.from('clients').select('id, company_name, address').order('company_name'),
        supabase.from('assets').select('id, name, location, client_id').order('name'),
        supabase.from('operators').select('id, specialty, profiles(full_name)'),
        supabase.from('projects').select('id, name, address, client_id').neq('status', 'terminada').order('name'),
        fetchMyOrganization(),
      ])
      setFeatures(featuresFor(org?.business_type))
      setProjects((p ?? []) as ProjectRow[])
      setClients((c ?? []).map(x => ({ id: x.id, label: x.company_name, sublabel: x.address })))
      setAssets((a ?? []) as AssetRow[])
      setOperators((o ?? []).map((x: any) => ({
        id: x.id,
        label: x.profiles?.full_name ?? 'Operario sin nombre',
        sublabel: x.specialty,
      })))
    })()
  }, [])

  const clientAssets = useMemo<SelectOption[]>(
    () => assets.filter(a => a.client_id === clientId).map(a => ({ id: a.id, label: a.name, sublabel: a.location })),
    [assets, clientId],
  )

  const clientProjects = useMemo<SelectOption[]>(
    () => projects.filter(p => p.client_id === clientId).map(p => ({ id: p.id, label: p.name, sublabel: p.address })),
    [projects, clientId],
  )

  const dateOptions = useMemo(() => dateChoiceOptions(), [])

  function selectClient(id: string | null) {
    setClientId(id)
    // project and asset must belong to the chosen client
    setAssetId(null)
    setProjectId(null)
    setErrors(e => ({ ...e, client: undefined }))
  }

  async function save() {
    const next: typeof errors = {}
    if (!clientId) next.client = 'Elige el cliente'
    if (description.trim().length < 5) next.description = 'Describe el trabajo (mínimo 5 caracteres)'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    // organization_id defaults to the admin's org; order_number comes from a DB trigger
    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        client_id: clientId,
        project_id: projectId,
        asset_id: assetId,
        assigned_operator_id: operatorId,
        type,
        priority,
        description: description.trim(),
        scheduled_date: scheduledDateFor(date),
      })
      .select('order_number')
      .single()
    setSaving(false)

    if (error) {
      Alert.alert('No se pudo crear la orden', 'Revisa tu conexión e inténtalo de nuevo.')
      return
    }
    setCreated(data.order_number)
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-4 pb-3 bg-white border-b border-gray-100" style={{ paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancelar">
          <X size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-4">Nueva orden de trabajo</Text>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={96}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 20 }}
      >
        <SelectField
          label="Cliente"
          icon={Building2}
          placeholder="Elige el cliente"
          options={clients}
          value={clientId}
          onChange={selectClient}
          error={errors.client}
          emptyText="Aún no tienes clientes registrados"
        />

        {features.obras && (
          <SelectField
            label="Obra"
            optional
            icon={HardHat}
            placeholder={clientId ? 'Elige la obra' : 'Primero elige el cliente'}
            options={clientProjects}
            value={projectId}
            onChange={setProjectId}
            disabled={!clientId}
            allowClear
            emptyText="Este cliente no tiene obras activas"
          />
        )}

        {features.equipos && (
          <SelectField
            label="Equipo"
            optional
            icon={Package}
            placeholder={clientId ? 'Elige el equipo' : 'Primero elige el cliente'}
            options={clientAssets}
            value={assetId}
            onChange={setAssetId}
            disabled={!clientId}
            allowClear
            emptyText="Este cliente no tiene equipos registrados"
          />
        )}

        <TextField
          label="¿Qué hay que hacer?"
          icon={FileText}
          placeholder="Ej. El aire no enfría, revisar compresor y carga de gas."
          multiline
          value={description}
          onChangeText={t => { setDescription(t); if (errors.description) setErrors(e => ({ ...e, description: undefined })) }}
          error={errors.description}
        />

        <ChipGroup
          label="Tipo de servicio"
          value={type}
          onChange={setType}
          options={(Object.keys(TYPE_LABEL) as WorkOrderType[]).map(v => ({ value: v, label: TYPE_LABEL[v] }))}
        />

        <ChipGroup
          label="Prioridad"
          value={priority}
          onChange={setPriority}
          options={(Object.keys(PRIORITY_LABEL) as WorkOrderPriority[]).map(v => ({
            value: v, label: PRIORITY_LABEL[v], activeClass: PRIORITY_ACTIVE[v],
          }))}
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

        <PrimaryButton label="Crear orden" onPress={save} loading={saving} className="mt-2" />
      </KeyboardAwareScrollView>

      <AppModal
        visible={created !== null}
        variant="success"
        icon={ClipboardCheck}
        title="¡Orden creada!"
        actionLabel="Listo"
        onAction={() => { setCreated(null); router.back() }}
      >
        <Text className="text-base text-gray-600 text-center">
          La orden <Text className="font-semibold text-gray-900">{created}</Text> quedó registrada
          {operatorId ? ' y asignada.' : '. Puedes asignarla a un operario más adelante.'}
        </Text>
      </AppModal>
    </View>
  )
}
