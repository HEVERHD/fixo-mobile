import { useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { X, Building2, FileText, MapPin, Mail, Phone, CircleCheckBig } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { TextField } from '@/components/TextField'
import { PrimaryButton } from '@/components/AuthLayout'
import { AppModal } from '@/components/AppModal'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function NuevoCliente() {
  const insets = useSafeAreaInsets()

  const [name, setName] = useState('')
  const [nit, setNit] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<{ id: string; name: string; email: string | null } | null>(null)

  async function save() {
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Escribe el nombre del cliente'
    if (email.trim() && !EMAIL_RE.test(email.trim())) next.email = 'Correo inválido'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    const { data, error } = await supabase
      .from('clients')
      .insert({
        company_name: name.trim(),
        nit: nit.trim() || null,
        address: address.trim() || null,
        contact_email: email.trim().toLowerCase() || null,
        contact_phone: phone.trim() || null,
      })
      .select('id')
      .single()
    setSaving(false)

    if (error || !data) {
      Alert.alert('No se pudo crear el cliente', 'Revisa tu conexión e inténtalo de nuevo.')
      return
    }
    setCreated({ id: data.id, name: name.trim(), email: email.trim().toLowerCase() || null })
  }

  function invite() {
    if (!created) return
    const params = { role: 'cliente', clientId: created.id, ...(created.email ? { email: created.email } : {}) }
    setCreated(null)
    router.replace({ pathname: '/invitar', params })
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <View className="flex-row items-center px-4 pb-3 bg-white border-b border-gray-100" style={{ paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancelar">
          <X size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-4">Nuevo cliente</Text>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={96}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 20 }}
      >
        <TextField
          label="Nombre o razón social"
          icon={Building2}
          placeholder="Ej. Clínica San Rafael"
          autoCapitalize="words"
          value={name}
          onChangeText={t => { setName(t); if (errors.name) setErrors(e => ({ ...e, name: undefined })) }}
          error={errors.name}
        />

        <TextField
          label="NIT o cédula (opcional)"
          icon={FileText}
          placeholder="900123456-1"
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
          value={nit}
          onChangeText={setNit}
        />

        <TextField
          label="Dirección (opcional)"
          icon={MapPin}
          placeholder="Dónde están sus instalaciones"
          value={address}
          onChangeText={setAddress}
        />

        <TextField
          label="Correo de contacto (opcional)"
          icon={Mail}
          placeholder="mantenimiento@cliente.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={t => { setEmail(t); if (errors.email) setErrors(e => ({ ...e, email: undefined })) }}
          error={errors.email}
        />

        <TextField
          label="Teléfono (opcional)"
          icon={Phone}
          placeholder="300 123 4567"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <PrimaryButton label="Crear cliente" onPress={save} loading={saving} className="mt-2" />
      </KeyboardAwareScrollView>

      <AppModal
        visible={created !== null}
        variant="success"
        icon={CircleCheckBig}
        title="¡Cliente creado!"
        actionLabel="Invitar al portal"
        onAction={invite}
        secondaryLabel="Ahora no"
        onSecondary={() => { setCreated(null); router.back() }}
      >
        <Text className="text-base text-gray-600 text-center">
          <Text className="font-semibold text-gray-900">{created?.name}</Text> quedó registrado. Si lo invitas al
          portal podrá ver sus equipos, órdenes y reportes desde la app.
        </Text>
      </AppModal>
    </View>
  )
}
