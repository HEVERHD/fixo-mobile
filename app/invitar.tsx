import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { X, UserRound, Mail, Wrench, Building2, Send } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { fetchMyOrganization } from '@/lib/organization'
import { createInvitation, shareInvitation, normalizeEmail, ROLE_LABEL, type InviteRole } from '@/lib/invitations'
import { TextField } from '@/components/TextField'
import { SelectField, type SelectOption } from '@/components/SelectField'
import { ChipGroup } from '@/components/ChipGroup'
import { PrimaryButton } from '@/components/AuthLayout'
import { AppModal } from '@/components/AppModal'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Admin invites a technician or a client user. The person signs up with the
 * same email; claim_my_invitation() links them once the email is confirmed.
 */
export default function Invitar() {
  const params = useLocalSearchParams<{ role?: InviteRole; clientId?: string; email?: string }>()
  const insets = useSafeAreaInsets()

  const [role, setRole] = useState<InviteRole>(params.role === 'cliente' ? 'cliente' : 'operario')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState(params.email ?? '')
  const [specialty, setSpecialty] = useState('')
  const [clientId, setClientId] = useState<string | null>(params.clientId ?? null)

  const [clients, setClients] = useState<SelectOption[]>([])
  const [orgName, setOrgName] = useState('')
  const [errors, setErrors] = useState<{ email?: string; client?: string }>({})
  const [saving, setSaving] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    // Clients that already have a portal user can't be invited again
    supabase.from('clients').select('id, company_name, contact_email').is('user_id', null).order('company_name')
      .then(({ data }) => setClients((data ?? []).map(c => ({ id: c.id, label: c.company_name, sublabel: c.contact_email }))))
    fetchMyOrganization().then(org => setOrgName(org?.name ?? 'Tu empresa'))
  }, [])

  async function save() {
    const next: typeof errors = {}
    if (!EMAIL_RE.test(email.trim())) next.email = 'Escribe un correo válido'
    if (role === 'cliente' && !clientId) next.client = 'Elige el cliente'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    const ok = await createInvitation({ email, role, fullName, specialty, clientId })
    setSaving(false)

    if (!ok) {
      Alert.alert('No se pudo crear la invitación', 'Revisa tu conexión e inténtalo de nuevo.')
      return
    }
    setSent(true)
  }

  const share = () =>
    shareInvitation({ email: normalizeEmail(email), role, full_name: fullName.trim() || null }, orgName)

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <View className="flex-row items-center px-4 pb-3 bg-white border-b border-gray-100" style={{ paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancelar">
          <X size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-4">Invitar a Fixo</Text>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={96}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 20 }}
      >
        <ChipGroup
          label="¿A quién invitas?"
          value={role}
          onChange={r => { setRole(r); setErrors({}) }}
          options={[
            { value: 'operario', label: 'Técnico' },
            { value: 'cliente', label: 'Cliente' },
          ]}
        />

        {role === 'cliente' && (
          <SelectField
            label="Cliente"
            icon={Building2}
            placeholder="¿De qué cliente es?"
            options={clients}
            value={clientId}
            onChange={id => { setClientId(id); setErrors(e => ({ ...e, client: undefined })) }}
            error={errors.client}
            emptyText="Todos tus clientes ya tienen acceso, o aún no has creado ninguno"
          />
        )}

        <TextField
          label="Nombre (opcional)"
          icon={UserRound}
          placeholder="Nombre y apellido"
          autoCapitalize="words"
          value={fullName}
          onChangeText={setFullName}
        />

        <TextField
          label="Correo"
          icon={Mail}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={t => { setEmail(t); if (errors.email) setErrors(e => ({ ...e, email: undefined })) }}
          error={errors.email}
        />

        {role === 'operario' && (
          <TextField
            label="Especialidad (opcional)"
            icon={Wrench}
            placeholder="Ej. Refrigeración, eléctrico, hidráulico"
            value={specialty}
            onChangeText={setSpecialty}
          />
        )}

        <Text className="text-xs text-gray-500 -mt-2">
          La persona debe crear su cuenta en Fixo con este mismo correo. Al confirmarlo entrará directo a tu
          empresa como {ROLE_LABEL[role]}. La invitación vence en 14 días.
        </Text>

        <PrimaryButton label="Crear invitación" onPress={save} loading={saving} className="mt-2" />
      </KeyboardAwareScrollView>

      <AppModal
        visible={sent}
        variant="success"
        icon={Send}
        title="Invitación lista"
        actionLabel="Compartir por WhatsApp u otra app"
        onAction={share}
        secondaryLabel="Listo"
        onSecondary={() => { setSent(false); router.back() }}
      >
        <Text className="text-base text-gray-600 text-center">
          Envíale el enlace a <Text className="font-semibold text-gray-900">{normalizeEmail(email)}</Text> para que
          cree su cuenta.
        </Text>
      </AppModal>
    </View>
  )
}
