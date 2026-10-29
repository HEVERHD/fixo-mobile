import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useFocusEffect } from 'expo-router'
import { ShieldCheck, ChevronRight } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { fetchMyOrganization, type Organization } from '@/lib/organization'
import { OrgAvatar } from '@/components/OrgAvatar'
import { SignOutButton } from '@/components/ui'

export default function PerfilSuperAdmin() {
  const [name, setName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [org, setOrg] = useState<Organization | null>(null)
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)

  useFocusEffect(useCallback(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: profile }, myOrg] = await Promise.all([
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
        fetchMyOrganization(),
      ])
      setName(profile?.full_name ?? null)
      setEmail(user.email ?? null)
      setOrg(myOrg)
      setIsOrgAdmin(profile?.role === 'admin' && !!myOrg)
    })()
  }, []))

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Perfil</Text>

        <View className="bg-white rounded-2xl p-6 items-center mb-4 border border-gray-100">
          <View className="w-16 h-16 rounded-full bg-navy items-center justify-center mb-3">
            <ShieldCheck size={30} color="#fff" strokeWidth={1.8} />
          </View>
          <Text className="text-lg font-semibold text-gray-900">{name ?? 'Super administrador'}</Text>
          {email && <Text className="text-sm text-gray-500 mt-0.5">{email}</Text>}
          <View className="bg-highlight rounded-full px-3 py-1 mt-2">
            <Text className="text-navy text-xs font-bold">Super administrador</Text>
          </View>
        </View>

        {isOrgAdmin && org && (
          <TouchableOpacity
            onPress={() => router.push('/(admin)')}
            className="bg-white border border-gray-100 rounded-2xl p-4 flex-row items-center mb-3"
            accessibilityRole="button"
          >
            <OrgAvatar name={org.name} logoUrl={org.logo_url} size={36} />
            <View className="flex-1 ml-3">
              <Text className="font-medium text-gray-900">Ir al panel de mi empresa</Text>
              <Text className="text-xs text-gray-500" numberOfLines={1}>{org.name}</Text>
            </View>
            <ChevronRight size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

        <SignOutButton />
      </View>
    </SafeAreaView>
  )
}
