import { View, ActivityIndicator, Image } from 'react-native'
import { StatusBar } from 'expo-status-bar'

// Root index — _layout.tsx handles redirect based on session/role.
// Matches the native splash (navy + logo) so the hand-off is seamless.
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-navy">
      <StatusBar style="light" />
      <Image
        source={require('@/assets/splash-icon.png')}
        className="w-40 h-40 mb-8"
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <ActivityIndicator size="large" color="#fff" />
    </View>
  )
}
