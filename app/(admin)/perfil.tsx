import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'

export default function PerfilAdmin() {
  async function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Deseas salir de Fixo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => { await supabase.auth.signOut() },
      },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Perfil</Text>

        <View className="bg-white rounded-2xl p-6 items-center mb-4 shadow-sm">
          <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-white text-2xl">⚡</Text>
          </View>
          <Text className="text-lg font-semibold text-gray-900">Administrador</Text>
          <View className="bg-blue-100 rounded-full px-3 py-1 mt-2">
            <Text className="text-blue-700 text-xs font-medium">Admin</Text>
          </View>
        </View>

        <TouchableOpacity
          className="bg-red-50 rounded-2xl p-4 flex-row items-center"
          onPress={handleSignOut}
        >
          <Text className="text-red-600 font-medium flex-1">Cerrar sesión</Text>
          <Text className="text-red-400">→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
