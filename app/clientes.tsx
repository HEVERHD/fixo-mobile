import { useCallback, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useFocusEffect } from 'expo-router'
import { ChevronLeft, Building2, Mail, Phone, Plus, UserCheck, Clock, Send } from 'lucide-react-native'
import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { fetchMyOrganization } from '@/lib/organization'
import { INVITATION_FIELDS, cancelInvitation, shareInvitation, type Invitation } from '@/lib/invitations'
import { EmptyState, MetaRow } from '@/components/ui'

interface ClientRow {
  id: string
  company_name: string
  nit: string | null
  contact_email: string | null
  contact_phone: string | null
  user_id: string | null
}

export default function Clientes() {
  const [clients, setClients] = useState<ClientRow[] | null>(null)
  const [invites, setInvites] = useState<Invitation[]>([])
  const [orgName, setOrgName] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [{ data: c }, { data: i }, org] = await Promise.all([
      supabase.from('clients').select('id, company_name, nit, contact_email, contact_phone, user_id').order('company_name'),
      supabase.from('invitations').select(INVITATION_FIELDS).eq('role', 'cliente').is('accepted_at', null),
      fetchMyOrganization(),
    ])
    setClients((c ?? []) as ClientRow[])
    setInvites((i ?? []) as Invitation[])
    setOrgName(org?.name ?? '')
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const newClient = () => router.push('/nuevo-cliente')
  const invite = (c: ClientRow) =>
    router.push({ pathname: '/invitar', params: { role: 'cliente', clientId: c.id, ...(c.contact_email ? { email: c.contact_email } : {}) } })

  function confirmCancel(inv: Invitation) {
    Alert.alert('Cancelar invitación', `${inv.email} ya no podrá entrar con esta invitación.`, [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar invitación', style: 'destructive',
        onPress: async () => { if (await cancelInvitation(inv.id)) load() },
      },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="flex-row items-center px-4 py-2">
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Volver">
          <ChevronLeft size={26} color="#374151" />
        </TouchableOpacity>
      </View>

      {!clients ? (
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
          <Text className="text-2xl font-bold text-gray-900">Clientes</Text>
          <Text className="text-sm text-gray-500 mt-0.5 mb-4">
            {clients.length === 1 ? '1 cliente' : `${clients.length} clientes`}
          </Text>

          {clients.length === 0 ? (
            <View className="gap-4">
              <EmptyState
                icon={Building2}
                title="Aún no tienes clientes"
                message="Registra a quién le prestas servicio para crear órdenes, obras y equipos."
              />
              <TouchableOpacity
                onPress={newClient}
                className="h-12 rounded-2xl bg-primary flex-row items-center justify-center"
                accessibilityRole="button"
              >
                <Plus size={18} color="#fff" strokeWidth={2.4} />
                <Text className="text-white font-semibold ml-2">Crear cliente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {clients.map(client => {
                const pending = invites.find(i => i.client_id === client.id)
                return (
                  <View key={client.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-2">
                        <Text className="font-semibold text-gray-900">{client.company_name}</Text>
                        {client.nit && <Text className="text-xs text-gray-500 mt-0.5">NIT {client.nit}</Text>}
                      </View>
                      {client.user_id ? (
                        <View className="flex-row items-center rounded-full px-2.5 py-1 bg-green-100">
                          <UserCheck size={12} color="#15803d" />
                          <Text className="text-xs font-medium text-green-700 ml-1">Con acceso</Text>
                        </View>
                      ) : pending ? (
                        <View className="flex-row items-center rounded-full px-2.5 py-1 bg-amber-100">
                          <Clock size={12} color="#b45309" />
                          <Text className="text-xs font-medium text-amber-700 ml-1">Invitado</Text>
                        </View>
                      ) : null}
                    </View>
                    {client.contact_email && <MetaRow icon={Mail}>{client.contact_email}</MetaRow>}
                    {client.contact_phone && <MetaRow icon={Phone}>{client.contact_phone}</MetaRow>}

                    {!client.user_id && (
                      <View className="flex-row gap-2 mt-3">
                        {pending ? (
                          <>
                            <TouchableOpacity
                              onPress={() => shareInvitation(pending, orgName)}
                              className="flex-1 h-10 rounded-xl bg-blue-50 flex-row items-center justify-center"
                              accessibilityRole="button"
                            >
                              <Send size={15} color={colors.primary} />
                              <Text className="text-sm font-semibold text-primary ml-1.5">Reenviar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => confirmCancel(pending)}
                              className="h-10 px-4 rounded-xl bg-gray-100 items-center justify-center"
                              accessibilityRole="button"
                            >
                              <Text className="text-sm font-medium text-gray-600">Cancelar</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity
                            onPress={() => invite(client)}
                            className="flex-1 h-10 rounded-xl bg-blue-50 flex-row items-center justify-center"
                            accessibilityRole="button"
                          >
                            <Send size={15} color={colors.primary} />
                            <Text className="text-sm font-semibold text-primary ml-1.5">Invitar al portal</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}

      {clients && clients.length > 0 && (
        <TouchableOpacity
          onPress={newClient}
          activeOpacity={0.85}
          className="absolute right-5 bottom-6 h-14 pl-5 pr-6 rounded-full bg-primary flex-row items-center"
          style={{ elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
          accessibilityRole="button"
          accessibilityLabel="Crear nuevo cliente"
        >
          <Plus size={22} color="#fff" strokeWidth={2.4} />
          <Text className="text-white font-semibold text-base ml-2">Nuevo</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}
