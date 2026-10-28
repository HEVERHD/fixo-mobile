import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Building2 } from 'lucide-react-native'
import { SignOutButton } from '@/components/ui'

export default function PerfilCliente() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Perfil</Text>
        <View className="bg-white rounded-2xl p-6 items-center mb-4 border border-gray-100">
          <View className="w-16 h-16 rounded-full bg-purple-600 items-center justify-center mb-3">
            <Building2 size={30} color="#fff" strokeWidth={1.8} />
          </View>
          <Text className="text-lg font-semibold text-gray-900">Cliente</Text>
          <View className="bg-purple-100 rounded-full px-3 py-1 mt-2">
            <Text className="text-purple-700 text-xs font-medium">Portal Cliente</Text>
          </View>
        </View>
        <SignOutButton />
      </View>
    </SafeAreaView>
  )
}
