import { useCallback, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useFocusEffect } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, HardHat, Wrench, Mail, Plus, Send, Clock } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { fetchMyOrganization } from '@/lib/organization'
import { INVITATION_FIELDS, cancelInvitation, shareInvitation, type Invitation } from '@/lib/invitations'
import { EmptyState, MetaRow } from '@/components/ui'

interface OperatorRow {
  id: string
  specialty: string | null
  profiles: { full_name: string | null } | null
}

export default function Tecnicos() {
  const [operators, setOperators] = useState<OperatorRow[] | null>(null)
  const [invites, setInvites] = useState<Invitation[]>([])
  const [orgName, setOrgName] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [{ data: o }, { data: i }, org] = await Promise.all([
      supabase.from('operators').select('id, specialty, profiles(full_name)'),
      supabase.from('invitations').select(INVITATION_FIELDS).eq('role', 'operario').is('accepted_at', null)
        .order('created_at', { ascending: false }),
      fetchMyOrganization(),
    ])
    setOperators((o ?? []) as unknown as OperatorRow[])
    setInvites((i ?? []) as Invitation[])
    setOrgName(org?.name ?? '')
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const inviteTech = () => router.push({ pathname: '/invitar', params: { role: 'operario' } })

  function confirmCancel(inv: Invitation) {
    Alert.alert('Cancelar invitación', `${inv.email} ya no podrá entrar con esta invitación.`, [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar invitación', style: 'destructive',
        onPress: async () => { if (await cancelInvitation(inv.id)) load() },
      },
    ])
  }

  const empty = operators?.length === 0 && invites.length === 0

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="flex-row items-center px-4 py-2">
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Volver">
          <ChevronLeft size={26} color="#374151" />
        </TouchableOpacity>
      </View>

      {!operators ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-28"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load() }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Text className="text-2xl font-bold text-gray-900">Técnicos</Text>
          <Text className="text-sm text-gray-500 mt-0.5 mb-4">
            {operators.length === 1 ? '1 técnico activo' : `${operators.length} técnicos activos`}
          </Text>

          {empty ? (
            <View className="gap-4">
              <EmptyState
                icon={HardHat}
                title="Aún no tienes técnicos"
                message="Invita a tu equipo de campo para asignarles órdenes de trabajo."
              />
              <TouchableOpacity
                onPress={inviteTech}
                className="h-12 rounded-2xl bg-primary flex-row items-center justify-center"
                accessibilityRole="button"
              >
                <Plus size={18} color="#fff" strokeWidth={2.4} />
                <Text className="text-white font-semibold ml-2">Invitar técnico</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {operators.length > 0 && (
                <View className="bg-white rounded-2xl border border-gray-100 px-4 mb-6">
                  {operators.map((op, i) => (
                    <View key={op.id} className={`flex-row items-center py-3.5 ${i === operators.length - 1 ? '' : 'border-b border-gray-100'}`}>
                      <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                        <HardHat size={18} color={colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">{op.profiles?.full_name ?? 'Técnico'}</Text>
                        {op.specialty && <MetaRow icon={Wrench} className="mt-0.5">{op.specialty}</MetaRow>}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {invites.length > 0 && (
                <>
                  <Text className="text-sm font-semibold text-gray-500 uppercase mb-2">Invitaciones pendientes</Text>
                  <View className="gap-3">
                    {invites.map(inv => (
                      <View key={inv.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                        <Text className="font-semibold text-gray-900">{inv.full_name ?? inv.email}</Text>
                        {inv.full_name && <MetaRow icon={Mail}>{inv.email}</MetaRow>}
                        <MetaRow icon={Clock}>
                          Vence el {format(parseISO(inv.expires_at), "d 'de' MMMM", { locale: es })}
                        </MetaRow>
                        <View className="flex-row gap-2 mt-3">
                          <TouchableOpacity
                            onPress={() => shareInvitation(inv, orgName)}
                            className="flex-1 h-10 rounded-xl bg-blue-50 flex-row items-center justify-center"
                            accessibilityRole="button"
                          >
                            <Send size={15} color={colors.primary} />
                            <Text className="text-sm font-semibold text-primary ml-1.5">Reenviar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => confirmCancel(inv)}
                            className="h-10 px-4 rounded-xl bg-gray-100 items-center justify-center"
                            accessibilityRole="button"
                          >
                            <Text className="text-sm font-medium text-gray-600">Cancelar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {!empty && operators && (
        <TouchableOpacity
          onPress={inviteTech}
          activeOpacity={0.85}
          className="absolute right-5 bottom-6 h-14 pl-5 pr-6 rounded-full bg-primary flex-row items-center"
          style={{ elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
          accessibilityRole="button"
          accessibilityLabel="Invitar técnico"
        >
          <Plus size={22} color="#fff" strokeWidth={2.4} />
          <Text className="text-white font-semibold text-base ml-2">Invitar</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}
