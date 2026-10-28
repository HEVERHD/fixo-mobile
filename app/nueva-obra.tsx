import { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { addDays, format, nextMonday } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, Building2, HardHat, MapPin, Wallet, CircleCheckBig } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { PROJECT_STATUS_META, formatMoney, type ProjectStatus } from '@/lib/projects'
import { TextField } from '@/components/TextField'
import { SelectField, type SelectOption } from '@/components/SelectField'
import { ChipGroup } from '@/components/ChipGroup'
import { PrimaryButton } from '@/components/AuthLayout'
import { FeedbackModal } from '@/components/FeedbackModal'

type StartChoice = 'hoy' | 'lunes' | 'mes' | 'ninguna'

export default function NuevaObra() {
  const insets = useSafeAreaInsets()

  const [clients, setClients] = useState<SelectOption[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [budget, setBudget] = useState('')
  const [start, setStart] = useState<StartChoice>('hoy')
  const [status, setStatus] = useState<ProjectStatus>('planeacion')

  const [errors, setErrors] = useState<{ client?: string; name?: string }>({})
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('clients').select('id, company_name, address').order('company_name')
      .then(({ data }) => setClients((data ?? []).map(c => ({ id: c.id, label: c.company_name, sublabel: c.address }))))
  }, [])

  const startOptions = useMemo(() => {
    const today = new Date()
    return [
      { value: 'hoy' as const, label: `Hoy · ${format(today, 'd MMM', { locale: es })}` },
      { value: 'lunes' as const, label: `Próximo lunes · ${format(nextMonday(today), 'd MMM', { locale: es })}` },
      { value: 'mes' as const, label: `En un mes · ${format(addDays(today, 30), 'd MMM', { locale: es })}` },
      { value: 'ninguna' as const, label: 'Por definir' },
    ]
  }, [])

  function startDate(choice: StartChoice) {
    const today = new Date()
    if (choice === 'hoy') return format(today, 'yyyy-MM-dd')
    if (choice === 'lunes') return format(nextMonday(today), 'yyyy-MM-dd')
    if (choice === 'mes') return format(addDays(today, 30), 'yyyy-MM-dd')
    return null
  }

  // Keep only digits so "45.000.000" or "$45,000,000" both work
  const budgetValue = budget.replace(/\D/g, '')
  const budgetPreview = budgetValue ? formatMoney(budgetValue) : null

  async function save() {
    const next: typeof errors = {}
    if (!clientId) next.client = 'Elige el cliente'
    if (name.trim().length < 3) next.name = 'Escribe el nombre de la obra'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    const { error } = await supabase.from('projects').insert({
      client_id: clientId,
      name: name.trim(),
      address: address.trim() || null,
      budget: budgetValue ? Number(budgetValue) : null,
      start_date: startDate(start),
      status,
    })
    setSaving(false)

    if (error) {
      Alert.alert('No se pudo crear la obra', 'Revisa tu conexión e inténtalo de nuevo.')
      return
    }
    setCreated(name.trim())
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <View className="flex-row items-center px-4 pb-3 bg-white border-b border-gray-100" style={{ paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancelar">
          <X size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-4">Nueva obra</Text>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={96}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 20 }}
      >
        <SelectField
          label="Cliente"
          icon={Building2}
          placeholder="¿Para quién es la obra?"
          options={clients}
          value={clientId}
          onChange={id => { setClientId(id); setErrors(e => ({ ...e, client: undefined })) }}
          error={errors.client}
          emptyText="Aún no tienes clientes registrados"
        />

        <TextField
          label="Nombre de la obra"
          icon={HardHat}
          placeholder="Ej. Remodelación sede norte"
          value={name}
          onChangeText={t => { setName(t); if (errors.name) setErrors(e => ({ ...e, name: undefined })) }}
          error={errors.name}
          returnKeyType="next"
        />

        <TextField
          label="Dirección (opcional)"
          icon={MapPin}
          placeholder="Dónde se ejecuta la obra"
          value={address}
          onChangeText={setAddress}
        />

        <View>
          <TextField
            label="Presupuesto (opcional)"
            icon={Wallet}
            placeholder="0"
            keyboardType="number-pad"
            value={budget}
            onChangeText={setBudget}
          />
          {budgetPreview && <Text className="text-xs text-gray-500 mt-1.5">{budgetPreview}</Text>}
        </View>

        <ChipGroup label="Fecha de inicio" value={start} onChange={setStart} options={startOptions} />

        <ChipGroup
          label="Estado"
          value={status}
          onChange={setStatus}
          options={(['planeacion', 'en_ejecucion'] as const).map(v => ({ value: v, label: PROJECT_STATUS_META[v].label }))}
        />

        <PrimaryButton label="Crear obra" onPress={save} loading={saving} className="mt-2" />
      </KeyboardAwareScrollView>

      <FeedbackModal
        visible={created !== null}
        variant="success"
        icon={CircleCheckBig}
        title="¡Obra creada!"
        actionLabel="Listo"
        onAction={() => { setCreated(null); router.back() }}
      >
        <Text className="text-base text-gray-600 text-center">
          <Text className="font-semibold text-gray-900">{created}</Text> quedó registrada. Ya puedes crear
          órdenes de trabajo dentro de esta obra.
        </Text>
      </FeedbackModal>
    </View>
  )
}
