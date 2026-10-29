import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { HardHat } from 'lucide-react-native'
import { SignOutButton } from '@/components/ui'

export default function PerfilOperario() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Perfil</Text>
        <View className="bg-white rounded-2xl p-6 items-center mb-4 border border-gray-100">
          <View className="w-16 h-16 rounded-full bg-green-600 items-center justify-center mb-3">
            <HardHat size={30} color="#fff" strokeWidth={1.8} />
          </View>
          <Text className="text-lg font-semibold text-gray-900">Operario</Text>
          <View className="bg-green-100 rounded-full px-3 py-1 mt-2">
            <Text className="text-green-700 text-xs font-medium">Operario de Campo</Text>
          </View>
        </View>
        <SignOutButton />
      </View>
    </SafeAreaView>
  )
}
