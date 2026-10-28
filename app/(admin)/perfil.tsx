import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useFocusEffect, type Href } from 'expo-router'
import { Camera, ShieldCheck, ChevronRight } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { pickAndUploadLogo, updateBusinessType, type BusinessType } from '@/lib/organization'
import { OrgAvatar } from '@/components/OrgAvatar'
import { SignOutButton } from '@/components/ui'
import { BusinessTypePicker } from '@/components/BusinessTypePicker'
import { useOrganization } from '@/components/OrganizationContext'

const UPLOAD_ERRORS = {
  'too-large': 'La imagen pesa más de 2 MB. Elige una más liviana.',
  'bad-type': 'Usa una imagen PNG, JPG o WebP.',
  failed: 'No pudimos subir el logo. Revisa tu conexión e inténtalo de nuevo.',
} as const

export default function PerfilAdmin() {
  // Shared with the tab bar, so changing the business type updates the tabs right away
  const { org, refresh } = useOrganization()
  const [name, setName] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savingType, setSavingType] = useState(false)

  useFocusEffect(useCallback(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: profile }, { data: isSuper }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.rpc('is_super_admin'),
      ])
      setName(profile?.full_name ?? null)
      setIsSuperAdmin(isSuper === true)
    })()
  }, []))

  async function changeLogo() {
    if (!org) return
    setUploading(true)
    const result = await pickAndUploadLogo(org.id)
    if (result.ok) await refresh()
    setUploading(false)
    if (!result.ok && result.reason !== 'canceled') {
      Alert.alert('Logo', UPLOAD_ERRORS[result.reason])
    }
  }

  async function changeBusinessType(type: BusinessType) {
    if (!org || type === org.business_type || savingType) return
    setSavingType(true)
    const ok = await updateBusinessType(org.id, type)
    if (ok) await refresh()
    setSavingType(false)
    if (!ok) Alert.alert('Tipo de empresa', 'No pudimos guardar el cambio. Inténtalo de nuevo.')
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Perfil</Text>

        {/* Company */}
        <Text className="text-sm font-semibold text-gray-500 uppercase mb-2">Mi empresa</Text>
        <View className="bg-white rounded-2xl p-6 items-center mb-6 border border-gray-100">
          <TouchableOpacity
            onPress={changeLogo}
            disabled={!org || uploading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Cambiar logo de la empresa"
          >
            {org ? <OrgAvatar name={org.name} logoUrl={org.logo_url} size={88} /> : <View className="w-[88px] h-[88px]" />}
            <View className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary items-center justify-center border-[3px] border-white">
              {uploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Camera size={16} color="#fff" strokeWidth={2.2} />}
            </View>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">{org?.name ?? ' '}</Text>
          <TouchableOpacity onPress={changeLogo} disabled={!org || uploading} hitSlop={8}>
            <Text className="text-sm font-medium text-primary mt-1">
              {org?.logo_url ? 'Cambiar logo' : 'Subir logo'}
            </Text>
          </TouchableOpacity>
          <Text className="text-xs text-gray-400 mt-1">Imagen cuadrada, PNG o JPG, máximo 2 MB</Text>
        </View>

        {/* Business type: decides which tabs and dashboard widgets are shown */}
        {org && (
          <View className={`mb-6 ${savingType ? 'opacity-60' : ''}`}>
            <BusinessTypePicker value={org.business_type} onChange={changeBusinessType} />
            <Text className="text-xs text-gray-400 mt-2">
              Define qué secciones ves: Equipos, Obras o ambas. Tus datos no se pierden al cambiarlo.
            </Text>
          </View>
        )}

        {/* Me */}
        <Text className="text-sm font-semibold text-gray-500 uppercase mb-2">Mi cuenta</Text>
        <View className="bg-white rounded-2xl p-4 flex-row items-center mb-3 border border-gray-100">
          <View className="flex-1">
            <Text className="font-medium text-gray-900">{name ?? ' '}</Text>
            <Text className="text-xs text-gray-500">Administrador</Text>
          </View>
          <View className="bg-blue-100 rounded-full px-3 py-1">
            <Text className="text-blue-700 text-xs font-medium">Admin</Text>
          </View>
        </View>

        {isSuperAdmin && (
          <TouchableOpacity
            onPress={() => router.push('/(superadmin)' as Href)}
            className="bg-white border border-gray-100 rounded-2xl p-4 flex-row items-center mb-3"
            accessibilityRole="button"
          >
            <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center mr-3">
              <ShieldCheck size={18} color="#d97706" strokeWidth={2} />
            </View>
            <Text className="font-medium text-gray-900 flex-1">Panel de plataforma</Text>
            <ChevronRight size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

        <SignOutButton />
      </ScrollView>
    </SafeAreaView>
  )
}
