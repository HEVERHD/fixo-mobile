import { View, Text, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SignOutButton } from '@/components/ui'

export default function PerfilAdmin() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Perfil</Text>

        <View className="bg-white rounded-2xl p-6 items-center mb-4 border border-gray-100">
          <View className="w-16 h-16 rounded-full bg-navy items-center justify-center mb-3">
            <Image
              source={require('@/assets/splash-icon.png')}
              className="w-10 h-10"
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <Text className="text-lg font-semibold text-gray-900">Administrador</Text>
          <View className="bg-blue-100 rounded-full px-3 py-1 mt-2">
            <Text className="text-blue-700 text-xs font-medium">Admin</Text>
          </View>
        </View>

        <SignOutButton />
      </View>
    </SafeAreaView>
  )
}
